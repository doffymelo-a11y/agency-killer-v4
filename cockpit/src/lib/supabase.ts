// ═══════════════════════════════════════════════════════════════
// THE HIVE OS V4 - Supabase Client
// Generic client for development - types will be added when DB is set up
// ═══════════════════════════════════════════════════════════════

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Note: In production, these values should be set via environment variables
// For development, we allow placeholder values to prevent build errors

// Using generic client for flexibility during development
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: SupabaseClient<any, 'public', any> = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// ─────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────

export async function checkConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('projects').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────
// Authentication Functions (CRITICAL-002 Fix)
// ─────────────────────────────────────────────────────────────────

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export function onAuthStateChange(callback: (user: any) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user ?? null);
  });
}

export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return { data, error };
}

export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  return { data, error };
}

export async function getUserRole(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  return data?.role || 'user';
}

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const role = await getUserRole(user.id);
  return role === 'admin' || role === 'super_admin';
}
