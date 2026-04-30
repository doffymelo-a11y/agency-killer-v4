/**
 * AI Triage Service
 * Uses Claude to analyze support tickets and suggest:
 * - Category
 * - Priority
 * - Likely files involved
 * - Suggested response
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export interface AITriageResult {
  suggested_category: string;
  suggested_priority: string;
  likely_files: string[];
  suggested_response: string;
  confidence: number; // 0-1
  reasoning: string;
}

/**
 * Analyze a ticket using Claude and provide triage suggestions
 */
export async function analyzeTicket(
  subject: string,
  description: string,
  category: string,
  priority: string
): Promise<AITriageResult | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('[AI Triage] ANTHROPIC_API_KEY not configured, skipping analysis');
    return null;
  }

  try {
    const prompt = buildTriagePrompt(subject, description, category, priority);

    const message = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1024,
      temperature: 0.3, // Lower temperature for more consistent categorization
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse JSON response
    const result = parseTriageResponse(responseText);

    console.log('[AI Triage] Analysis completed:', {
      category: result.suggested_category,
      priority: result.suggested_priority,
      confidence: result.confidence,
      files_count: result.likely_files.length,
    });

    return result;
  } catch (error) {
    console.error('[AI Triage] Error analyzing ticket:', error);
    return null;
  }
}

/**
 * Build the prompt for Claude
 */
function buildTriagePrompt(
  subject: string,
  description: string,
  userCategory: string,
  userPriority: string
): string {
  return `You are an AI support triage assistant for "The Hive OS" - a marketing automation SaaS platform that helps agencies manage:
- SEO optimization and keyword research
- Google Analytics tracking and reporting
- Google Ads campaign management
- Google Tag Manager setup
- WordPress integrations
- Landing page creation and CMS management

Analyze this support ticket and provide triage recommendations in JSON format.

**Ticket Details:**
Subject: ${subject}
Description: ${description}
User's category: ${userCategory}
User's priority: ${userPriority}

**Your task:**
1. Suggest the best category (bug, feature_request, question, billing, integration, other)
2. Suggest the appropriate priority (low, medium, high, critical)
3. Identify likely files/components involved (e.g., "WordPress connector", "Google Ads API", "Landing page builder", "GA4 tracking")
4. Provide a brief suggested response for the admin (2-3 sentences)
5. Rate your confidence (0.0 to 1.0)
6. Explain your reasoning briefly

**Important context:**
- Bugs that prevent core functionality = critical
- Tracking issues (pixels not firing, GA4 not working) = high priority
- API integration failures = high priority
- Feature requests and questions = usually low or medium
- Billing issues = medium priority
- If user says "urgent" or "not working", consider high priority

Respond with ONLY valid JSON in this exact format:
{
  "suggested_category": "bug|feature_request|question|billing|integration|other",
  "suggested_priority": "low|medium|high|critical",
  "likely_files": ["component1", "component2"],
  "suggested_response": "Brief response suggestion",
  "confidence": 0.85,
  "reasoning": "Brief explanation of your analysis"
}`;
}

/**
 * Parse Claude's JSON response
 */
function parseTriageResponse(responseText: string): AITriageResult {
  try {
    // Extract JSON from response (in case Claude adds extra text)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate and return
    return {
      suggested_category: parsed.suggested_category || 'other',
      suggested_priority: parsed.suggested_priority || 'medium',
      likely_files: Array.isArray(parsed.likely_files) ? parsed.likely_files : [],
      suggested_response: parsed.suggested_response || '',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
      reasoning: parsed.reasoning || '',
    };
  } catch (error) {
    console.error('[AI Triage] Error parsing response:', error);

    // Return safe defaults
    return {
      suggested_category: 'other',
      suggested_priority: 'medium',
      likely_files: [],
      suggested_response: 'Our team will review your ticket and respond shortly.',
      confidence: 0.0,
      reasoning: 'Failed to parse AI response',
    };
  }
}
