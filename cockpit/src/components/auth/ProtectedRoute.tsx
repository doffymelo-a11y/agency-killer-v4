// ============================================
// THE HIVE OS V4 - Protected Route Wrapper
// Redirects to login if user is not authenticated
// ============================================

import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getCurrentUser } from '../../lib/supabase';

export default function ProtectedRoute() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function checkAuth() {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    }

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
