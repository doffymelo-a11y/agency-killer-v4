// ═══════════════════════════════════════════════════════════════
// THE HIVE OS V4 - Stripe Service
// Handles Stripe checkout and subscription management
// ═══════════════════════════════════════════════════════════════

import { supabase } from '../lib/supabase';

export type PlanType = 'free' | 'pro' | 'enterprise';

export interface SubscriptionInfo {
  plan: PlanType;
  status: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
}

export interface UsageInfo {
  projects_created: number;
  tasks_created: number;
  chat_messages: number;
  agent_calls: number;
}

export interface PlanLimits {
  plan: PlanType;
  max_projects: number | null;
  max_tasks_per_month: number | null;
  max_chat_messages_per_month: number | null;
  max_agent_calls_per_month: number | null;
  price_monthly_cents: number;
  features: string[];
}

// ─────────────────────────────────────────────────────────────────
// Get user subscription
// ─────────────────────────────────────────────────────────────────

export async function getUserSubscription(): Promise<SubscriptionInfo | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('plan, status, current_period_end, cancel_at_period_end')
    .single();

  if (error) {
    console.error('[Stripe] Error fetching subscription:', error);
    // Return free plan as default
    return { plan: 'free', status: 'active' };
  }

  return data as SubscriptionInfo;
}

// ─────────────────────────────────────────────────────────────────
// Get current month usage
// ─────────────────────────────────────────────────────────────────

export async function getCurrentUsage(): Promise<UsageInfo | null> {
  const today = new Date();
  const periodStart = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split('T')[0];

  const { data, error } = await supabase
    .from('usage_tracking')
    .select('projects_created, tasks_created, chat_messages, agent_calls')
    .eq('period_start', periodStart)
    .single();

  if (error) {
    console.error('[Stripe] Error fetching usage:', error);
    return {
      projects_created: 0,
      tasks_created: 0,
      chat_messages: 0,
      agent_calls: 0,
    };
  }

  return data as UsageInfo;
}

// ─────────────────────────────────────────────────────────────────
// Get all plan limits
// ─────────────────────────────────────────────────────────────────

export async function getAllPlanLimits(): Promise<PlanLimits[]> {
  const { data, error } = await supabase
    .from('plan_limits')
    .select('*')
    .order('price_monthly_cents', { ascending: true });

  if (error) {
    console.error('[Stripe] Error fetching plan limits:', error);
    return [];
  }

  return data as PlanLimits[];
}

// ─────────────────────────────────────────────────────────────────
// Create Stripe Checkout Session
// ─────────────────────────────────────────────────────────────────

export async function createCheckoutSession(
  plan: 'pro' | 'enterprise'
): Promise<{ url: string } | { error: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Non authentifié' };
    }

    // Call Supabase Edge Function to create checkout session
    const { data, error } = await supabase.functions.invoke('stripe-checkout', {
      body: {
        plan,
        user_id: user.id,
        user_email: user.email,
      },
    });

    if (error) {
      console.error('[Stripe] Error creating checkout session:', error);
      return { error: error.message };
    }

    if (!data?.url) {
      return { error: 'Impossible de créer la session de paiement' };
    }

    return { url: data.url };
  } catch (error) {
    console.error('[Stripe] Unexpected error:', error);
    return { error: 'Une erreur inattendue s\'est produite' };
  }
}

// ─────────────────────────────────────────────────────────────────
// Create Stripe Customer Portal Session
// ─────────────────────────────────────────────────────────────────

export async function createPortalSession(): Promise<
  { url: string } | { error: string }
> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Non authentifié' };
    }

    // Call Supabase Edge Function to create portal session
    const { data, error } = await supabase.functions.invoke('stripe-portal', {
      body: {
        user_id: user.id,
      },
    });

    if (error) {
      console.error('[Stripe] Error creating portal session:', error);
      return { error: error.message };
    }

    if (!data?.url) {
      return { error: 'Impossible de créer la session du portail' };
    }

    return { url: data.url };
  } catch (error) {
    console.error('[Stripe] Unexpected error:', error);
    return { error: 'Une erreur inattendue s\'est produite' };
  }
}

// ─────────────────────────────────────────────────────────────────
// Check usage limit before action
// ─────────────────────────────────────────────────────────────────

export async function checkUsageLimit(
  limitType: 'projects' | 'tasks' | 'chat_messages' | 'agent_calls'
): Promise<{
  allowed: boolean;
  current_usage: number;
  limit_value: number;
  plan: PlanType;
}> {
  const { data, error } = await supabase.rpc('check_usage_limit', {
    p_user_id: (await supabase.auth.getUser()).data.user?.id,
    p_limit_type: limitType,
  });

  if (error) {
    console.error('[Stripe] Error checking usage limit:', error);
    // Default to allowed in case of error
    return { allowed: true, current_usage: 0, limit_value: 999999, plan: 'free' };
  }

  return data[0];
}

// ─────────────────────────────────────────────────────────────────
// Increment usage after action
// ─────────────────────────────────────────────────────────────────

export async function incrementUsage(
  usageType: 'tasks' | 'chat_messages' | 'agent_calls',
  increment: number = 1
): Promise<void> {
  const { error } = await supabase.rpc('increment_usage', {
    p_user_id: (await supabase.auth.getUser()).data.user?.id,
    p_usage_type: usageType,
    p_increment: increment,
  });

  if (error) {
    console.error('[Stripe] Error incrementing usage:', error);
  }
}
