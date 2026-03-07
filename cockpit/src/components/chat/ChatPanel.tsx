// ============================================
// THE HIVE OS V4 - Chat Panel Component
// Centre de la conversation avec un agent
// ============================================

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { AGENTS, type ChatMessage as ChatMessageType, type AgentRole } from '../../types';
import { useCurrentProject, useHiveStore } from '../../store/useHiveStore';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const agent = AGENTS[activeAgent];

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full">
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
            style={{ ringColor: agent.color.primary }}
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
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
              <span className="text-xs text-slate-500">Tâche:</span>
              <span className="text-xs font-medium text-slate-700 max-w-[200px] truncate">
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
        {isEmpty ? (
          <EmptyState agent={agent} />
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
// Empty State Component
// ============================================
interface EmptyStateProps {
  agent: typeof AGENTS[AgentRole];
}

function EmptyState({ agent }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full text-center px-8"
    >
      <div
        className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-offset-4 mb-6 shadow-lg"
        style={{ ringColor: agent.color.light }}
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
    orchestrator: [
      "Je veux lancer une campagne Meta Ads",
      "Comment ameliorer mes performances ?",
      "J'ai besoin d'aide pour mon marketing",
    ],
  };

  return suggestions[agentId] || suggestions.orchestrator;
}
