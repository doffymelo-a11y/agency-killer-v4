// ═══════════════════════════════════════════════════════════════
// Edge Function: Generate Ticket Embedding (OpenAI)
// Phase 3 - Duplicate Detection
// ═══════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4.20.1';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface GenerateEmbeddingRequest {
  ticket_id: string;
  text?: string; // If not provided, will fetch from ticket
  find_similar?: boolean; // Whether to return similar tickets
}

interface SimilarTicket {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  similarity: number;
}

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { ticket_id, text, find_similar = true }: GenerateEmbeddingRequest = await req.json();

    if (!ticket_id) {
      return new Response(
        JSON.stringify({ error: 'ticket_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get ticket text if not provided
    let ticketText = text;
    if (!ticketText) {
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .select('subject, description')
        .eq('id', ticket_id)
        .single();

      if (ticketError || !ticket) {
        return new Response(
          JSON.stringify({ error: 'Ticket not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      ticketText = `${ticket.subject}\n\n${ticket.description}`;
    }

    // Generate embedding using OpenAI
    console.log(`[Embedding] Generating embedding for ticket ${ticket_id}...`);
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: ticketText,
    });

    const embedding = embeddingResponse.data[0].embedding;

    // Store embedding in database
    const { error: updateError } = await supabase
      .from('support_tickets')
      .update({
        embedding: JSON.stringify(embedding), // pgvector expects array as JSON string
        embedding_generated_at: new Date().toISOString(),
      })
      .eq('id', ticket_id);

    if (updateError) {
      console.error('[Embedding] Error storing embedding:', updateError);
      throw updateError;
    }

    console.log(`[Embedding] Embedding stored successfully for ticket ${ticket_id}`);

    // Find similar tickets if requested
    let similarTickets: SimilarTicket[] = [];
    if (find_similar) {
      const { data: similar, error: similarError } = await supabase.rpc(
        'find_similar_tickets',
        {
          ticket_embedding: JSON.stringify(embedding),
          current_ticket_id: ticket_id,
          similarity_threshold: 0.80,
          limit_count: 5,
        }
      );

      if (similarError) {
        console.error('[Embedding] Error finding similar tickets:', similarError);
      } else {
        similarTickets = similar || [];
        console.log(`[Embedding] Found ${similarTickets.length} similar tickets`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        ticket_id,
        embedding_dimensions: embedding.length,
        similar_tickets: similarTickets,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: any) {
    console.error('[Embedding] Error:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error.toString(),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
