// ═══════════════════════════════════════════════════════════════
// Layout - Super Admin Backoffice
// Main layout with sidebar and top bar
// ═══════════════════════════════════════════════════════════════

import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Ticket, Users, FileText, Activity, LogOut, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useBackofficeStore } from '../store/useBackofficeStore';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, reset } = useBackofficeStore();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    reset();
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/tickets', icon: Ticket, label: 'Tickets' },
    { path: '/users', icon: Users, label: 'Users' },
    { path: '/logs', icon: FileText, label: 'Logs' },
    { path: '/metrics', icon: Activity, label: 'Metrics' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Backoffice</h1>
              <p className="text-xs text-slate-500">Super Admin</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-amber-50 text-amber-900 font-medium'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Info + Logout */}
        <div className="p-4 border-t border-slate-200">
          <div className="mb-3 px-4 py-2 bg-slate-50 rounded-lg">
            <p className="text-xs font-medium text-slate-500 mb-1">Logged in as</p>
            <p className="text-sm font-medium text-slate-900 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
