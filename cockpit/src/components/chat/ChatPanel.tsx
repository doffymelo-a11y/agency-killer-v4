// ============================================
// THE HIVE OS V4 - Chat Panel Component
// Centre de la conversation avec un agent
// ============================================

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { AGENTS, type ChatMessage as ChatMessageType, type AgentRole } from '../../types';
import {
  useCurrentProject,
  useHiveStore,
  useTaskLaunchOverlay,
} from '../../store/useHiveStore';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import TaskLaunchOverlay from './TaskLaunchOverlay';

interface TaskContext {
  taskId: string;
  title: string;
  description?: string;
  contextQuestions: string[];
  userInputs?: Record<string, string>;
}

interface ChatPanelProps {
  messages: ChatMessageType[];
  activeAgent: AgentRole;
  isThinking: boolean;
  onSendMessage: (text: string, imageBase64?: string) => void;
  taskContext?: TaskContext | null;
}

export default function ChatPanel({
  messages,
  activeAgent,
  isThinking,
  onSendMessage,
  taskContext,
}: ChatPanelProps) {
  const navigate = useNavigate();
  const project = useCurrentProject();
  const taskLaunchOverlay = useTaskLaunchOverlay();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const agent = AGENTS[activeAgent];

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isEmpty = messages.length === 0;

  return (
    <div className="relative flex flex-col h-full">
      {/* V4 B1 - Centered launch overlay (visible during task launch round-trip, min 2s) */}
      <AnimatePresence>
        {taskLaunchOverlay.visible && taskLaunchOverlay.agentId && taskLaunchOverlay.taskTitle && (
          <TaskLaunchOverlay
            agentId={taskLaunchOverlay.agentId}
            taskTitle={taskLaunchOverlay.taskTitle}
            startedAt={taskLaunchOverlay.startedAt}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div
        className="px-6 py-4 border-b flex items-center justify-between"
        style={{ borderColor: agent.color.light }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/board/${project?.id}`)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Back to board"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div
            className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-offset-2"
            style={{ '--tw-ring-color': agent.color.primary } as React.CSSProperties}
          >
            <img
              src={agent.avatar}
              alt={agent.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              {agent.name}
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: agent.color.light, color: agent.color.primary }}
              >
                {agent.role}
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              {agent.expertise.slice(0, 3).join(' - ')}
            </p>
          </div>
        </div>

        {/* Task Badge + Complete Button (when in task mode) */}
        {taskContext && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg max-w-md">
              <span className="text-xs text-slate-500">Tâche:</span>
              <span className="text-xs font-medium text-slate-700 line-clamp-1" title={taskContext.title}>
                {taskContext.title}
              </span>
            </div>
            <button
              onClick={async () => {
                if (window.confirm('Marquer cette tâche comme terminée ?')) {
                  // Update task status to done
                  await useHiveStore.getState().updateTaskStatus(taskContext.taskId, 'done');

                  // Add success notification
                  useHiveStore.getState().addNotification({
                    type: 'success',
                    message: `✅ Tâche terminée: ${taskContext.title}`,
                    duration: 5000,
                  });

                  // Clear task context
                  useHiveStore.setState({
                    taskContext: null,
                    activeTaskId: null,
                  });

                  // Redirect to board
                  navigate(`/board/${project?.id}`);
                }
              }}
              className="btn btn-primary bg-green-600 hover:bg-green-700 text-sm"
              title="Terminer la tâche"
            >
              <CheckCircle2 className="w-4 h-4" />
              Terminer
            </button>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-premium">
        {isEmpty && !isThinking ? (
          <EmptyState agent={agent} taskContext={taskContext} />
        ) : isEmpty && isThinking ? (
          <LoadingState agent={agent} taskContext={taskContext} />
        ) : (
          <AnimatePresence>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-6 py-4 border-t border-slate-100">
        <ChatInput
          activeAgent={activeAgent}
          isThinking={isThinking}
          onSendMessage={onSendMessage}
        />
      </div>
    </div>
  );
}

// ============================================
// Loading State Component (When thinking at launch)
// ============================================
interface LoadingStateProps {
  agent: typeof AGENTS[AgentRole];
  taskContext?: TaskContext | null;
}

function LoadingState({ agent, taskContext }: LoadingStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center h-full text-center px-8"
    >
      {/* Animated Agent Avatar */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          rotate: [0, 2, -2, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-24 h-24 rounded-2xl overflow-hidden ring-4 ring-offset-4 mb-6 shadow-2xl"
        style={{ '--tw-ring-color': agent.color.light } as React.CSSProperties}
      >
        <img
          src={agent.avatar}
          alt={agent.name}
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* Loading Message */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 justify-center">
          <span>{agent.name} lance la tâche</span>
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ✨
          </motion.span>
        </h3>

        {taskContext && (
          <div className="inline-block px-4 py-2 bg-slate-100 rounded-xl border border-slate-200">
            <p className="text-sm font-medium text-slate-700">
              {taskContext.title}
            </p>
          </div>
        )}

        <p className="text-sm text-slate-600 max-w-md">
          {agent.name} prépare votre session et analyse le contexte du projet
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0 }}
          >.</motion.span>
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
          >.</motion.span>
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
          >.</motion.span>
        </p>

        {/* Progress Indicator */}
        <div className="flex gap-2 justify-center pt-2">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: agent.color.primary }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.2,
              }}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// Empty State Component
// ============================================
interface EmptyStateProps {
  agent: typeof AGENTS[AgentRole];
  taskContext?: TaskContext | null;
}

function EmptyState({ agent, taskContext }: EmptyStateProps) {
  // If in task mode, show task-specific empty state
  if (taskContext) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center h-full text-center px-8"
      >
        <div
          className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-offset-4 mb-6 shadow-lg"
          style={{ '--tw-ring-color': agent.color.light } as React.CSSProperties}
        >
          <img
            src={agent.avatar}
            alt={agent.name}
            className="w-full h-full object-cover"
          />
        </div>

        <h3 className="text-lg font-semibold text-slate-800 mb-2">
          {taskContext.title}
        </h3>

        {taskContext.description && (
          <p className="text-sm text-slate-600 max-w-2xl mb-6">
            {taskContext.description}
          </p>
        )}

        <div className="space-y-2 w-full max-w-2xl mb-6">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-3 flex items-center justify-center gap-2">
            <MessageSquare className="w-3 h-3" />
            {agent.name} attend votre réponse...
          </p>

          {/* Task Context Questions as Suggested Prompts */}
          {taskContext.contextQuestions && taskContext.contextQuestions.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-600 mb-2">
                Questions clés pour cette tâche :
              </p>
              {taskContext.contextQuestions.map((question, index) => (
                <div
                  key={index}
                  className="p-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 text-left"
                >
                  <span className="text-slate-400 mr-2">•</span>
                  {question}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <p className="text-xs text-slate-500 max-w-md">
          💡 Répondez aux questions ci-dessus ou décrivez ce que vous souhaitez faire pour cette tâche.
        </p>
      </motion.div>
    );
  }

  // Default empty state (no task)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full text-center px-8"
    >
      <div
        className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-offset-4 mb-6 shadow-lg"
        style={{ '--tw-ring-color': agent.color.light } as React.CSSProperties}
      >
        <img
          src={agent.avatar}
          alt={agent.name}
          className="w-full h-full object-cover"
        />
      </div>

      <h3 className="text-lg font-semibold text-slate-800 mb-2">
        Discutez avec {agent.name}
      </h3>

      <p className="text-sm text-slate-500 max-w-md mb-6">
        Je suis votre {agent.role.toLowerCase()}. Je peux vous aider avec :
      </p>

      {/* Expertise Tags */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {agent.expertise.map((skill) => (
          <span
            key={skill}
            className="px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: agent.color.light, color: agent.color.primary }}
          >
            {skill}
          </span>
        ))}
      </div>

      {/* Suggestions */}
      <div className="space-y-2 w-full max-w-md">
        <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">
          <MessageSquare className="w-3 h-3 inline mr-1" />
          Suggestions de requetes
        </p>
        {getSuggestionsForAgent(agent.id).map((suggestion, index) => (
          <div
            key={index}
            className="p-3 bg-white border border-slate-100 rounded-xl text-sm text-slate-600 hover:border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer text-left"
          >
            "{suggestion}"
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================
// Suggestions per Agent
// ============================================
function getSuggestionsForAgent(agentId: AgentRole): string[] {
  const suggestions: Record<AgentRole, string[]> = {
    sora: [
      "Analyse mes KPIs et dis-moi ce qui cloche",
      "Configure le tracking de conversions sur mon site",
      "Explique-moi comment calculer mon ROAS optimal",
    ],
    luna: [
      "Fais un audit SEO de mon site",
      "Propose une strategie de contenu pour mon marche",
      "Analyse mes concurrents et leurs points forts",
    ],
    marcus: [
      "Quelles campagnes dois-je couper ou scaler ?",
      "Comment repartir mon budget pub ce mois-ci ?",
      "Quelle structure de campagne Meta recommandes-tu ?",
    ],
    milo: [
      "Cree une pub complete pour mon produit",
      "Redige un article de blog sur [sujet]",
      "Propose 3 angles creatifs pour ma campagne",
    ],
    doffy: [
      "Cree un calendrier de contenu pour la semaine",
      "Redige un post LinkedIn pour promouvoir notre service",
      "Quels hashtags utiliser pour toucher mon audience ?",
    ],
    orchestrator: [
      "Je veux lancer une campagne Meta Ads",
      "Comment ameliorer mes performances ?",
      "J'ai besoin d'aide pour mon marketing",
    ],
  };

  return suggestions[agentId] || suggestions.orchestrator;
}
