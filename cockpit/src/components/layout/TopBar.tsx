// ============================================
// THE HIVE OS V4 - Top Bar Component
// User menu accessible from anywhere
// ============================================

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, signOut, getUserRole } from '../../lib/supabase';

export default function TopBar() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadUser();

    // Close menu on click outside
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function loadUser() {
    const currentUser = await getCurrentUser();
    setUser(currentUser);

    if (currentUser) {
      const role = await getUserRole(currentUser.id);
      setIsAdmin(role === 'admin' || role === 'super_admin');
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  if (!user) return null;

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo / Brand */}
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-3 hover:opacity-80 transition"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">H</span>
          </div>
          <span className="text-white font-bold text-lg hidden md:block">THE HIVE OS</span>
        </button>

        {/* User Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
              {user.email?.[0].toUpperCase()}
            </div>
            <span className="text-slate-300 text-sm hidden md:block max-w-[200px] truncate">
              {user.email}
            </span>
            <svg
              className={`w-4 h-4 text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
              {/* User Info */}
              <div className="px-4 py-3 border-b border-slate-700">
                <p className="text-white font-medium truncate">{user.email}</p>
                <p className="text-slate-400 text-xs mt-1">
                  {isAdmin ? 'Administrator' : 'User Account'}
                </p>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <button
                  onClick={() => {
                    navigate('/projects');
                    setMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-750 hover:text-white transition flex items-center gap-3"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  My Projects
                </button>

                <button
                  onClick={() => {
                    navigate('/account');
                    setMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-750 hover:text-white transition flex items-center gap-3"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Account Settings
                </button>

                <button
                  onClick={() => {
                    navigate('/billing');
                    setMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-750 hover:text-white transition flex items-center gap-3"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Billing
                </button>

                {isAdmin && (
                  <>
                    <div className="my-2 border-t border-slate-700"></div>
                    <button
                      onClick={() => {
                        navigate('/admin');
                        setMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/10 hover:text-red-300 transition flex items-center gap-3"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Admin Dashboard
                    </button>
                  </>
                )}

                <div className="my-2 border-t border-slate-700"></div>

                <button
                  onClick={handleSignOut}
                  className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-750 hover:text-white transition flex items-center gap-3"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
