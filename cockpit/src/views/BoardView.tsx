// ═══════════════════════════════════════════════════════════════
// THE HIVE OS V4 - Board View (Project Dashboard)
// Table / Kanban / Calendar views with Agent Avatars
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';

import {
  useHiveStore,
  useCurrentProject,
  useTasks,
  useBoardView,
  useProjectProgress,
  useIsLoading,
  usePhaseTransitionProposal,
} from '../store/useHiveStore';
import type { Task, TaskStatus } from '../types';
import { AGENTS } from '../types';

// Import extracted components
import TopBar from '../components/layout/TopBar';
import BoardHeader from '../components/board/BoardHeader';
import LeftSidebar from '../components/board/LeftSidebar';
import RightSidebar from '../components/board/RightSidebar';
import TableView from '../components/board/TableView';
import KanbanView from '../components/board/KanbanView';
import CalendarView from '../components/board/CalendarView';
import TaskDetailModal from '../components/board/TaskDetailModal';
import PhaseTransitionModal from '../components/board/PhaseTransitionModal';

// ─────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────

export default function BoardView() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const project = useCurrentProject();
  const tasks = useTasks();
  const boardView = useBoardView();
  const progress = useProjectProgress();
  const isLoading = useIsLoading();
  const error = useHiveStore((state) => state.error);

  const updateTaskStatus = useHiveStore((state) => state.updateTaskStatus);

  // Phase 2.11 - Phase Transition
  const phaseTransitionProposal = usePhaseTransitionProposal();
  const acceptPhaseTransition = useHiveStore((state) => state.acceptPhaseTransition);
  const dismissPhaseTransition = useHiveStore((state) => state.dismissPhaseTransition);

  // State for task detail modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Fetch project on mount - use getState() to avoid infinite loop
  // Only fetch if we don't have the project or it's a different project
  useEffect(() => {
    if (!projectId) return;

    const state = useHiveStore.getState();
    // Skip if already loading or if project is already loaded
    if (state.isLoading) return;
    if (state.currentProject?.id === projectId && state.tasks.length > 0) return;

    state.fetchProjectWithTasks(projectId);
  }, [projectId]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (projectId) {
      const unsubscribe = useHiveStore.getState().subscribeToProject(projectId);
      return () => unsubscribe();
    }
  }, [projectId]);

  const handleLaunchTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    try {
      // Update task status to in_progress
      if (task.status === 'todo') {
        await updateTaskStatus(taskId, 'in_progress');
      }

      // Initialize chat context WITHOUT opening it yet
      const taskContext = {
        taskId: task.id,
        title: task.title,
        description: task.description,
        contextQuestions: task.context_questions || [],
        userInputs: task.user_inputs,
      };

      // Get current state to check if this is a new task or resuming the same task
      const currentState = useHiveStore.getState();
      const isNewTask = currentState.activeTaskId !== taskId;

      // Set task context and agent
      // CRITICAL: Only clear messages if launching a DIFFERENT task
      useHiveStore.setState({
        activeAgent: task.assignee,
        activeTaskId: taskId,
        taskContext,
        chatMessages: isNewTask ? [] : currentState.chatMessages, // Preserve messages if resuming same task
        isChatOpen: true,
        isThinking: true, // CRITICAL: Show LoadingState animation while backend processes
      });

      // Navigate to chat immediately (agent will greet user intelligently)
      navigate(`/chat/${projectId}/${taskId}`);

      // If resuming same task with existing messages, don't call backend again
      if (!isNewTask && currentState.chatMessages.length > 0) {
        console.log('[Board] Resuming existing task with conversation, skipping backend call');
        return;
      }

      // Prepare shared project context for Backend V5
      const sharedContext = {
        project_id: projectId!,
        project_name: project?.name || 'Projet',
        project_status: project?.status || 'active',
        current_phase: project?.current_phase || 'Setup',
        scope: project?.scope || 'meta_ads',
        state_flags: project?.state_flags || {
          strategy_validated: false,
          budget_approved: false,
          creatives_ready: false,
          tracking_ready: false,
          ads_live: false,
        },
        metadata: project?.metadata || {},
      };

      console.log('[Board] About to call Backend V5 with task:', {
        task_id: task.id,
        assignee: task.assignee,
        context: sharedContext,
      });

      // V5.1 - PHASE 2.12: Get contextual explanation from task explainer
      console.log('[Board] Calling Task Explainer for contextual explanation...');

      let taskExplanation = null;
      try {
        const explainerResponse = await fetch('http://localhost:3457/api/task-explainer/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task_id: taskId,
            project_id: projectId,
            agent_id: task.assignee,
          }),
        });

        if (explainerResponse.ok) {
          const explainerData = await explainerResponse.json();
          taskExplanation = explainerData.explanation;
          console.log('[Board] ✅ Got contextual explanation:', taskExplanation);
        } else {
          console.warn('[Board] ⚠️ Explainer failed, falling back to description');
        }
      } catch (explainerError) {
        console.error('[Board] ❌ Error calling task explainer:', explainerError);
      }

      // V5 - Call TypeScript Backend API (NOT n8n)
      const { sendChatMessage } = await import('../services/api');

      console.log('[Board] Calling Backend V5 API for task execution...');

      // V5.1 - Build intelligent task prompt with CONTEXTUAL EXPLANATION
      const taskPrompt = taskExplanation ? `# NOUVELLE TÂCHE: ${task.title}

## 🎯 CONTEXTE INTELLIGENT (généré par le système)

Voici le contexte complet de cette tâche basé sur tout ce qui s'est passé avant dans le projet :

**📋 Ce que cette tâche implique concrètement:**
${taskExplanation.explanation}

**⏰ Pourquoi cette tâche MAINTENANT:**
${taskExplanation.whyNow}

**✅ Ce qui a été accompli AVANT par les autres agents:**
${taskExplanation.whatWasDoneBefore.length > 0
  ? taskExplanation.whatWasDoneBefore.map((item: string) => `- ${item}`).join('\n')
  : '- C\'est le début du projet'}

**🚀 Ce que cette tâche va PERMETTRE ensuite:**
${taskExplanation.whatThisEnables}

**💡 TON rôle spécifique sur cette tâche:**
${taskExplanation.agentRole}

---

## 📝 Questions clés à poser à l'utilisateur

${task.context_questions?.length > 0
  ? task.context_questions.map((q: string) => `- ${q}`).join('\n')
  : '- Quels sont les prérequis nécessaires ?\n- Quels accès/connexions sont disponibles ?\n- Quelles informations devons-nous rassembler ?'}

---

## ⚡ INSTRUCTIONS POUR TOI

**CRITICAL:** Tu DOIS utiliser le contexte intelligent ci-dessus pour engager l'utilisateur de façon pertinente et contextuelle.

**❌ INTERDIT:**
- Répéter ou "cracher" la description brute de la tâche
- Dire des généralités comme "Je suis là pour vous aider"
- Ignorer ce qui a été fait avant

**✅ OBLIGATOIRE:**
1. **Salue** et reconnais explicitement CE QUI A ÉTÉ FAIT AVANT par les autres agents (cite-les par leur nom)
2. **Explique pourquoi cette tâche est importante MAINTENANT** dans la séquence du projet
3. **Pose des questions précises** basées sur les "Questions clés" ci-dessus
4. **Propose des actions concrètes** que tu peux faire avec tes outils MCP

**Ton objectif:** Montrer que tu COMPRENDS le contexte du projet et que tu sais POURQUOI cette tâche arrive maintenant.

Commence ! 🚀` : `# NOUVELLE TÂCHE: ${task.title}

${task.description}

## Questions à poser:
${task.context_questions?.length > 0
  ? task.context_questions.map((q: string) => `- ${q}`).join('\n')
  : '- Quels sont les prérequis ?'}

Engage l'utilisateur et pose des questions précises avant d'exécuter quoi que ce soit.`;

      const response = await sendChatMessage(
        taskPrompt,
        crypto.randomUUID(), // V5: Generate valid UUID for session
        sharedContext,
        task.assignee,
        'task_execution' // chat_mode for tasks
      );

      console.log('[Board] ✅ PM Response received:', response);
      console.log('[Board] Response success:', response?.success);
      console.log('[Board] Response agent_response:', response?.agent_response);

      // Add agent's proactive response to chat
      if (response.success) {
        // Backend V5 returns: { success, agent, message, ui_components, ... }
        const message = (response as any).message;
        const agentUsed = (response as any).agent || (response as any).agent_id || task.assignee;
        const uiComponents = (response as any).ui_components;

        console.log('[Board] Extracted message:', message);
        console.log('[Board] Extracted agent:', agentUsed);

        if (message) {
          console.log('[Board] Extracted uiComponents:', uiComponents);

          // Add the agent's proactive response
          useHiveStore.setState((s) => ({
            chatMessages: [
              ...s.chatMessages,
              {
                id: uuidv4(),
                role: 'assistant',
                content: message,
                agent_id: agentUsed,
                ui_components: uiComponents,
                timestamp: new Date(),
                created_at: new Date().toISOString(),
              },
            ],
            isThinking: false,
          }));

          console.log('[Board] ✅ Agent message added to chat:', {
            messageLength: message.length,
            agent: agentUsed,
            hasUI: !!uiComponents,
          });
        } else {
          console.error('[Board] ❌ No message in response!', response);

          // Add fallback message
          useHiveStore.setState((s) => ({
            chatMessages: [
              ...s.chatMessages,
              {
                id: uuidv4(),
                role: 'assistant',
                content: `Bonjour ! Je suis ${AGENTS[task.assignee].name}.\n\nJe vais vous aider avec cette tâche. Que souhaitez-vous faire ?`,
                agent_id: task.assignee,
                timestamp: new Date(),
                created_at: new Date().toISOString(),
              },
            ],
            isThinking: false,
          }));
        }
      } else {
        console.error('[Board] ❌ Backend returned error:', response);
      }
    } catch (error) {
      console.error('[Board] ❌ Error launching task:', error);

      // Add error message to chat
      useHiveStore.setState((s) => ({
        chatMessages: [
          ...s.chatMessages,
          {
            id: uuidv4(),
            role: 'assistant',
            content: `❌ Une erreur s'est produite lors du lancement de la tâche.\n\nPas de panique ! Vous pouvez me décrire ce que vous souhaitez faire et je vous aiderai.`,
            agent_id: task.assignee,
            timestamp: new Date(),
            created_at: new Date().toISOString(),
          },
        ],
        isThinking: false,
      }));
    }
  };

  const handleUpdateStatus = async (taskId: string, status: TaskStatus) => {
    await updateTaskStatus(taskId, status);
  };

  const handleCompleteTask = async (taskId: string) => {
    // Confirmation avant de marquer comme terminée
    if (window.confirm('Marquer cette tâche comme terminée ?')) {
      await updateTaskStatus(taskId, 'done');
    }
  };

  const handleReopenTask = async (taskId: string) => {
    // Rouvrir la tâche (passer de done à in_progress)
    if (window.confirm('Rouvrir cette tâche ?')) {
      await updateTaskStatus(taskId, 'in_progress');
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-lg font-bold text-white">H</span>
          </div>
          <p className="text-slate-500">Chargement du projet...</p>
        </div>
      </div>
    );
  }

  // Show error state if project failed to load
  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Impossible de charger le projet
          </h2>
          <p className="text-slate-500 mb-4">
            {error || 'Le projet demandé n\'existe pas ou n\'est pas accessible.'}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => projectId && useHiveStore.getState().fetchProjectWithTasks(projectId)}
              className="btn btn-secondary"
            >
              Réessayer
            </button>
            <button
              onClick={() => navigate('/genesis')}
              className="btn btn-primary"
            >
              Nouveau projet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Bar (User Menu) */}
      <TopBar />

      {/* Header (simplifié) */}
      <BoardHeader
        projectName={project.name}
        tasks={tasks}
        progress={progress}
        projectId={projectId!}
        onNavigate={navigate}
      />

      {/* 3 Columns Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <LeftSidebar
          projectId={projectId!}
          tasks={tasks}
          onNavigate={navigate}
        />

        {/* Main Content (Middle Column) */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="card overflow-hidden">
              {boardView === 'table' && (
                <TableView
                  tasks={tasks}
                  onLaunchTask={handleLaunchTask}
                  onClickTask={(task) => setSelectedTask(task)}
                  onCompleteTask={handleCompleteTask}
                  onReopenTask={handleReopenTask}
                />
              )}

              {boardView === 'kanban' && (
                <KanbanView
                  tasks={tasks}
                  onLaunchTask={handleLaunchTask}
                  onUpdateStatus={handleUpdateStatus}
                />
              )}

              {boardView === 'calendar' && (
                <CalendarView tasks={tasks} onLaunchTask={handleLaunchTask} />
              )}
            </div>
          </div>
        </main>

        {/* Right Sidebar */}
        <RightSidebar
          project={project}
          tasks={tasks}
        />
      </div>

      {/* Task Detail Modal */}
      <AnimatePresence>
        {selectedTask && (
          <TaskDetailModal
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            onLaunch={() => {
              handleLaunchTask(selectedTask.id);
              setSelectedTask(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Phase 2.11 - Phase Transition Modal */}
      <AnimatePresence>
        {phaseTransitionProposal && (
          <PhaseTransitionModal
            proposal={phaseTransitionProposal}
            onAccept={acceptPhaseTransition}
            onDismiss={dismissPhaseTransition}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
