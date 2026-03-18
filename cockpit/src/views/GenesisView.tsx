// ═══════════════════════════════════════════════════════════════
// THE HIVE OS V4 - Genesis Wizard View
// The entry point for new projects
// ═══════════════════════════════════════════════════════════════

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Rocket, CheckCircle2 } from 'lucide-react';

import { useHiveStore, useWizardState } from '../store/useHiveStore';
import { SCOPE_OPTIONS, getQuestionsForScope, generateTasksForScope, getContextQuestionsForScope } from '../lib/wizard-config';
import type { ProjectScope, WizardAnswer, ProjectMetadata, Project } from '../types';
import { AGENTS } from '../types';

// ─────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────

function ScopeSelector() {
  const dispatch = useHiveStore((state) => state.dispatchWizard);

  const handleSelect = (scope: ProjectScope) => {
    dispatch({ type: 'SELECT_SCOPE', scope });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-3xl mx-auto"
    >
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-3">
          Bienvenue dans THE HIVE
        </h1>
        <p className="text-lg text-slate-600">
          Sur quel levier souhaitez-vous lancer votre projet ?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SCOPE_OPTIONS.map((option) => (
          <motion.button
            key={option.value}
            onClick={() => handleSelect(option.value)}
            className="wizard-option text-left group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3"
              style={{ backgroundColor: `${option.color}15` }}
            >
              {option.icon}
            </div>
            <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-slate-700">
              {option.label}
            </h3>
            <p className="text-sm text-slate-500">
              {option.description}
            </p>
            {option.value === 'full_scale' && (
              <span className="inline-block mt-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                Recommandé
              </span>
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

function QuestionnaireStep() {
  const wizardState = useWizardState();

  // Check if we need to transition to next step
  const questions = wizardState.status === 'questionnaire'
    ? getQuestionsForScope(wizardState.scope)
    : [];
  const currentQuestion = wizardState.status === 'questionnaire'
    ? questions[wizardState.step]
    : null;

  // Move to context collection when all questions are answered (in useEffect to avoid render-time setState)
  useEffect(() => {
    if (wizardState.status === 'questionnaire' && !currentQuestion) {
      useHiveStore.getState().dispatchWizard({
        type: 'SET_PROJECT_INFO',
        name: '',
        deadline: '',
      });
    }
  }, [wizardState.status, currentQuestion]);

  if (wizardState.status !== 'questionnaire') return null;
  if (!currentQuestion) return null;

  const handleAnswer = (answer: WizardAnswer) => {
    useHiveStore.getState().dispatchWizard({ type: 'ANSWER', answer });
    useHiveStore.getState().dispatchWizard({ type: 'NEXT' });
  };

  const handleBack = () => {
    useHiveStore.getState().dispatchWizard({ type: 'BACK' });
  };

  const progress = ((wizardState.step + 1) / questions.length) * 100;

  return (
    <motion.div
      key={currentQuestion.id}
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="w-full max-w-2xl mx-auto"
    >
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-slate-500 mb-2">
          <span>Question {wizardState.step + 1} / {questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-slate-900 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question */}
      <h2 className="text-2xl font-semibold text-slate-900 mb-6">
        {currentQuestion.question}
      </h2>

      {/* Options */}
      <div className="space-y-3">
        {currentQuestion.options.map((option) => (
          <motion.button
            key={option.value}
            onClick={() =>
              handleAnswer({
                questionId: currentQuestion.id,
                value: option.value,
                generatesTask: option.generatesTask,
              })
            }
            className="wizard-option w-full text-left"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 mt-0.5 rounded-full border-2 border-slate-300 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-slate-900">{option.label}</h3>
                {option.description && (
                  <p className="text-sm text-slate-500 mt-0.5">
                    {option.description}
                  </p>
                )}
                {option.generatesTask && (
                  <span className="inline-flex items-center gap-1 mt-2 text-xs text-emerald-600">
                    <CheckCircle2 className="w-3 h-3" />
                    Génère une tâche {option.generatesTask.assignee.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Back Button */}
      <button
        onClick={handleBack}
        className="mt-8 btn btn-ghost text-slate-500"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </button>
    </motion.div>
  );
}

function ContextCollectionStep() {
  const wizardState = useWizardState();
  const dispatch = useHiveStore((state) => state.dispatchWizard);

  if (wizardState.status !== 'context_collection') return null;

  const contextQuestions = getContextQuestionsForScope(wizardState.scope);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const contextAnswers: Partial<ProjectMetadata> = {};

    contextQuestions.forEach((q) => {
      const value = formData.get(q.id) as string;
      if (value && value.trim()) {
        // Handle different types
        if (q.id === 'competitors') {
          // Parse comma-separated competitors
          contextAnswers.competitors = value.split(',').map((s) => s.trim()).filter(Boolean);
        } else if (q.id === 'tracking_events' || q.id === 'conversion_goals' || q.id === 'negative_keywords') {
          // Parse comma-separated arrays
          (contextAnswers as Record<string, string[]>)[q.id] = value.split(',').map((s) => s.trim()).filter(Boolean);
        } else if (q.id === 'budget_monthly') {
          // Parse number
          const parsed = parseInt(value.replace(/[^0-9]/g, ''), 10);
          if (!isNaN(parsed)) contextAnswers.budget_monthly = parsed;
        } else {
          // String value
          (contextAnswers as Record<string, string>)[q.id] = value;
        }
      }
    });

    dispatch({ type: 'SET_CONTEXT', contextAnswers });
  };

  const handleBack = () => {
    dispatch({ type: 'BACK' });
  };

  // Group questions: Global first, then scope-specific
  const globalQuestions = contextQuestions.filter((q) => q.scopes === 'all');
  const scopeQuestions = contextQuestions.filter((q) => q.scopes !== 'all');

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 mb-4">
          <span className="text-2xl">🧠</span>
        </div>
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">
          Mémoire du Projet
        </h2>
        <p className="text-slate-600">
          Ces informations seront mémorisées et utilisées par les agents tout au long du projet.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Global Identity Questions */}
        {globalQuestions.length > 0 && (
          <div className="card p-5">
            <h3 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs">🌐</span>
              Identité Globale
            </h3>
            <div className="space-y-4">
              {globalQuestions.map((q) => (
                <div key={q.id}>
                  <label htmlFor={q.id} className="block text-sm font-medium text-slate-700 mb-1">
                    {q.question}
                  </label>
                  {q.type === 'select' && q.options ? (
                    <select id={q.id} name={q.id} className="input">
                      <option value="">Sélectionner...</option>
                      {q.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      id={q.id}
                      name={q.id}
                      placeholder={q.placeholder}
                      className="input"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scope-Specific Questions */}
        {scopeQuestions.length > 0 && (
          <div className="card p-5">
            <h3 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-xs">🎯</span>
              Contexte {SCOPE_OPTIONS.find((s) => s.value === wizardState.scope)?.label}
            </h3>
            <div className="space-y-4">
              {scopeQuestions.map((q) => (
                <div key={q.id}>
                  <label htmlFor={q.id} className="block text-sm font-medium text-slate-700 mb-1">
                    {q.question}
                  </label>
                  {q.type === 'select' && q.options ? (
                    <select id={q.id} name={q.id} className="input">
                      <option value="">Sélectionner...</option>
                      {q.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      id={q.id}
                      name={q.id}
                      placeholder={q.placeholder}
                      className="input"
                    />
                  )}
                  {/* Show which agents will use this info */}
                  <p className="text-xs text-slate-400 mt-1">
                    Utilisé par : {q.injectTo.map((a) => AGENTS[a].name).join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleBack}
            className="btn btn-secondary flex-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <button
            type="submit"
            className="btn btn-primary flex-1"
          >
            Continuer
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </motion.div>
  );
}

function ProjectInfoStep() {
  const wizardState = useWizardState();
  const dispatch = useHiveStore((state) => state.dispatchWizard);

  if (wizardState.status !== 'project_info') return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const deadline = formData.get('deadline') as string;

    if (name && deadline) {
      dispatch({ type: 'SET_PROJECT_INFO', name, deadline });
    }
  };

  const handleBack = () => {
    dispatch({ type: 'BACK' });
  };

  // Default deadline: 30 days from now
  const defaultDeadline = new Date();
  defaultDeadline.setDate(defaultDeadline.getDate() + 30);
  const defaultDeadlineStr = defaultDeadline.toISOString().split('T')[0];

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="w-full max-w-lg mx-auto"
    >
      <h2 className="text-2xl font-semibold text-slate-900 mb-2">
        Dernière étape !
      </h2>
      <p className="text-slate-600 mb-8">
        Donnez un nom à votre projet et définissez votre deadline.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
            Nom du projet
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            placeholder="Ex: Campagne Été 2025"
            className="input"
          />
        </div>

        <div>
          <label htmlFor="deadline" className="block text-sm font-medium text-slate-700 mb-1">
            Date de lancement souhaitée
          </label>
          <input
            type="date"
            id="deadline"
            name="deadline"
            required
            defaultValue={defaultDeadlineStr}
            min={new Date().toISOString().split('T')[0]}
            className="input"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleBack}
            className="btn btn-secondary flex-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <button
            type="submit"
            className="btn btn-primary flex-1"
          >
            Voir le résumé
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </motion.div>
  );
}

function PreviewStep() {
  const wizardState = useWizardState();
  const dispatch = useHiveStore((state) => state.dispatchWizard);
  const createProject = useHiveStore((state) => state.createProject);
  const addNotification = useHiveStore((state) => state.addNotification);
  const navigate = useNavigate();

  if (wizardState.status !== 'preview') return null;

  // Generate tasks based on scope using the unified generator
  // This adapts tasks based on wizard answers (filtering out unnecessary tasks)
  const tasksToCreate = generateTasksForScope(
    wizardState.scope,
    wizardState.deadline,
    wizardState.answers
  );

  console.log(`[Genesis] Generated ${tasksToCreate.length} tasks for scope: ${wizardState.scope}`);

  // Group tasks by category/phase for display
  const tasksByPhase = tasksToCreate.reduce((acc, task) => {
    const phase = task.phase;
    if (!acc[phase]) acc[phase] = [];
    acc[phase].push(task);
    return acc;
  }, {} as Record<string, typeof tasksToCreate>);

  const handleBack = () => {
    dispatch({ type: 'BACK' });
  };

  const handleSubmit = async () => {
    console.log('[Genesis] Starting project creation...', {
      scope: wizardState.scope,
      tasksCount: tasksToCreate.length,
      projectName: wizardState.projectName,
      deadline: wizardState.deadline
    });

    dispatch({ type: 'SUBMIT' });

    try {
      // V5 - Local project creation with backend API integration
      // Initialize state_flags based on project scope
      const baseStateFlags = {
        strategy_validated: false,
        budget_approved: false,
        creatives_ready: false,
        tracking_ready: false,
        ads_live: false,
      };

      // Add social media platform flags for social_media projects
      // Doffy will detect these flags and ask user to connect platforms if needed
      const socialMediaFlags = wizardState.scope === 'social_media' ? {
        linkedin_connected: false,
        instagram_connected: false,
        twitter_connected: false,
        tiktok_connected: false,
        facebook_connected: false,
      } : {};

      const projectData = {
        name: wizardState.projectName,
        scope: wizardState.scope, // Migration 011 applied - social_media is now valid
        status: 'planning' as const,
        current_phase: 'Setup',
        state_flags: {
          ...baseStateFlags,
          ...socialMediaFlags,
        },
        // Include context answers as project metadata - this is the "shared memory" for agents
        metadata: {
          ...wizardState.contextAnswers,
          original_scope: wizardState.scope, // Preserve original scope for reference
        },
      };

      console.log('[Genesis] Calling createProject...');
      const projectId = await createProject(projectData as Omit<Project, 'id' | 'created_at' | 'updated_at'>, tasksToCreate);
      console.log('[Genesis] Project created successfully!', projectId);

      dispatch({ type: 'GENERATION_COMPLETE', projectId });

      // Redirect to board
      setTimeout(() => {
        navigate(`/board/${projectId}`);
      }, 1500);
    } catch (error) {
      console.error('[Genesis] Failed to create project:', error);

      // Dispatch error to return to preview
      dispatch({
        type: 'GENERATION_FAILED',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Show error notification
      addNotification({
        type: 'error',
        message: `Erreur lors de la création du projet: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        duration: 8000,
      });
    }
  };

  const scopeLabel = SCOPE_OPTIONS.find((s) => s.value === wizardState.scope)?.label;
  const totalHours = tasksToCreate.reduce((sum, t) => sum + t.estimated_hours, 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="w-full max-w-3xl mx-auto"
    >
      <h2 className="text-2xl font-semibold text-slate-900 mb-2">
        Votre plan de campagne
      </h2>
      <p className="text-slate-600 mb-8">
        {tasksToCreate.length} tâches professionnelles pour une campagne réussie.
      </p>

      {/* Project Info */}
      <div className="card p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className="text-sm text-slate-500">Projet</span>
            <p className="font-semibold text-slate-900">{wizardState.projectName}</p>
          </div>
          <div>
            <span className="text-sm text-slate-500">Scope</span>
            <p className="font-semibold text-slate-900">{scopeLabel}</p>
          </div>
          <div>
            <span className="text-sm text-slate-500">Deadline</span>
            <p className="font-semibold text-slate-900">
              {new Date(wizardState.deadline).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
              })}
            </p>
          </div>
          <div>
            <span className="text-sm text-slate-500">Charge estimée</span>
            <p className="font-semibold text-slate-900">{totalHours}h</p>
          </div>
        </div>
      </div>

      {/* Tasks Preview by Phase */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {Object.entries(tasksByPhase).map(([phase, tasks]) => (
          <div key={phase} className="card overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
              <h3 className="font-medium text-slate-900">{phase}</h3>
              <p className="text-xs text-slate-500">{tasks.length} tâches</p>
            </div>
            <div className="divide-y divide-slate-100">
              {tasks.map((task, index) => {
                const agent = AGENTS[task.assignee];
                return (
                  <div key={index} className="p-3 flex items-center gap-3">
                    {/* Agent Avatar */}
                    <img
                      src={agent.avatar}
                      alt={agent.name}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-offset-1"
                      style={{
                        '--tw-ring-color': agent.color.primary,
                      } as React.CSSProperties}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{task.title}</p>
                      <p className="text-xs text-slate-500">{agent.name} • {task.estimated_hours}h</p>
                    </div>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: agent.color.light,
                        color: agent.color.dark,
                      }}
                    >
                      {agent.role}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-8">
        <button
          onClick={handleBack}
          className="btn btn-secondary flex-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Modifier
        </button>
        <button
          onClick={handleSubmit}
          className="btn btn-primary flex-1"
        >
          <Rocket className="w-4 h-4" />
          Lancer le projet
        </button>
      </div>
    </motion.div>
  );
}

function GeneratingStep() {
  const wizardState = useWizardState();

  if (wizardState.status !== 'generating') return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
        className="w-16 h-16 mx-auto mb-6"
      >
        <Rocket className="w-full h-full text-slate-900" />
      </motion.div>
      <h2 className="text-2xl font-semibold text-slate-900 mb-2">
        Création en cours...
      </h2>
      <p className="text-slate-600">
        L'IA génère votre planning de tâches optimal.
      </p>
    </motion.div>
  );
}

function CompleteStep() {
  const wizardState = useWizardState();
  const navigate = useNavigate();

  if (wizardState.status !== 'complete') return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center"
      >
        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
      </motion.div>
      <h2 className="text-2xl font-semibold text-slate-900 mb-2">
        Projet créé !
      </h2>
      <p className="text-slate-600 mb-6">
        Redirection vers votre tableau de bord...
      </p>
      <button
        onClick={() => navigate(`/board/${wizardState.projectId}`)}
        className="btn btn-primary"
      >
        Accéder au Board
        <ArrowRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────

export default function GenesisView() {
  const wizardState = useWizardState();

  // Reset wizard on mount ONLY if project creation is complete
  // This allows starting a new project after finishing one
  useEffect(() => {
    const currentStatus = useHiveStore.getState().wizardState.status;
    if (currentStatus === 'complete') {
      console.log('[Genesis] Previous project complete, resetting wizard for new project');
      useHiveStore.getState().resetWizard();
    } else {
      console.log('[Genesis] Preserving wizard state:', currentStatus);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
            <span className="text-lg font-bold text-white">H</span>
          </div>
          <div>
            <h1 className="font-semibold text-slate-900">THE HIVE</h1>
            <p className="text-xs text-slate-500">Genesis Wizard</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          {wizardState.status === 'scope_selection' && <ScopeSelector key="scope" />}
          {wizardState.status === 'questionnaire' && <QuestionnaireStep key="questionnaire" />}
          {wizardState.status === 'context_collection' && <ContextCollectionStep key="context" />}
          {wizardState.status === 'project_info' && <ProjectInfoStep key="project_info" />}
          {wizardState.status === 'preview' && <PreviewStep key="preview" />}
          {wizardState.status === 'generating' && <GeneratingStep key="generating" />}
          {wizardState.status === 'complete' && <CompleteStep key="complete" />}
        </AnimatePresence>
      </main>
    </div>
  );
}
