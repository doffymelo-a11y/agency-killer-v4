// ═══════════════════════════════════════════════════════════════
// THE HIVE OS V4 - Main Store (Zustand + Supabase Realtime)
// ═══════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import type {
  Project,
  Task,
  TaskStatus,
  WizardState,
  WizardEvent,
  AgentRole,
  ChatSession,
  ChatMessage,
  Notification,
} from '../types';
// V5 - TypeScript Backend API (New)
import {
  sendChatMessage,
  parseChatResponse,
} from '../services/api';

// Keep n8n types for compatibility (will be migrated later)
import {
  type SharedProjectContext,
  type TaskExecutionContext,
  type WriteBackCommand,
} from '../services/n8n';
import { checkUsageLimit, incrementUsage } from '../services/stripe';

// ─────────────────────────────────────────────────────────────────
// Store Types
// ─────────────────────────────────────────────────────────────────

type BoardView = 'table' | 'kanban' | 'calendar';

interface HiveState {
  // Data
  projects: Project[];
  currentProject: Project | null;
  tasks: Task[];
  chatSessions: ChatSession[];
  chatMessages: ChatMessage[];

  // UI State
  isLoading: boolean;
  error: string | null;
  boardView: BoardView;
  notifications: Notification[];

  // Genesis Wizard State
  wizardState: WizardState;

  // Chat State
  activeTaskId: string | null;
  isChatOpen: boolean;
  activeAgent: AgentRole;
  isThinking: boolean;
  showAgentHelp: AgentRole | null;
  isDeckCollapsed: boolean;
  taskContext: {
    taskId: string;
    title: string;
    description?: string;
    contextQuestions: string[];
    userInputs?: Record<string, string>;
  } | null;

  // Actions - Data
  fetchProjects: () => Promise<void>;
  fetchProjectWithTasks: (projectId: string) => Promise<void>;
  createProject: (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>, tasks: Omit<Task, 'id' | 'project_id' | 'created_at'>[]) => Promise<string>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  unblockTask: (taskId: string, taskTitle: string) => Promise<void>;
  updateTaskUserInputs: (taskId: string, userInputs: Record<string, string>) => Promise<void>;
  completeTask: (taskId: string, deliverableUrl?: string) => Promise<void>;

  // Actions - UI
  setBoardView: (view: BoardView) => void;
  setActiveTask: (taskId: string | null) => void;
  setChatOpen: (open: boolean) => void;
  clearError: () => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;

  // Actions - Wizard
  dispatchWizard: (event: WizardEvent) => void;
  resetWizard: () => void;

  // Actions - Chat
  setActiveAgent: (agent: AgentRole) => void;
  setShowAgentHelp: (agent: AgentRole | null) => void;
  setDeckCollapsed: (collapsed: boolean) => void;
  toggleDeck: () => void;
  sendMessage: (text: string, imageBase64?: string) => Promise<void>;
  clearChatMessages: () => void;
  launchTaskChat: (taskId: string) => void;

  // Actions - Write-Back (V4.2 - Mémoire Partagée)
  processWriteBackCommands: (commands: WriteBackCommand[]) => Promise<void>;
  processStateUpdate: (
    stateUpdate: {
      task_status?: TaskStatus;
      state_flags?: Partial<Record<string, boolean>>;
      deliverable_url?: string;
      deliverable_type?: string;
    },
    taskId: string | null
  ) => Promise<void>;
  updateProjectStateFlags: (flags: Partial<Record<string, boolean>>) => Promise<void>;

  // Realtime
  subscribeToProject: (projectId: string) => () => void;
}

// ─────────────────────────────────────────────────────────────────
// Wizard Reducer
// ─────────────────────────────────────────────────────────────────

function wizardReducer(state: WizardState, event: WizardEvent): WizardState {
  switch (event.type) {
    case 'SELECT_SCOPE':
      return {
        status: 'questionnaire',
        scope: event.scope,
        step: 0,
        answers: [],
      };

    case 'ANSWER':
      if (state.status !== 'questionnaire') return state;
      return {
        ...state,
        answers: [...state.answers, event.answer],
      };

    case 'NEXT':
      if (state.status === 'questionnaire') {
        // Move to next question
        return {
          ...state,
          step: state.step + 1,
        };
      }
      return state;

    case 'BACK':
      if (state.status === 'questionnaire' && state.step > 0) {
        return {
          ...state,
          step: state.step - 1,
          answers: state.answers.slice(0, -1),
        };
      }
      if (state.status === 'questionnaire' && state.step === 0) {
        return { status: 'scope_selection' };
      }
      if (state.status === 'context_collection') {
        // Go back to last questionnaire step
        return {
          status: 'questionnaire',
          scope: state.scope,
          step: state.answers.length - 1,
          answers: state.answers,
        };
      }
      if (state.status === 'project_info') {
        return {
          status: 'context_collection',
          scope: state.scope,
          answers: state.answers,
          contextAnswers: state.contextAnswers,
        };
      }
      if (state.status === 'preview') {
        return {
          status: 'project_info',
          scope: state.scope,
          answers: state.answers,
          contextAnswers: state.contextAnswers,
        };
      }
      return state;

    case 'SET_PROJECT_INFO':
      // Handle transition from questionnaire to context_collection
      if (state.status === 'questionnaire' && !event.name && !event.deadline) {
        return {
          status: 'context_collection',
          scope: state.scope,
          answers: state.answers,
          contextAnswers: {},
        };
      }
      // Handle form submission in project_info step
      if (state.status === 'project_info' && event.name && event.deadline) {
        return {
          status: 'preview',
          scope: state.scope,
          answers: state.answers,
          contextAnswers: state.contextAnswers,
          projectName: event.name,
          deadline: event.deadline,
        };
      }
      return state;

    case 'SET_CONTEXT':
      // Handle transition from context_collection to project_info
      if (state.status === 'context_collection') {
        return {
          status: 'project_info',
          scope: state.scope,
          answers: state.answers,
          contextAnswers: event.contextAnswers,
        };
      }
      return state;

    case 'SUBMIT':
      if (state.status !== 'preview') return state;
      return { status: 'generating' };

    case 'GENERATION_COMPLETE':
      return {
        status: 'complete',
        projectId: event.projectId,
      };

    case 'RESET':
      return { status: 'scope_selection' };

    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────────
// Initial State
// ─────────────────────────────────────────────────────────────────

const initialWizardState: WizardState = { status: 'scope_selection' };

// ─────────────────────────────────────────────────────────────────
// Store Creation
// ─────────────────────────────────────────────────────────────────

export const useHiveStore = create<HiveState>()(
  devtools(
    subscribeWithSelector((set, _get) => ({
      // Initial State
      projects: [],
      currentProject: null,
      tasks: [],
      chatSessions: [],
      chatMessages: [],
      isLoading: false,
      error: null,
      boardView: 'table',
      notifications: [],
      wizardState: initialWizardState,
      activeTaskId: null,
      isChatOpen: false,
      activeAgent: 'sora',
      isThinking: false,
      showAgentHelp: null,
      isDeckCollapsed: false,
      taskContext: null,

      // ─────────────────────────────────────────────────────────────
      // Data Actions
      // ─────────────────────────────────────────────────────────────

      fetchProjects: async () => {
        console.log('[HIVE] fetchProjects: Starting...');
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

          console.log('[HIVE] fetchProjects: Response', { data, error });

          if (error) throw error;
          set({ projects: data || [], isLoading: false });
          console.log('[HIVE] fetchProjects: Success, loaded', data?.length, 'projects');
        } catch (err) {
          console.error('[HIVE] fetchProjects: Error', err);
          set({ error: (err as Error).message, isLoading: false });
        }
      },

      fetchProjectWithTasks: async (projectId: string) => {
        // Guard: prevent duplicate fetches
        const state = _get();
        if (state.isLoading) {
          console.log('[HIVE] fetchProjectWithTasks: Already loading, skipping');
          return;
        }
        if (state.currentProject?.id === projectId && state.tasks.length > 0) {
          console.log('[HIVE] fetchProjectWithTasks: Project already loaded, skipping');
          return;
        }

        console.log('[HIVE] fetchProjectWithTasks: Starting for', projectId);
        set({ isLoading: true, error: null });
        try {
          // Fetch project
          console.log('[HIVE] fetchProjectWithTasks: Fetching project...');
          const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();

          console.log('[HIVE] fetchProjectWithTasks: Project response', { project, projectError });

          if (projectError) throw projectError;

          // Fetch tasks
          console.log('[HIVE] fetchProjectWithTasks: Fetching tasks...');
          const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .eq('project_id', projectId)
            .order('due_date', { ascending: true });

          console.log('[HIVE] fetchProjectWithTasks: Tasks response', { tasks: tasks?.length, tasksError });

          if (tasksError) throw tasksError;

          set({
            currentProject: project,
            tasks: tasks || [],
            isLoading: false,
          });
          console.log('[HIVE] fetchProjectWithTasks: Success!');
        } catch (err) {
          console.error('[HIVE] fetchProjectWithTasks: Error', err);
          set({ error: (err as Error).message, isLoading: false });
        }
      },

      createProject: async (projectData, tasksData) => {
        console.log('[HIVE] createProject: Starting...', { projectData, tasksCount: tasksData.length });
        set({ isLoading: true, error: null });
        try {
          // Check usage limits BEFORE creating project
          console.log('[HIVE] createProject: Checking usage limits...');
          const limitCheck = await checkUsageLimit('projects');

          if (!limitCheck.allowed) {
            const errorMsg = `Limite atteinte: Vous avez créé ${limitCheck.current_usage}/${limitCheck.limit_value} projets avec votre plan ${limitCheck.plan}. Passez à un plan supérieur pour créer plus de projets.`;
            console.error('[HIVE] createProject: Limit reached', limitCheck);
            set({ error: errorMsg, isLoading: false });
            throw new Error(errorMsg);
          }

          // Insert project
          console.log('[HIVE] createProject: Inserting project...');
          const { data: project, error: projectError } = await supabase
            .from('projects')
            .insert(projectData)
            .select()
            .single();

          console.log('[HIVE] createProject: Project insert response', { project, projectError });

          if (projectError) throw projectError;

          // Insert tasks with project_id
          const tasksWithProjectId = tasksData.map((task) => ({
            ...task,
            project_id: project.id,
          }));

          console.log('[HIVE] createProject: Inserting', tasksWithProjectId.length, 'tasks...');
          const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .insert(tasksWithProjectId)
            .select();

          console.log('[HIVE] createProject: Tasks insert response', { tasksCount: tasks?.length, tasksError });

          if (tasksError) throw tasksError;

          // V5 - Setup sequential dependencies (each task depends on the previous one)
          if (tasks && tasks.length > 1) {
            console.log('[HIVE] Setting up sequential task dependencies...');

            for (let i = 1; i < tasks.length; i++) {
              const currentTask = tasks[i];
              const previousTask = tasks[i - 1];

              // Update task to depend on previous task
              const { error: depError } = await supabase
                .from('tasks')
                .update({
                  depends_on: [previousTask.id],
                })
                .eq('id', currentTask.id);

              if (depError) {
                console.error(`[HIVE] Error setting dependency for task ${i}:`, depError);
              } else {
                // Update local task object
                currentTask.depends_on = [previousTask.id];
              }
            }

            console.log('[HIVE] Sequential dependencies set up successfully');
          }

          // Update store
          set((state) => ({
            projects: [project, ...state.projects],
            currentProject: project,
            tasks: tasks || [],
            isLoading: false,
          }));

          // Increment usage for tasks created
          if (tasks && tasks.length > 0) {
            await incrementUsage('tasks', tasks.length);
          }

          console.log('[HIVE] createProject: Success! Project ID:', project.id);
          return project.id;
        } catch (err) {
          console.error('[HIVE] createProject: Error', err);
          set({ error: (err as Error).message, isLoading: false });
          throw err;
        }
      },

      updateTaskStatus: async (taskId: string, status: TaskStatus) => {
        try {
          const state = _get();
          const updates: Partial<Task> = { status };

          if (status === 'in_progress') {
            updates.started_at = new Date().toISOString();
          } else if (status === 'done') {
            updates.completed_at = new Date().toISOString();
          }

          const { error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', taskId);

          if (error) throw error;

          // Optimistic update
          set((s) => ({
            tasks: s.tasks.map((t) =>
              t.id === taskId ? { ...t, ...updates } : t
            ),
          }));

          // V5 - Auto-unblock dependent tasks when this task is completed
          if (status === 'done') {
            console.log('[HIVE] Task completed, checking for dependent tasks to unblock...');

            // Strategy 1: Find explicit dependent tasks (with depends_on referencing this task)
            const explicitDependents = state.tasks.filter((t) =>
              t.depends_on && t.depends_on.includes(taskId) && t.status === 'blocked'
            );

            // Strategy 2: Find next blocked task in sequence (for legacy tasks without depends_on)
            const completedTaskIndex = state.tasks.findIndex((t) => t.id === taskId);
            const nextTask = completedTaskIndex >= 0 && completedTaskIndex < state.tasks.length - 1
              ? state.tasks[completedTaskIndex + 1]
              : null;

            console.log('[HIVE] Found explicit dependent tasks:', explicitDependents.length);
            console.log('[HIVE] Next task in sequence:', nextTask?.title);

            // Unblock explicit dependents
            for (const depTask of explicitDependents) {
              const allDependenciesDone = depTask.depends_on?.every((depId) => {
                const dep = state.tasks.find((t) => t.id === depId);
                return dep?.status === 'done';
              });

              if (allDependenciesDone) {
                console.log('[HIVE] Unblocking task (explicit dependency):', depTask.title);
                await state.unblockTask(depTask.id, depTask.title);
              }
            }

            // Unblock next task in sequence if blocked and no explicit dependents were found
            if (nextTask && nextTask.status === 'blocked' && explicitDependents.length === 0) {
              console.log('[HIVE] Unblocking next task in sequence:', nextTask.title);
              await state.unblockTask(nextTask.id, nextTask.title);
            }
          }
        } catch (err) {
          set({ error: (err as Error).message });
        }
      },

      unblockTask: async (taskId: string, taskTitle: string) => {
        const state = _get();
        try {
          // Unblock task by setting status to 'todo'
          const { error: unblockError } = await supabase
            .from('tasks')
            .update({ status: 'todo' })
            .eq('id', taskId);

          if (!unblockError) {
            // Update local state
            set((s) => ({
              tasks: s.tasks.map((t) =>
                t.id === taskId ? { ...t, status: 'todo' as TaskStatus } : t
              ),
            }));

            // Add notification
            state.addNotification({
              type: 'success',
              message: `✅ Tâche débloquée: ${taskTitle}`,
              duration: 5000,
            });
          }
        } catch (err) {
          console.error('[HIVE] Error unblocking task:', err);
        }
      },

      updateTaskUserInputs: async (taskId: string, userInputs: Record<string, string>) => {
        try {
          const { error } = await supabase
            .from('tasks')
            .update({ user_inputs: userInputs })
            .eq('id', taskId);

          if (error) throw error;

          // Optimistic update
          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === taskId ? { ...t, user_inputs: userInputs } : t
            ),
          }));
        } catch (err) {
          set({ error: (err as Error).message });
        }
      },

      completeTask: async (taskId: string, deliverableUrl?: string) => {
        try {
          const updates: Partial<Task> = {
            status: 'done',
            completed_at: new Date().toISOString(),
          };

          if (deliverableUrl) {
            updates.deliverable_url = deliverableUrl;
          }

          const { error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', taskId);

          if (error) throw error;

          // Optimistic update
          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === taskId ? { ...t, ...updates } : t
            ),
            activeTaskId: null,
            isChatOpen: false,
          }));
        } catch (err) {
          set({ error: (err as Error).message });
        }
      },

      // ─────────────────────────────────────────────────────────────
      // UI Actions
      // ─────────────────────────────────────────────────────────────

      setBoardView: (view) => set({ boardView: view }),

      setActiveTask: (taskId) => set({ activeTaskId: taskId }),

      setChatOpen: (open) => set({ isChatOpen: open }),

      clearError: () => set({ error: null }),

      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: uuidv4(),
        };
        set((state) => ({
          notifications: [...state.notifications, newNotification],
        }));
        if (notification.duration !== 0) {
          setTimeout(() => {
            _get().removeNotification(newNotification.id);
          }, notification.duration || 5000);
        }
      },

      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      // ─────────────────────────────────────────────────────────────
      // Chat Actions
      // ─────────────────────────────────────────────────────────────

      setActiveAgent: (agent) => set({ activeAgent: agent }),

      setShowAgentHelp: (agent) => set({ showAgentHelp: agent }),

      setDeckCollapsed: (collapsed) => set({ isDeckCollapsed: collapsed }),

      toggleDeck: () => set((state) => ({ isDeckCollapsed: !state.isDeckCollapsed })),

      launchTaskChat: (taskId: string) => {
        const state = _get();
        const task = state.tasks.find((t) => t.id === taskId);

        if (!task) {
          console.error('[HIVE] launchTaskChat: Task not found', taskId);
          return;
        }

        // Switch to the task's assigned agent
        const agent = task.assignee;

        // Set task context
        const taskContext = {
          taskId: task.id,
          title: task.title,
          description: task.description,
          contextQuestions: task.context_questions || [],
          userInputs: task.user_inputs,
        };

        // Clear previous messages and set new context
        set({
          activeAgent: agent,
          activeTaskId: taskId,
          taskContext,
          chatMessages: [],
          isChatOpen: true,
        });

        // Add initial system message with task context
        const contextInfo = task.user_inputs
          ? Object.entries(task.user_inputs).map(([k, v]) => `- **${k}**: ${v}`).join('\n')
          : 'Aucune information supplementaire fournie.';

        const systemMessage: ChatMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: `**Tache: ${task.title}**\n\n${task.description || ''}\n\n**Contexte du projet:**\n${contextInfo}\n\nJe suis pret a vous aider avec cette tache. Que souhaitez-vous faire ?`,
          agent_id: agent,
          responding_agent: agent,
          timestamp: new Date(),
          created_at: new Date().toISOString(),
        };

        set((s) => ({
          chatMessages: [systemMessage],
        }));

        console.log('[HIVE] launchTaskChat: Started', { taskId, agent, taskContext });
      },

      sendMessage: async (text: string, imageBase64?: string) => {
        const state = _get();
        const { activeAgent, currentProject, taskContext, activeTaskId, addNotification } = state;

        // Add user message
        const userMessage: ChatMessage = {
          id: uuidv4(),
          role: 'user',
          content: text,
          image_url: imageBase64,
          timestamp: new Date(),
          created_at: new Date().toISOString(),
        };

        set((s) => ({
          chatMessages: [...s.chatMessages, userMessage],
          isThinking: true,
        }));

        try {
          // Check usage limits BEFORE sending message
          const limitCheck = await checkUsageLimit('chat_messages');

          if (!limitCheck.allowed) {
            const errorMsg = `Limite atteinte: Vous avez envoyé ${limitCheck.current_usage}/${limitCheck.limit_value} messages ce mois-ci avec votre plan ${limitCheck.plan}. Passez à un plan supérieur pour continuer.`;
            throw new Error(errorMsg);
          }

          // Generate session ID (V5: must be a valid UUID for backend validation)
          const sessionId = crypto.randomUUID();

          // V4.2 - Build Shared Project Context (La Mémoire Partagée)
          const sharedContext: SharedProjectContext | null = currentProject
            ? {
                project_id: currentProject.id,
                project_name: currentProject.name,
                project_status: currentProject.status,
                current_phase: currentProject.current_phase,
                scope: currentProject.scope,
                state_flags: currentProject.state_flags,
                metadata: currentProject.metadata,
              }
            : null;

          // V4.2 - Build Task Execution Context if in task mode
          let taskExecContext: TaskExecutionContext | null = null;
          const chatMode = taskContext ? 'task_execution' : 'quick_research';

          if (taskContext && activeTaskId) {
            const currentTask = state.tasks.find((t) => t.id === activeTaskId);
            taskExecContext = {
              task_id: taskContext.taskId,
              task_title: taskContext.title,
              task_description: taskContext.description,
              task_phase: currentTask?.phase || 'Production',
              context_questions: taskContext.contextQuestions,
              user_inputs: taskContext.userInputs || {},
              depends_on: currentTask?.depends_on || [],
            };
          }

          console.log('[HIVE] Sending message with shared context:', {
            sharedContext: !!sharedContext,
            taskContext: !!taskExecContext,
            chatMode,
          });

          // V5 - Call TypeScript Backend API
          // Ensure we have a valid shared context
          if (!sharedContext) {
            throw new Error('Projet non trouvé. Veuillez sélectionner un projet d\'abord.');
          }

          const response = await sendChatMessage(
            text,
            sessionId,
            sharedContext,
            activeAgent,
            chatMode,
            imageBase64
          );

          // Increment agent calls after successful orchestrator call
          await incrementUsage('agent_calls', 1);

          // Parse response (V5 format)
          const parsed = parseChatResponse(response);

          // V4.2 - Process Write-Back Commands
          if (parsed.writeBackCommands.length > 0) {
            console.log('[HIVE] Processing write-back commands:', parsed.writeBackCommands);
            await _get().processWriteBackCommands(parsed.writeBackCommands);
          }

          // V4.2 - Process State Update (simpler format)
          if (parsed.stateUpdate) {
            console.log('[HIVE] Processing state update:', parsed.stateUpdate);
            await _get().processStateUpdate(parsed.stateUpdate, activeTaskId);
          }

          // Determine responding agent (for dynamic avatar switch)
          const respondingAgent = parsed.respondingAgent || parsed.agentUsed || activeAgent;

          // Switch agent if different
          if (respondingAgent && respondingAgent !== activeAgent) {
            set({ activeAgent: respondingAgent });
          }

          // Add AI message
          const aiMessage: ChatMessage = {
            id: uuidv4(),
            role: 'assistant',
            content: parsed.message,
            agent_id: activeAgent,
            responding_agent: respondingAgent,
            timestamp: new Date(),
            created_at: new Date().toISOString(),
            ui_components: parsed.uiComponents,
          };

          set((s) => ({
            chatMessages: [...s.chatMessages, aiMessage],
            isThinking: false,
          }));

          // Increment usage after successful message
          await incrementUsage('chat_messages', 1);
        } catch (error) {
          console.error('Error sending message:', error);

          const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';

          // Add error message
          const errorMsg: ChatMessage = {
            id: uuidv4(),
            role: 'assistant',
            content: `**Erreur de communication**\n\n${errorMessage}\n\nVeuillez reessayer.`,
            agent_id: activeAgent,
            timestamp: new Date(),
            created_at: new Date().toISOString(),
          };

          set((s) => ({
            chatMessages: [...s.chatMessages, errorMsg],
            isThinking: false,
          }));

          addNotification({
            type: 'error',
            message: errorMessage,
            duration: 8000,
          });
        }
      },

      clearChatMessages: () => set({ chatMessages: [] }),

      // ─────────────────────────────────────────────────────────────
      // Write-Back Actions (V4.2 - Mémoire Partagée)
      // ─────────────────────────────────────────────────────────────

      processWriteBackCommands: async (commands: WriteBackCommand[]) => {
        const state = _get();

        for (const cmd of commands) {
          console.log('[HIVE] Processing write-back command:', cmd);

          switch (cmd.type) {
            case 'UPDATE_TASK_STATUS':
              if (cmd.task_id && cmd.status) {
                await state.updateTaskStatus(cmd.task_id, cmd.status);
              }
              break;

            case 'UPDATE_STATE_FLAG':
              if (cmd.flag_name !== undefined && cmd.flag_value !== undefined) {
                await state.updateProjectStateFlags({ [cmd.flag_name]: cmd.flag_value });
              }
              break;

            case 'SET_DELIVERABLE':
              if (cmd.task_id && cmd.deliverable_url) {
                try {
                  const { error } = await supabase
                    .from('tasks')
                    .update({
                      deliverable_url: cmd.deliverable_url,
                      deliverable_type: cmd.deliverable_type || 'text',
                    })
                    .eq('id', cmd.task_id);

                  if (error) throw error;

                  // Optimistic update
                  set((s) => ({
                    tasks: s.tasks.map((t) =>
                      t.id === cmd.task_id
                        ? { ...t, deliverable_url: cmd.deliverable_url, deliverable_type: (cmd.deliverable_type || 'text') as Task['deliverable_type'] }
                        : t
                    ),
                  }));
                  console.log('[HIVE] Deliverable set for task:', cmd.task_id);
                } catch (err) {
                  console.error('[HIVE] Error setting deliverable:', err);
                }
              }
              break;

            case 'COMPLETE_TASK':
              if (cmd.task_id) {
                await state.completeTask(cmd.task_id, cmd.deliverable_url);
              }
              break;

            default:
              console.warn('[HIVE] Unknown write-back command type:', cmd.type);
          }
        }
      },

      processStateUpdate: async (
        stateUpdate: {
          task_status?: TaskStatus;
          state_flags?: Partial<Record<string, boolean>>;
          deliverable_url?: string;
          deliverable_type?: string;
        },
        taskId: string | null
      ) => {
        const state = _get();

        // Update task status if provided
        if (taskId && stateUpdate.task_status) {
          await state.updateTaskStatus(taskId, stateUpdate.task_status);
        }

        // Update state flags if provided
        if (stateUpdate.state_flags) {
          await state.updateProjectStateFlags(stateUpdate.state_flags);
        }

        // Set deliverable if provided
        if (taskId && stateUpdate.deliverable_url) {
          try {
            const { error } = await supabase
              .from('tasks')
              .update({
                deliverable_url: stateUpdate.deliverable_url,
                deliverable_type: stateUpdate.deliverable_type || 'text',
              })
              .eq('id', taskId);

            if (error) throw error;

            set((s) => ({
              tasks: s.tasks.map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      deliverable_url: stateUpdate.deliverable_url,
                      deliverable_type: (stateUpdate.deliverable_type || 'text') as Task['deliverable_type'],
                    }
                  : t
              ),
            }));
            console.log('[HIVE] Deliverable set via state update for task:', taskId);
          } catch (err) {
            console.error('[HIVE] Error setting deliverable via state update:', err);
          }
        }
      },

      updateProjectStateFlags: async (flags: Partial<Record<string, boolean>>) => {
        const state = _get();
        const project = state.currentProject;

        if (!project) {
          console.warn('[HIVE] No current project to update state flags');
          return;
        }

        try {
          const newStateFlags = { ...project.state_flags, ...flags };

          const { error } = await supabase
            .from('projects')
            .update({ state_flags: newStateFlags, updated_at: new Date().toISOString() })
            .eq('id', project.id);

          if (error) throw error;

          // Optimistic update
          set({
            currentProject: { ...project, state_flags: newStateFlags },
          });

          console.log('[HIVE] State flags updated:', flags);

          // Add notification
          state.addNotification({
            type: 'success',
            message: 'Etat du projet mis a jour',
            duration: 3000,
          });
        } catch (err) {
          console.error('[HIVE] Error updating state flags:', err);
          set({ error: (err as Error).message });
        }
      },

      // ─────────────────────────────────────────────────────────────
      // Wizard Actions
      // ─────────────────────────────────────────────────────────────

      dispatchWizard: (event) => {
        set((state) => ({
          wizardState: wizardReducer(state.wizardState, event),
        }));
      },

      resetWizard: () => set({ wizardState: initialWizardState }),

      // ─────────────────────────────────────────────────────────────
      // Realtime Subscription
      // ─────────────────────────────────────────────────────────────

      subscribeToProject: (projectId: string) => {
        // Subscribe to tasks changes
        const tasksChannel = supabase
          .channel(`tasks:${projectId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'tasks',
              filter: `project_id=eq.${projectId}`,
            },
            (payload) => {
              const { eventType, new: newRecord, old: oldRecord } = payload;

              set((state) => {
                switch (eventType) {
                  case 'INSERT':
                    return { tasks: [...state.tasks, newRecord as Task] };
                  case 'UPDATE':
                    return {
                      tasks: state.tasks.map((t) =>
                        t.id === (newRecord as Task).id ? (newRecord as Task) : t
                      ),
                    };
                  case 'DELETE':
                    return {
                      tasks: state.tasks.filter((t) => t.id !== (oldRecord as Task).id),
                    };
                  default:
                    return state;
                }
              });
            }
          )
          .subscribe();

        // Subscribe to project changes
        const projectChannel = supabase
          .channel(`project:${projectId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'projects',
              filter: `id=eq.${projectId}`,
            },
            (payload) => {
              set({ currentProject: payload.new as Project });
            }
          )
          .subscribe();

        // Return unsubscribe function
        return () => {
          supabase.removeChannel(tasksChannel);
          supabase.removeChannel(projectChannel);
        };
      },
    })),
    { name: 'hive-store' }
  )
);

// ─────────────────────────────────────────────────────────────────
// Selectors
// ─────────────────────────────────────────────────────────────────

export const useProjects = () => useHiveStore((state) => state.projects);
export const useCurrentProject = () => useHiveStore((state) => state.currentProject);
export const useTasks = () => useHiveStore((state) => state.tasks);
export const useBoardView = () => useHiveStore((state) => state.boardView);
export const useWizardState = () => useHiveStore((state) => state.wizardState);
export const useActiveTask = () => {
  const tasks = useHiveStore((state) => state.tasks);
  const activeTaskId = useHiveStore((state) => state.activeTaskId);
  return tasks.find((t) => t.id === activeTaskId) || null;
};
export const useIsLoading = () => useHiveStore((state) => state.isLoading);
export const useError = () => useHiveStore((state) => state.error);

// Task selectors by status
export const useTasksByStatus = (status: TaskStatus) =>
  useHiveStore((state) => state.tasks.filter((t) => t.status === status));

export const useTasksByAgent = (agent: AgentRole) =>
  useHiveStore((state) => state.tasks.filter((t) => t.assignee === agent));

// Progress selector
export const useProjectProgress = () => {
  const tasks = useHiveStore((state) => state.tasks);
  if (tasks.length === 0) return 0;
  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  return Math.round((doneTasks / tasks.length) * 100);
};

// Chat selectors
export const useChatMessages = () => useHiveStore((state) => state.chatMessages);
export const useActiveAgent = () => useHiveStore((state) => state.activeAgent);
export const useIsThinking = () => useHiveStore((state) => state.isThinking);
export const useShowAgentHelp = () => useHiveStore((state) => state.showAgentHelp);
export const useNotifications = () => useHiveStore((state) => state.notifications);
export const useIsDeckCollapsed = () => useHiveStore((state) => state.isDeckCollapsed);
export const useTaskContext = () => useHiveStore((state) => state.taskContext);
