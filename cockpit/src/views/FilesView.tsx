// TopBar import removed - unused
// ═══════════════════════════════════════════════════════════════
// THE HIVE OS V4 - Files & Assets View (THE LIBRARIAN)
// Drive intelligent - Fichiers classés automatiquement par projet
// ═══════════════════════════════════════════════════════════════

import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen,
  Image,
  FileText,
  Video,
  File,
  Search,
  Filter,
  Grid,
  List,
  Download,
  Eye,
  Calendar,
  Tag,
  X,
  MessageSquare,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import {
  useHiveStore,
  useCurrentProject,
} from '../store/useHiveStore';
import { AGENTS, type AgentRole, type DeliverableType } from '../types';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

interface FileAsset {
  id: string;
  name: string;
  url: string;
  type: DeliverableType;
  agent: AgentRole;
  taskTitle: string;
  taskId: string;
  createdAt: string;
  phase: string;
}

type ViewMode = 'grid' | 'list';
type FilterAgent = AgentRole | 'all';
type FilterType = DeliverableType | 'all';

// ─────────────────────────────────────────────────────────────────
// File Type Icon
// ─────────────────────────────────────────────────────────────────

function FileTypeIcon({ type, className = '', style }: { type: DeliverableType; className?: string; style?: React.CSSProperties }) {
  const icons: Record<DeliverableType, typeof Image> = {
    image: Image,
    video: Video,
    pdf: FileText,
    text: FileText,
    report: FileText,
  };
  const Icon = icons[type] || File;
  return <Icon className={className} style={style} />;
}

// ─────────────────────────────────────────────────────────────────
// File Card Component (Grid View)
// ─────────────────────────────────────────────────────────────────

function FileCard({
  file,
  onPreview,
}: {
  file: FileAsset;
  onPreview: (file: FileAsset) => void;
}) {
  const agent = AGENTS[file.agent];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow group"
    >
      {/* Preview Area */}
      <div
        className="relative h-40 bg-slate-50 flex items-center justify-center cursor-pointer"
        onClick={() => onPreview(file)}
      >
        {file.type === 'image' ? (
          <img
            src={file.url}
            alt={file.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center">
            <FileTypeIcon type={file.type} className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <span className="text-xs text-slate-400 uppercase">{file.type}</span>
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview(file);
            }}
            className="p-2 bg-white rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Eye className="w-5 h-5 text-slate-700" />
          </button>
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-2 bg-white rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Download className="w-5 h-5 text-slate-700" />
          </a>
        </div>

        {/* Agent Badge */}
        <div
          className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: agent.color.light, color: agent.color.dark }}
        >
          <img
            src={agent.avatar}
            alt={agent.name}
            className="w-4 h-4 rounded-full"
          />
          {agent.name}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-medium text-slate-800 truncate mb-1">{file.name}</h3>
        <p className="text-xs text-slate-500 truncate mb-3">{file.taskTitle}</p>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {file.phase}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(file.createdAt).toLocaleDateString('fr-FR')}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// File Row Component (List View)
// ─────────────────────────────────────────────────────────────────

function FileRow({
  file,
  onPreview,
}: {
  file: FileAsset;
  onPreview: (file: FileAsset) => void;
}) {
  const agent = AGENTS[file.agent];

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="hover:bg-slate-50 transition-colors group"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: agent.color.light }}
          >
            <FileTypeIcon type={file.type} className="w-5 h-5" style={{ color: agent.color.primary }} />
          </div>
          <div>
            <p className="font-medium text-slate-800">{file.name}</p>
            <p className="text-xs text-slate-500">{file.taskTitle}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <img src={agent.avatar} alt={agent.name} className="w-6 h-6 rounded-full" />
          <span className="text-sm text-slate-600">{agent.name}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs px-2 py-1 bg-slate-100 rounded-full text-slate-600 uppercase">
          {file.type}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-slate-500">
        {file.phase}
      </td>
      <td className="px-4 py-3 text-sm text-slate-500">
        {new Date(file.createdAt).toLocaleDateString('fr-FR')}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onPreview(file)}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4 text-slate-500" />
          </button>
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
          </a>
        </div>
      </td>
    </motion.tr>
  );
}

// ─────────────────────────────────────────────────────────────────
// Preview Modal
// ─────────────────────────────────────────────────────────────────

function PreviewModal({
  file,
  onClose,
}: {
  file: FileAsset;
  onClose: () => void;
}) {
  const agent = AGENTS[file.agent];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: agent.color.light }}
            >
              <FileTypeIcon type={file.type} className="w-5 h-5" style={{ color: agent.color.primary }} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">{file.name}</h3>
              <p className="text-xs text-slate-500">
                Par {agent.name} - {file.taskTitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              <Download className="w-4 h-4" />
              Telecharger
            </a>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-auto flex items-center justify-center bg-slate-50">
          {file.type === 'image' ? (
            <img
              src={file.url}
              alt={file.name}
              className="max-w-full max-h-full rounded-lg shadow-lg"
            />
          ) : file.type === 'video' ? (
            <video
              src={file.url}
              controls
              className="max-w-full max-h-full rounded-lg shadow-lg"
            />
          ) : file.type === 'pdf' ? (
            <iframe
              src={file.url}
              className="w-full h-[60vh] rounded-lg"
              title={file.name}
            />
          ) : (
            <div className="text-center py-12">
              <FileTypeIcon type={file.type} className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">Apercu non disponible pour ce type de fichier</p>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                Ouvrir le fichier
              </a>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-6">
        <FolderOpen className="w-10 h-10 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-2">
        Aucun fichier pour le moment
      </h3>
      <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
        Les fichiers generes par les agents (visuels, rapports, documents)
        apparaitront ici automatiquement une fois les taches terminees.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────

export default function FilesView() {
  const navigate = useNavigate();
  const project = useCurrentProject();
  const { projectFiles, filesLoading, fetchProjectFiles } = useHiveStore();

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAgent, setFilterAgent] = useState<FilterAgent>('all');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [previewFile, setPreviewFile] = useState<FileAsset | null>(null);

  // Fetch files from Supabase when component mounts
  useEffect(() => {
    if (project?.id) {
      fetchProjectFiles(project.id);
    }
  }, [project?.id, fetchProjectFiles]);

  // Map ProjectFile to FileAsset for UI compatibility
  const files = useMemo<FileAsset[]>(() => {
    return projectFiles.map((file) => {
      // Determine DeliverableType from file_type
      let deliverableType: DeliverableType = 'text';
      if (file.file_type === 'image') deliverableType = 'image';
      else if (file.file_type === 'video') deliverableType = 'video';
      else if (file.file_type === 'document' && file.mime_type === 'application/pdf') deliverableType = 'pdf';
      else if (file.file_type === 'document') deliverableType = 'report';

      // Determine agent from agent_id (fallback to orchestrator)
      const agentId = (file.agent_id as AgentRole) || 'orchestrator';

      return {
        id: file.id,
        name: file.filename,
        url: file.url,
        type: deliverableType,
        agent: agentId,
        taskTitle: file.metadata?.task_title as string || 'Fichier généré',
        taskId: file.task_id || '',
        createdAt: file.created_at,
        phase: file.metadata?.phase as string || 'Production',
      };
    });
  }, [projectFiles]);

  // Filtered files
  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      const matchesSearch =
        searchQuery === '' ||
        file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.taskTitle.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesAgent = filterAgent === 'all' || file.agent === filterAgent;
      const matchesType = filterType === 'all' || file.type === filterType;

      return matchesSearch && matchesAgent && matchesType;
    });
  }, [files, searchQuery, filterAgent, filterType]);

  // Stats
  const stats = useMemo(() => {
    const byAgent = Object.keys(AGENTS).reduce((acc, agent) => {
      acc[agent as AgentRole] = files.filter((f) => f.agent === agent).length;
      return acc;
    }, {} as Record<AgentRole, number>);

    const byType = ['image', 'video', 'pdf', 'text', 'report'].reduce((acc, type) => {
      acc[type as DeliverableType] = files.filter((f) => f.type === type).length;
      return acc;
    }, {} as Record<DeliverableType, number>);

    return { byAgent, byType, total: files.length };
  }, [files]);

  const handleAskLibrarian = () => {
    // Navigate to chat with a pre-filled search query
    if (project) {
      useHiveStore.getState().setActiveAgent('orchestrator');
      navigate(`/chat/${project.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/board/${project?.id}`)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Back to board"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="font-semibold text-slate-900 text-lg flex items-center gap-2">
                  <FolderOpen className="w-5 h-5" />
                  Files & Assets
                </h1>
                <p className="text-sm text-slate-500">
                  {project?.name} - {stats.total} file{stats.total > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* AI Search Button */}
              <button
                onClick={handleAskLibrarian}
                className="btn btn-secondary"
              >
                <MessageSquare className="w-4 h-4" />
                Demander a l'IA
              </button>

              {/* View Toggle */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-white/50'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-white/50'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un fichier..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>

            {/* Agent Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filterAgent}
                onChange={(e) => setFilterAgent(e.target.value as FilterAgent)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="all">Tous les agents</option>
                {Object.entries(AGENTS)
                  .filter(([id]) => id !== 'orchestrator')
                  .map(([id, agent]) => (
                    <option key={id} value={id}>
                      {agent.name} ({stats.byAgent[id as AgentRole] || 0})
                    </option>
                  ))}
              </select>
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="all">Tous les types</option>
              <option value="image">Images ({stats.byType.image || 0})</option>
              <option value="video">Videos ({stats.byType.video || 0})</option>
              <option value="pdf">PDFs ({stats.byType.pdf || 0})</option>
              <option value="text">Textes ({stats.byType.text || 0})</option>
              <option value="report">Rapports ({stats.byType.report || 0})</option>
            </select>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {filesLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
          </div>
        ) : files.length === 0 ? (
          <EmptyState />
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Aucun resultat
            </h3>
            <p className="text-sm text-slate-500">
              Essayez de modifier vos filtres ou votre recherche.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredFiles.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  onPreview={setPreviewFile}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                    Fichier
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                    Agent
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                    Phase
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <AnimatePresence>
                  {filteredFiles.map((file) => (
                    <FileRow
                      key={file.id}
                      file={file}
                      onPreview={setPreviewFile}
                    />
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <PreviewModal
            file={previewFile}
            onClose={() => setPreviewFile(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
