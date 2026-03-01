// ═══════════════════════════════════════════════════════════════
// THE HIVE OS V4 - Stripe Webhook Handler
// Syncs subscription status between Stripe and Supabase
// ═══════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.5.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature');
  const body = await req.text();

  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  try {
    // Verify webhook signature
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('Missing STRIPE_WEBHOOK_SECRET');
    }

    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );

    console.log(`[Stripe Webhook] Event: ${event.type}`);

    // Initialize Supabase Admin client (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session, supabaseAdmin);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription, supabaseAdmin);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription, supabaseAdmin);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice, supabaseAdmin);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice, supabaseAdmin);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('[Stripe Webhook] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

// ─────────────────────────────────────────────────────────────────
// Handle checkout.session.completed
// ─────────────────────────────────────────────────────────────────

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  supabase: any
) {
  const userId = session.metadata?.supabase_user_id;
  const plan = session.metadata?.plan;

  if (!userId || !plan) {
    console.error('[Webhook] Missing metadata:', session.metadata);
    return;
  }

  // Get subscription details
  const subscriptionId = session.subscription as string;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Update or insert subscription
  const { error } = await supabase.from('subscriptions').upsert({
    user_id: userId,
    stripe_customer_id: session.customer as string,
    stripe_subscription_id: subscriptionId,
    stripe_price_id: subscription.items.data[0].price.id,
    plan,
    status: 'active',
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error('[Webhook] Error updating subscription:', error);
  } else {
    console.log(`[Webhook] ✅ Subscription created for user ${userId}`);
  }
}

// ─────────────────────────────────────────────────────────────────
// Handle customer.subscription.updated
// ─────────────────────────────────────────────────────────────────

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  supabase: any
) {
  const userId = subscription.metadata?.supabase_user_id;
  const plan = subscription.metadata?.plan;

  if (!userId) {
    console.error('[Webhook] Missing user_id in metadata');
    return;
  }

  // Map Stripe status to our status
  let status = 'inactive';
  if (subscription.status === 'active') status = 'active';
  else if (subscription.status === 'past_due') status = 'past_due';
  else if (subscription.status === 'canceled') status = 'canceled';

  const { error } = await supabase
    .from('subscriptions')
    .update({
      stripe_price_id: subscription.items.data[0].price.id,
      plan: plan || 'free',
      status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('[Webhook] Error updating subscription:', error);
  } else {
    console.log(`[Webhook] ✅ Subscription updated for user ${userId}`);
  }
}

// ─────────────────────────────────────────────────────────────────
// Handle customer.subscription.deleted
// ─────────────────────────────────────────────────────────────────

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: any
) {
  const userId = subscription.metadata?.supabase_user_id;

  if (!userId) {
    console.error('[Webhook] Missing user_id in metadata');
    return;
  }

  // Downgrade to free plan
  const { error } = await supabase
    .from('subscriptions')
    .update({
      plan: 'free',
      status: 'canceled',
      stripe_subscription_id: null,
      stripe_price_id: null,
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('[Webhook] Error canceling subscription:', error);
  } else {
    console.log(`[Webhook] ✅ Subscription canceled, downgraded to free for user ${userId}`);
  }
}

// ─────────────────────────────────────────────────────────────────
// Handle invoice.payment_succeeded
// ─────────────────────────────────────────────────────────────────

async function handlePaymentSucceeded(invoice: Stripe.Invoice, supabase: any) {
  if (!invoice.subscription) return;

  const subscription = await stripe.subscriptions.retrieve(
    invoice.subscription as string
  );
  const userId = subscription.metadata?.supabase_user_id;

  if (!userId) return;

  // Ensure subscription is active
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('[Webhook] Error updating subscription after payment:', error);
  } else {
    console.log(`[Webhook] ✅ Payment succeeded for user ${userId}`);
  }
}

// ─────────────────────────────────────────────────────────────────
// Handle invoice.payment_failed
// ─────────────────────────────────────────────────────────────────

async function handlePaymentFailed(invoice: Stripe.Invoice, supabase: any) {
  if (!invoice.subscription) return;

  const subscription = await stripe.subscriptions.retrieve(
    invoice.subscription as string
  );
  const userId = subscription.metadata?.supabase_user_id;

  if (!userId) return;

  // Mark subscription as past_due
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('[Webhook] Error updating subscription after failed payment:', error);
  } else {
    console.log(`[Webhook] ⚠️ Payment failed for user ${userId}`);
  }
}
