// ============================================
// THE HIVE OS V4 - Projects Dashboard
// Multi-project view with create/manage projects
// ============================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  Settings,
  LogOut,
  Shield,
  Archive,
  Trash2,
  MoreVertical,
  ArchiveRestore,
  Folder,
  FolderOpen,
} from 'lucide-react';
import { supabase, getCurrentUser, signOut, getUserRole } from '../lib/supabase';

interface Project {
  id: string;
  name: string;
  scope: string;
  created_at: string;
  updated_at: string;
  archived?: boolean;
}

export default function ProjectsView() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    loadUserAndProjects();
  }, [showArchived]);

  async function loadUserAndProjects() {
    setLoading(true);
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      if (currentUser) {
        // Check if user is admin
        const role = await getUserRole(currentUser.id);
        setIsAdmin(role === 'admin' || role === 'super_admin');

        let query = supabase
          .from('projects')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('updated_at', { ascending: false });

        // Filter by archived status
        if (showArchived) {
          query = query.eq('archived', true);
        } else {
          query = query.or('archived.is.null,archived.eq.false');
        }

        const { data, error } = await query;

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

  async function handleArchiveProject(projectId: string, event: React.MouseEvent) {
    event.stopPropagation();
    setOpenMenuId(null);

    try {
      const { error } = await supabase
        .from('projects')
        .update({ archived: true })
        .eq('id', projectId);

      if (error) throw error;
      loadUserAndProjects();
    } catch (error) {
      console.error('Error archiving project:', error);
      alert('Erreur lors de l\'archivage du projet. Veuillez réessayer.');
    }
  }

  async function handleUnarchiveProject(projectId: string, event: React.MouseEvent) {
    event.stopPropagation();
    setOpenMenuId(null);

    try {
      const { error } = await supabase
        .from('projects')
        .update({ archived: false })
        .eq('id', projectId);

      if (error) throw error;
      loadUserAndProjects();
    } catch (error) {
      console.error('Error unarchiving project:', error);
      alert('Erreur lors de la désarchivage du projet. Veuillez réessayer.');
    }
  }

  async function handleDeleteProject(projectId: string, projectName: string, event: React.MouseEvent) {
    event.stopPropagation();
    setOpenMenuId(null);

    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer le projet "${projectName}" ?\n\nCette action est irréversible et supprimera toutes les tâches associées.`
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      setProjects(projects.filter(p => p.id !== projectId));
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Erreur lors de la suppression du projet. Veuillez réessayer.');
    }
  }

  function getScopeLabel(scope: string) {
    const labels: Record<string, string> = {
      meta_ads: 'Meta Ads',
      sem: 'Google Ads',
      seo: 'SEO',
      analytics: 'Analytics',
      social_media: 'Social Media',
      full_scale: 'Full Scale',
    };
    return labels[scope] || scope;
  }

  function getScopeColor(scope: string) {
    const colors: Record<string, { bg: string; text: string }> = {
      meta_ads: { bg: 'bg-blue-100', text: 'text-blue-700' },
      sem: { bg: 'bg-green-100', text: 'text-green-700' },
      seo: { bg: 'bg-orange-100', text: 'text-orange-700' },
      analytics: { bg: 'bg-purple-100', text: 'text-purple-700' },
      social_media: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
      full_scale: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
    };
    return colors[scope] || { bg: 'bg-slate-100', text: 'text-slate-700' };
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Chargement des projets...</p>
        </div>
      </div>
    );
  }

  const activeProjects = projects.filter(p => !p.archived);
  const archivedProjects = projects.filter(p => p.archived);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">Mes Projets</h1>
              <p className="text-sm text-slate-600">Sélectionnez un projet ou créez-en un nouveau</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {isAdmin && (
                <button
                  onClick={() => navigate('/admin')}
                  className="px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors font-medium flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </button>
              )}
              <button
                onClick={() => navigate('/account')}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors font-medium flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Paramètres
              </button>
              <div className="flex items-center gap-3 px-4 py-2 bg-slate-100 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                  {user?.email?.[0].toUpperCase()}
                </div>
                <span className="text-slate-700 text-sm font-medium">{user?.email}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors font-medium flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Archive Toggle */}
        {(activeProjects.length > 0 || archivedProjects.length > 0) && (
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
            >
              {showArchived ? (
                <>
                  <FolderOpen className="w-4 h-4" />
                  Projets actifs
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4" />
                  Archives ({archivedProjects.length})
                </>
              )}
            </button>
          </div>
        )}

        {/* Projects Grid */}
        {projects.length === 0 && !showArchived ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Folder className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Aucun projet</h2>
            <p className="text-slate-600 mb-6">Créez votre premier projet pour commencer</p>
            <button
              onClick={handleCreateProject}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold transition-all shadow-lg shadow-cyan-500/25"
            >
              <Plus className="w-5 h-5" />
              Créer mon premier projet
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Create New Project Card - Only show in active view */}
              {!showArchived && (
                <motion.button
                  onClick={handleCreateProject}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group relative bg-white hover:bg-slate-50 border-2 border-dashed border-slate-300 hover:border-cyan-500 rounded-xl p-8 transition-all min-h-[200px] flex flex-col items-center justify-center"
                >
                  <div className="w-16 h-16 bg-slate-100 group-hover:bg-cyan-50 rounded-xl flex items-center justify-center mb-4 transition-colors">
                    <Plus className="w-8 h-8 text-slate-400 group-hover:text-cyan-500 transition-colors" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Nouveau projet</h3>
                  <p className="text-slate-500 text-sm">Lancer une nouvelle campagne</p>
                </motion.button>
              )}

              {/* Existing Projects */}
              {projects.map((project, index) => {
                const scopeColor = getScopeColor(project.scope);
                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleOpenProject(project.id)}
                    className="group relative bg-white hover:shadow-lg border border-slate-200 hover:border-cyan-500/50 rounded-xl p-6 transition-all cursor-pointer min-h-[200px] flex flex-col"
                  >
                    {/* Scope Badge */}
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${scopeColor.bg} ${scopeColor.text} text-xs font-semibold mb-4 self-start`}>
                      {getScopeLabel(project.scope)}
                    </div>

                    {/* Project Name */}
                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-cyan-600 transition-colors">
                      {project.name}
                    </h3>

                    {/* Metadata */}
                    <div className="mt-auto pt-4 flex items-center justify-between text-sm text-slate-500">
                      <span>Modifié le</span>
                      <span className="font-medium">{new Date(project.updated_at).toLocaleDateString('fr-FR')}</span>
                    </div>

                    {/* Actions Menu */}
                    <div className="absolute top-4 right-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === project.id ? null : project.id);
                        }}
                        className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="w-4 h-4 text-slate-600" />
                      </button>

                      {/* Dropdown Menu */}
                      {openMenuId === project.id && (
                        <div className="absolute top-10 right-0 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-10">
                          {showArchived ? (
                            <button
                              onClick={(e) => handleUnarchiveProject(project.id, e)}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                            >
                              <ArchiveRestore className="w-4 h-4" />
                              Désarchiver
                            </button>
                          ) : (
                            <button
                              onClick={(e) => handleArchiveProject(project.id, e)}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                            >
                              <Archive className="w-4 h-4" />
                              Archiver
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDeleteProject(project.id, project.name, e)}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Summary Stats */}
            {!showArchived && (
              <div className="mt-8 p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm mb-1">Total des projets</p>
                    <p className="text-3xl font-bold text-slate-900">{activeProjects.length}</p>
                  </div>
                  <button
                    onClick={handleCreateProject}
                    className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Nouveau projet
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
