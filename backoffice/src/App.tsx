// ═══════════════════════════════════════════════════════════════
// App - Super Admin Backoffice
// Main router setup with protected routes
// ═══════════════════════════════════════════════════════════════

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import TicketsView from './views/TicketsView';
import TicketDetailView from './views/TicketDetailView';
import UsersView from './views/UsersView';
import LogsView from './views/LogsView';
import MetricsView from './views/MetricsView';
import Layout from './components/Layout';
import ProtectedSuperAdminRoute from './components/auth/ProtectedSuperAdminRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginView />} />

        {/* Protected Routes - Require super_admin role */}
        <Route
          path="/*"
          element={
            <ProtectedSuperAdminRoute>
              <Layout />
            </ProtectedSuperAdminRoute>
          }
        >
          <Route index element={<DashboardView />} />
          <Route path="tickets" element={<TicketsView />} />
          <Route path="tickets/:ticketId" element={<TicketDetailView />} />
          <Route path="users" element={<UsersView />} />
          <Route path="logs" element={<LogsView />} />
          <Route path="metrics" element={<MetricsView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
