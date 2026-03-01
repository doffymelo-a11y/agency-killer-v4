// ============================================
// THE HIVE OS V4 - Billing View
// Subscription management, usage, upgrade
// ============================================

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase, getCurrentUser } from '../lib/supabase';
import {
  getUserSubscription,
  getCurrentUsage,
  getAllPlanLimits,
  createCheckoutSession,
  createPortalSession,
  type PlanType,
} from '../services/stripe';

interface Subscription {
  plan: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

interface Usage {
  tasks_created: number;
  chat_messages: number;
  agent_calls: number;
}

interface PlanLimit {
  plan: string;
  max_projects: number | null;
  max_tasks_per_month: number | null;
  max_chat_messages_per_month: number | null;
  max_agent_calls_per_month: number | null;
  price_monthly_cents: number;
  features: string[];
}

export default function BillingView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<PlanType | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [plans, setPlans] = useState<PlanLimit[]>([]);

  // Check for success/canceled params
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setError(null);
      // Reload data to show updated subscription
      setTimeout(() => loadBillingData(), 2000);
    } else if (searchParams.get('canceled') === 'true') {
      setError('Payment was canceled. You can try again anytime.');
    }
  }, [searchParams]);

  useEffect(() => {
    loadBillingData();
  }, []);

  async function loadBillingData() {
    const user = await getCurrentUser();
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      // Load subscription, usage, and plans in parallel
      const [subData, usageData, plansData] = await Promise.all([
        getUserSubscription(),
        getCurrentUsage(),
        getAllPlanLimits(),
      ]);

      setSubscription(subData as Subscription);
      setUsage(usageData as Usage);
      setPlans(plansData as PlanLimit[]);
    } catch (err) {
      console.error('[Billing] Error loading data:', err);
      setError('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgrade(plan: 'pro' | 'enterprise') {
    setCheckoutLoading(plan);
    setError(null);

    const result = await createCheckoutSession(plan);

    if ('error' in result) {
      setError(result.error);
      setCheckoutLoading(null);
    } else {
      // Redirect to Stripe Checkout
      window.location.href = result.url;
    }
  }

  async function handleManageSubscription() {
    setPortalLoading(true);
    setError(null);

    const result = await createPortalSession();

    if ('error' in result) {
      setError(result.error);
      setPortalLoading(false);
    } else {
      // Redirect to Stripe Customer Portal
      window.location.href = result.url;
    }
  }

  function formatPrice(cents: number) {
    return `€${(cents / 100).toFixed(2)}`;
  }

  function getProgressPercentage(current: number, max: number | null) {
    if (!max) return 0;
    return Math.min((current / max) * 100, 100);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading billing...</p>
        </div>
      </div>
    );
  }

  const currentPlan = plans.find(p => p.plan === subscription?.plan) || plans[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Billing & Subscription</h1>
            <p className="text-slate-400">Manage your plan and usage</p>
          </div>
          <button
            onClick={() => navigate('/account')}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition"
          >
            ← Back to Settings
          </button>
        </div>

        {/* Success Message */}
        {searchParams.get('success') === 'true' && (
          <div className="bg-green-500/10 border border-green-500 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-green-400 font-semibold">Payment successful!</h3>
                <p className="text-green-300 text-sm">Your subscription has been activated.</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-red-400 font-semibold">Error</h3>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Current Plan Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1 capitalize">{subscription?.plan} Plan</h2>
              <p className="text-slate-400">
                {subscription?.status === 'active' ? 'Active' : 'Inactive'} • {formatPrice(currentPlan.price_monthly_cents)}/month
              </p>
            </div>
            <div className="flex gap-2">
              {subscription?.plan !== 'free' && subscription?.status === 'active' && (
                <button
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {portalLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Loading...
                    </div>
                  ) : (
                    'Manage Subscription'
                  )}
                </button>
              )}
              {subscription?.plan !== 'enterprise' && (
                <button
                  onClick={() => handleUpgrade(subscription?.plan === 'free' ? 'pro' : 'enterprise')}
                  disabled={checkoutLoading !== null}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkoutLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Loading...
                    </div>
                  ) : (
                    'Upgrade Plan'
                  )}
                </button>
              )}
            </div>
          </div>

          {subscription?.current_period_end && (
            <p className="text-sm text-slate-400">
              {subscription.cancel_at_period_end
                ? `Cancels on ${new Date(subscription.current_period_end).toLocaleDateString()}`
                : `Renews on ${new Date(subscription.current_period_end).toLocaleDateString()}`}
            </p>
          )}
        </div>

        {/* Usage This Month */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-6">Usage This Month</h2>

          <div className="space-y-6">
            {/* Tasks */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300">Tasks Created</span>
                <span className="text-white font-semibold">
                  {usage?.tasks_created || 0} / {currentPlan.max_tasks_per_month || '∞'}
                </span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
                  style={{ width: `${getProgressPercentage(usage?.tasks_created || 0, currentPlan.max_tasks_per_month)}%` }}
                ></div>
              </div>
            </div>

            {/* Chat Messages */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300">Chat Messages</span>
                <span className="text-white font-semibold">
                  {usage?.chat_messages || 0} / {currentPlan.max_chat_messages_per_month || '∞'}
                </span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                  style={{ width: `${getProgressPercentage(usage?.chat_messages || 0, currentPlan.max_chat_messages_per_month)}%` }}
                ></div>
              </div>
            </div>

            {/* Agent Calls */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300">Agent Calls</span>
                <span className="text-white font-semibold">
                  {usage?.agent_calls || 0} / {currentPlan.max_agent_calls_per_month || '∞'}
                </span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
                  style={{ width: `${getProgressPercentage(usage?.agent_calls || 0, currentPlan.max_agent_calls_per_month)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Available Plans */}
        <div>
          <h2 className="text-xl font-bold text-white mb-6">Available Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.plan}
                className={`bg-slate-800 border-2 rounded-2xl p-6 transition ${
                  plan.plan === subscription?.plan
                    ? 'border-cyan-500'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white capitalize mb-1">{plan.plan}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white">{formatPrice(plan.price_monthly_cents)}</span>
                    <span className="text-slate-400">/month</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {(plan.features as string[]).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                      <svg className="w-5 h-5 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                {plan.plan === subscription?.plan ? (
                  <button className="w-full py-2 rounded-lg bg-slate-700 text-white font-semibold" disabled>
                    Current Plan
                  </button>
                ) : plan.price_monthly_cents === 0 ? (
                  <button
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                    className="w-full py-2 rounded-lg bg-slate-600 hover:bg-slate-500 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {portalLoading ? 'Loading...' : 'Downgrade via Portal'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.plan as 'pro' | 'enterprise')}
                    disabled={checkoutLoading === plan.plan}
                    className="w-full py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {checkoutLoading === plan.plan ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Loading...
                      </div>
                    ) : (
                      'Upgrade'
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
