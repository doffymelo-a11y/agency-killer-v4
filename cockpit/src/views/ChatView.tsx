import TopBar from '../components/layout/TopBar';
// ═══════════════════════════════════════════════════════════════
// THE HIVE OS V4 - Chat View (Full Chat Interface)
// 3-column layout: TeamDock | ChatPanel | TheDeck
// ═══════════════════════════════════════════════════════════════

import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  useHiveStore,
  useCurrentProject,
  useTasks,
  useTaskContext,
} from '../store/useHiveStore';
import MainLayout from '../components/layout/MainLayout';

export default function ChatView() {
  const { projectId, taskId } = useParams<{ projectId: string; taskId?: string }>();
  const project = useCurrentProject();
  const tasks = useTasks();
  const taskContext = useTaskContext();

  // Fetch project if not loaded
  useEffect(() => {
    if (projectId && !project) {
      useHiveStore.getState().fetchProjectWithTasks(projectId);
    }
  }, [projectId, project]);

  // Load task context if taskId is present but context is not set
  // This handles direct URL navigation or page refresh
  useEffect(() => {
    if (!taskId) return;

    // Skip if task context is already set for this task
    if (taskContext?.taskId === taskId) return;

    // Wait for tasks to be loaded
    if (tasks.length === 0) return;

    // Find the task and launch chat with context
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      console.log('[ChatView] Loading task context for:', taskId);
      useHiveStore.getState().launchTaskChat(taskId);
    }
  }, [taskId, taskContext, tasks]);

  return <MainLayout showChat={true} />;
}
