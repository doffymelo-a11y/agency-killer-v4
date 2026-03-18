// ═══════════════════════════════════════════════════════════════
// THE HIVE OS V4 - Main Application
// ═══════════════════════════════════════════════════════════════

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useHiveStore, useIsLoading } from './store/useHiveStore';

// Auth Views
import LoginView from './views/LoginView';
import ForgotPasswordView from './views/ForgotPasswordView';
import EmailVerificationView from './views/EmailVerificationView';

// Legal Views (Public)
import PrivacyPolicyView from './views/PrivacyPolicyView';
import TermsOfServiceView from './views/TermsOfServiceView';

// App Views
import ProjectsView from './views/ProjectsView';
import AccountSettingsView from './views/AccountSettingsView';
import BillingView from './views/BillingView';
import AdminDashboardView from './views/AdminDashboardView';
import GenesisView from './views/GenesisView';
import BoardView from './views/BoardView';
import ChatView from './views/ChatView';
import FilesView from './views/FilesView';
import AnalyticsView from './views/AnalyticsView';
import IntegrationsView from './views/IntegrationsView';
import OAuthCallback from './components/oauth/OAuthCallback';

// Components
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoadingScreen from './components/ui/LoadingScreen';

function AppRoutes() {
  const isLoading = useIsLoading();
  const error = useHiveStore((state) => state.error);

  // Fetch projects on mount - use getState() to avoid infinite loop
  useEffect(() => {
    useHiveStore.getState().fetchProjects();
  }, []);

  // Show loading screen while fetching or on initial load
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Log any errors for debugging
  if (error) {
    console.error('Supabase error:', error);
  }

  return (
    <Routes>
      {/* Public Routes - Auth */}
      <Route path="/login" element={<LoginView />} />
      <Route path="/forgot-password" element={<ForgotPasswordView />} />
      <Route path="/verify-email" element={<EmailVerificationView />} />

      {/* OAuth Callbacks (Public) */}
      <Route
        path="/oauth/callback/meta"
        element={<OAuthCallback provider="meta" />}
      />
      <Route
        path="/oauth/callback/google"
        element={<OAuthCallback provider="google" />}
      />

      {/* Legal Pages (Public) */}
      <Route path="/privacy" element={<PrivacyPolicyView />} />
      <Route path="/terms" element={<TermsOfServiceView />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        {/* Projects Dashboard */}
        <Route path="/projects" element={<ProjectsView />} />

        {/* Account Settings */}
        <Route path="/account" element={<AccountSettingsView />} />

        {/* Billing */}
        <Route path="/billing" element={<BillingView />} />

        {/* Admin Dashboard */}
        <Route path="/admin" element={<AdminDashboardView />} />

        {/* Genesis Wizard */}
        <Route path="/genesis" element={<GenesisView />} />

        {/* Board View (Main) */}
        <Route path="/board/:projectId" element={<BoardView />} />

        {/* Chat View */}
        <Route path="/chat/:projectId" element={<ChatView />} />
        <Route path="/chat/:projectId/:taskId" element={<ChatView />} />

        {/* Files View (THE LIBRARIAN) */}
        <Route path="/files/:projectId" element={<FilesView />} />

        {/* Analytics View (THE DATA OBSERVER) */}
        <Route path="/analytics/:projectId" element={<AnalyticsView />} />

        {/* Integrations View (THE CONNECTOR) */}
        <Route path="/integrations/:projectId" element={<IntegrationsView />} />

        {/* Default redirect for authenticated users */}
        <Route
          path="/"
          element={<Navigate to="/projects" replace />}
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50">
        <AppRoutes />
      </div>
    </BrowserRouter>
  );
}
