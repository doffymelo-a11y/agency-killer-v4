// ═══════════════════════════════════════════════════════════════
// THE HIVE OS V4 - Stripe Checkout Edge Function
// Creates a Stripe Checkout session for Pro/Enterprise upgrades
// ═══════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.5.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { plan, user_id, user_email } = await req.json();

    if (!plan || !user_id || !user_email) {
      throw new Error('Missing required fields: plan, user_id, user_email');
    }

    if (plan !== 'pro' && plan !== 'enterprise') {
      throw new Error('Invalid plan. Must be "pro" or "enterprise"');
    }

    // Price IDs from your Stripe Dashboard
    // TODO: Replace with your actual Stripe Price IDs
    const priceIds = {
      pro: Deno.env.get('STRIPE_PRICE_ID_PRO'),
      enterprise: Deno.env.get('STRIPE_PRICE_ID_ENTERPRISE'),
    };

    const priceId = priceIds[plan];

    if (!priceId) {
      throw new Error(`Missing Stripe Price ID for plan: ${plan}`);
    }

    // Create or retrieve Stripe customer
    const customers = await stripe.customers.list({
      email: user_email,
      limit: 1,
    });

    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user_email,
        metadata: {
          supabase_user_id: user_id,
        },
      });
      customerId = customer.id;
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${Deno.env.get('APP_URL')}/billing?success=true`,
      cancel_url: `${Deno.env.get('APP_URL')}/billing?canceled=true`,
      metadata: {
        supabase_user_id: user_id,
        plan,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user_id,
          plan,
        },
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('[Stripe Checkout] Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred creating checkout session',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
