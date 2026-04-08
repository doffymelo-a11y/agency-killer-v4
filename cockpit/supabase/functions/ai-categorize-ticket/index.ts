/**
 * Edge Function: ai-categorize-ticket
 *
 * Uses Claude API to intelligently categorize support tickets:
 * - Suggests category (bug, feature_request, question, billing, integration, other)
 * - Suggests priority (low, medium, high, critical)
 * - Analyzes sentiment (positive, neutral, negative, frustrated, urgent)
 * - Calculates urgency score (1-10)
 * - Provides reasoning for suggestions
 *
 * Can be triggered:
 * - Automatically via trigger on new ticket creation
 * - Manually from frontend UI ("Get AI Suggestion" button)
 * - Batch processing via cron for existing tickets
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import Anthropic from 'npm:@anthropic-ai/sdk@0.27.3';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

interface AnalyzeTicketRequest {
  ticket_id?: string; // If provided, will fetch ticket data
  subject?: string; // Or provide subject + description directly
  description?: string;
}

interface AIAnalysisResult {
  suggested_category: 'bug' | 'feature_request' | 'question' | 'billing' | 'integration' | 'other';
  suggested_priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0.0 to 1.0
  reasoning: string;
  sentiment: 'positive' | 'neutral' | 'negative' | 'frustrated' | 'urgent';
  urgency_score: number; // 1-10
}

// ─────────────────────────────────────────────────────────────────
// Main Handler
// ─────────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')!;

    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const anthropic = new Anthropic({ apiKey: anthropicApiKey });

    const body: AnalyzeTicketRequest = await req.json();

    // Get ticket data
    let subject: string;
    let description: string;
    let ticketId: string | undefined;

    if (body.ticket_id) {
      // Fetch ticket from database
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .select('id, subject, description')
        .eq('id', body.ticket_id)
        .single();

      if (ticketError || !ticket) {
        throw new Error(`Ticket not found: ${body.ticket_id}`);
      }

      subject = ticket.subject;
      description = ticket.description;
      ticketId = ticket.id;
    } else if (body.subject && body.description) {
      // Use provided data (for preview mode)
      subject = body.subject;
      description = body.description;
    } else {
      throw new Error('Must provide either ticket_id or (subject + description)');
    }

    console.log(`[AI Categorization] Analyzing ticket: "${subject}"`);

    // Call Claude API
    const result = await analyzeWithClaude(anthropic, subject, description);

    console.log('[AI Categorization] Analysis complete:', result);

    // If ticket_id provided, save results to database
    if (ticketId) {
      const { error: updateError } = await supabase.rpc('update_ticket_ai_analysis', {
        p_ticket_id: ticketId,
        p_suggested_category: result.suggested_category,
        p_suggested_priority: result.suggested_priority,
        p_confidence: result.confidence,
        p_reasoning: result.reasoning,
        p_sentiment: result.sentiment,
        p_urgency_score: result.urgency_score,
      });

      if (updateError) {
        console.error('[AI Categorization] Error saving results:', updateError);
        throw updateError;
      }

      console.log(`[AI Categorization] Results saved for ticket ${ticketId}`);
    }

    return new Response(JSON.stringify({
      success: true,
      analysis: result,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[AI Categorization] Error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

// ─────────────────────────────────────────────────────────────────
// AI Analysis with Claude
// ─────────────────────────────────────────────────────────────────

async function analyzeWithClaude(
  anthropic: Anthropic,
  subject: string,
  description: string
): Promise<AIAnalysisResult> {
  const prompt = `Vous êtes un expert en analyse de tickets de support technique. Analysez ce ticket et fournissez une catégorisation précise.

TICKET:
Sujet: ${subject}
Description: ${description}

CATÉGORIES DISPONIBLES:
- bug: Problème technique/bug logiciel (ex: fonctionnalité cassée, erreur, dysfonctionnement)
- feature_request: Demande de nouvelle fonctionnalité ou amélioration
- question: Question générale sur l'utilisation du produit
- billing: Problème de facturation, paiement, abonnement
- integration: Problème d'intégration avec un service tiers (API, WordPress, Google Ads, etc.)
- other: Autre type de demande

PRIORITÉS:
- critical: Bug bloquant qui empêche l'utilisation du produit, perte de données, sécurité compromise
- high: Bug important affectant des fonctionnalités clés, demande urgente d'un client payant
- medium: Bug mineur, feature request importante, question complexe
- low: Question simple, suggestion d'amélioration non urgente

SENTIMENT:
- positive: Ton amical, patient, constructif
- neutral: Ton professionnel, factuel
- negative: Ton mécontent, déçu
- frustrated: Ton énervé, impatient, multiples plaintes
- urgent: Ton pressant, indique une urgence métier

URGENCY SCORE (1-10):
1-3: Peut attendre plusieurs jours
4-6: Réponse souhaitée dans 24-48h
7-8: Réponse souhaitée rapidement (< 24h)
9-10: Urgence critique, réponse immédiate nécessaire

Répondez UNIQUEMENT avec un objet JSON valide (pas de markdown, pas de texte avant/après):
{
  "suggested_category": "bug|feature_request|question|billing|integration|other",
  "suggested_priority": "low|medium|high|critical",
  "confidence": 0.85,
  "reasoning": "Brève explication (1-2 phrases) justifiant votre choix",
  "sentiment": "positive|neutral|negative|frustrated|urgent",
  "urgency_score": 7
}`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 500,
    temperature: 0.3, // Low temperature for consistency
    messages: [{
      role: 'user',
      content: prompt,
    }],
  });

  const responseText = message.content[0].type === 'text'
    ? message.content[0].text
    : '';

  // Parse JSON response
  try {
    // Remove potential markdown code blocks
    const cleanedResponse = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const result = JSON.parse(cleanedResponse) as AIAnalysisResult;

    // Validate confidence is between 0 and 1
    if (result.confidence < 0 || result.confidence > 1) {
      result.confidence = Math.max(0, Math.min(1, result.confidence));
    }

    // Validate urgency_score is between 1 and 10
    if (result.urgency_score < 1 || result.urgency_score > 10) {
      result.urgency_score = Math.max(1, Math.min(10, result.urgency_score));
    }

    return result;
  } catch (parseError: any) {
    console.error('[AI Categorization] Failed to parse Claude response:', responseText);
    throw new Error(`Invalid AI response: ${parseError.message}`);
  }
}

/**
 * Usage Examples:
 *
 * 1. Analyze existing ticket:
 *    POST /functions/v1/ai-categorize-ticket
 *    { "ticket_id": "uuid-here" }
 *
 * 2. Preview analysis (without saving):
 *    POST /functions/v1/ai-categorize-ticket
 *    {
 *      "subject": "Le pixel Meta ne track pas les conversions",
 *      "description": "Bonjour, j'ai installé le pixel Meta sur mon site..."
 *    }
 *
 * 3. Batch process (via separate cron function):
 *    - Call get_tickets_needing_ai_categorization()
 *    - For each ticket, invoke this function with ticket_id
 */
