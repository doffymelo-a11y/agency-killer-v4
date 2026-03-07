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
} from '../store/useHiveStore';
import type { Task, TaskStatus } from '../types';

// Import extracted components
import TopBar from '../components/layout/TopBar';
import BoardHeader from '../components/board/BoardHeader';
import LeftSidebar from '../components/board/LeftSidebar';
import RightSidebar from '../components/board/RightSidebar';
import TableView from '../components/board/TableView';
import KanbanView from '../components/board/KanbanView';
import CalendarView from '../components/board/CalendarView';
import TaskDetailModal from '../components/board/TaskDetailModal';

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

      // Set task context and agent, clear messages
      useHiveStore.setState({
        activeAgent: task.assignee,
        activeTaskId: taskId,
        taskContext,
        chatMessages: [],
        isChatOpen: true,
      });

      // Navigate to chat immediately (agent will greet user intelligently)
      navigate(`/chat/${projectId}/${taskId}`);

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

      // V5 - Call TypeScript Backend API (NOT n8n)
      const { sendChatMessage } = await import('../services/api');

      console.log('[Board] Calling Backend V5 API for task execution...');

      // V5 - Build intelligent task prompt with context and instructions
      const taskPrompt = `# TASK LAUNCH: ${task.title}

## Your Mission
${task.description}

## Context Questions to Ask
${task.context_questions?.length > 0
  ? task.context_questions.map((q: string) => `- ${q}`).join('\n')
  : '- Prerequisites needed?\n- Access/connections required?\n- Information to gather?'
}

## INSTRUCTIONS
🎯 **START BY ENGAGING THE USER - DO NOT execute anything yet!**

1. **Greet professionally** and acknowledge the task launch
2. **Assess what's needed**: Based on the context questions above, identify what information, connections, or prerequisites are required
3. **Ask proactive questions**: Engage the user by asking about:
   - What connections/access they have (GA4, GSC, CMS, etc.)
   - What information is available or missing
   - Their goals and constraints for this specific task
4. **Propose an action plan**: Once you understand the situation, propose concrete next steps

**Remember:** You have powerful MCP tools at your disposal. Be specific about what you can do and what you need from the user to proceed.

Let's start! 🚀`;

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

      // Replace loading message with PM response
      if (response.success) {
        // Handle both response formats:
        // - New format: { agent_response: { message, agent_used, ui_components } }
        // - Legacy format: { chat_message, ui_components, action }
        const message = response.agent_response?.message || (response as any).chat_message;
        const agentUsed = response.agent_response?.agent_used || task.assignee;
        const uiComponents = response.agent_response?.ui_components || (response as any).ui_components;

        console.log('[Board] Extracted message:', message);
        console.log('[Board] Extracted agent:', agentUsed);

        if (message) {
          console.log('[Board] Extracted uiComponents:', uiComponents);

          // Clear the loading message and add the real response
          useHiveStore.setState({
            chatMessages: [
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
          });
        } else {
          console.error('[Board] No message in response!', response);
        }
      }
    } catch (error) {
      console.error('[Board] Error launching task:', error);

      // Replace loading with error message
      useHiveStore.setState({
        chatMessages: [
          {
            id: uuidv4(),
            role: 'assistant',
            content: `❌ Une erreur s'est produite lors du lancement de la tâche.\n\nPas de panique ! Vous pouvez me décrire ce que vous souhaitez faire et je vous aiderai.`,
            agent_id: task.assignee,
            timestamp: new Date(),
            created_at: new Date().toISOString(),
          },
        ],
      });
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
    </div>
  );
}
