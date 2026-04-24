// ═══════════════════════════════════════════════════════════════
// Layout Component - Super Admin Backoffice
// Fixed sidebar + main content area
// Matches cockpit admin dashboard design language
// ═══════════════════════════════════════════════════════════════

import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket,
  Users,
  FileText,
  Activity,
  Shield,
  LogOut,
  BarChart3,
} from 'lucide-react';
import { useBackofficeStore } from '../store/useBackofficeStore';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/cn';
import { Badge } from './ui';

const navigation = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Tickets', path: '/tickets', icon: Ticket },
  { name: 'Users', path: '/users', icon: Users },
  { name: 'Logs', path: '/logs', icon: FileText },
  { name: 'Metrics', path: '/metrics', icon: BarChart3 },
  { name: 'Audit', path: '/logs', icon: Activity }, // Audit = Logs tab
];

export default function Layout() {
  const navigate = useNavigate();
  const { user, reset } = useBackofficeStore();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    reset();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar - Fixed Left */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        {/* Logo + Title */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Backoffice</h1>
              <p className="text-xs text-slate-400">Super Admin</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all group relative',
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-cyan-500 rounded-r-full" />
                  )}
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/50 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {user?.email?.charAt(0).toUpperCase() || 'S'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.email || 'Super Admin'}</p>
                <Badge variant="super_admin" className="text-[10px] px-2 py-0.5">
                  SUPER ADMIN
                </Badge>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-lg transition-colors font-medium border border-red-600/20"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Outlet />
      </main>
    </div>
  );
}
