// ═══════════════════════════════════════════════════════════════
// Protected Super Admin Route
// Route guard that verifies super_admin role
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useBackofficeStore } from '../../store/useBackofficeStore';
import { Loader2 } from 'lucide-react';

interface ProtectedSuperAdminRouteProps {
  children: React.ReactNode;
}

export default function ProtectedSuperAdminRoute({ children }: ProtectedSuperAdminRouteProps) {
  const { user, setUser, isLoading, setLoading } = useBackofficeStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setUser(null);
        setLoading(false);
        setChecking(false);
        return;
      }

      // Check user role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();

      if (roleError || !roleData || roleData.role !== 'super_admin') {
        // Not a super admin - sign out
        await supabase.auth.signOut();
        setUser(null);
        setLoading(false);
        setChecking(false);
        return;
      }

      // Valid super admin - set user
      setUser({
        id: session.user.id,
        email: session.user.email || '',
        created_at: session.user.created_at || '',
        role: 'super_admin',
      });

      setLoading(false);
      setChecking(false);
    } catch (error) {
      console.error('[Auth] Check failed:', error);
      setUser(null);
      setLoading(false);
      setChecking(false);
    }
  };

  // Show loading state
  if (checking || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-amber-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Not authenticated or not super admin - redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated as super admin - render children
  return <>{children}</>;
}
