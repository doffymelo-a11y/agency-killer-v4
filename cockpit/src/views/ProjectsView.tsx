// ============================================
// THE HIVE OS V4 - Projects Dashboard
// Multi-project view with create/manage projects
// ============================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, getCurrentUser, signOut, getUserRole } from '../lib/supabase';

interface Project {
  id: string;
  name: string;
  scope: string;
  created_at: string;
  updated_at: string;
}

export default function ProjectsView() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadUserAndProjects();
  }, []);

  async function loadUserAndProjects() {
    setLoading(true);
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      if (currentUser) {
        // Check if user is admin
        const role = await getUserRole(currentUser.id);
        setIsAdmin(role === 'admin' || role === 'super_admin');

        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('updated_at', { ascending: false });

        if (error) {
          console.error('Error loading projects:', error);
        } else {
          setProjects(data || []);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  function handleCreateProject() {
    navigate('/genesis');
  }

  function handleOpenProject(projectId: string) {
    navigate(`/board/${projectId}`);
  }

  function getScopeLabel(scope: string) {
    const labels: Record<string, string> = {
      meta_ads: 'Meta Ads',
      google_ads: 'Google Ads',
      full_marketing: 'Full Marketing',
      seo: 'SEO',
      content: 'Content Marketing',
    };
    return labels[scope] || scope;
  }

  function getScopeColor(scope: string) {
    const colors: Record<string, string> = {
      meta_ads: 'from-blue-500 to-blue-600',
      google_ads: 'from-green-500 to-green-600',
      full_marketing: 'from-purple-500 to-purple-600',
      seo: 'from-orange-500 to-orange-600',
      content: 'from-pink-500 to-pink-600',
    };
    return colors[scope] || 'from-gray-500 to-gray-600';
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">My Projects</h1>
            <p className="text-sm lg:text-base text-slate-400">Select a project or create a new one</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:gap-3">
            {isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Admin
              </button>
            )}
            <button
              onClick={() => navigate('/account')}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-800 rounded-lg border border-slate-700">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                {user?.email?.[0].toUpperCase()}
              </div>
              <span className="text-slate-300 text-sm">{user?.email}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">No Projects Yet</h2>
            <p className="text-slate-400 mb-6">Create your first project to get started</p>
            <button
              onClick={handleCreateProject}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold transition shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create First Project
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Create New Project Card */}
              <button
                onClick={handleCreateProject}
                className="group relative bg-slate-800 hover:bg-slate-750 border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-2xl p-8 transition min-h-[200px] flex flex-col items-center justify-center"
              >
                <div className="w-16 h-16 bg-slate-700 group-hover:bg-cyan-500/10 rounded-xl flex items-center justify-center mb-4 transition">
                  <svg className="w-8 h-8 text-slate-500 group-hover:text-cyan-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Create New Project</h3>
                <p className="text-slate-400 text-sm">Start a new marketing campaign</p>
              </button>

              {/* Existing Projects */}
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleOpenProject(project.id)}
                  className="group relative bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-cyan-500/50 rounded-2xl p-6 transition text-left min-h-[200px] flex flex-col"
                >
                  {/* Scope Badge */}
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r ${getScopeColor(project.scope)} text-white text-xs font-semibold mb-4 self-start`}>
                    {getScopeLabel(project.scope)}
                  </div>

                  {/* Project Name */}
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition">
                    {project.name}
                  </h3>

                  {/* Metadata */}
                  <div className="mt-auto pt-4 flex items-center justify-between text-sm text-slate-400">
                    <span>Last updated</span>
                    <span>{new Date(project.updated_at).toLocaleDateString()}</span>
                  </div>

                  {/* Hover Arrow */}
                  <div className="absolute top-6 right-6 w-8 h-8 bg-slate-700 group-hover:bg-cyan-500 rounded-lg flex items-center justify-center transition opacity-0 group-hover:opacity-100">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>

            {/* Summary Stats */}
            <div className="mt-8 p-6 bg-slate-800 border border-slate-700 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Total Projects</p>
                  <p className="text-3xl font-bold text-white">{projects.length}</p>
                </div>
                <button
                  onClick={handleCreateProject}
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition"
                >
                  + New Project
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
