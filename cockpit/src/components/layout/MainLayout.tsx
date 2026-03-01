// ============================================
// THE HIVE OS V4 - Main Layout Component
// 3-column layout: TeamDock | Chat | TheDeck
// ============================================

import {
  useHiveStore,
  useChatMessages,
  useActiveAgent,
  useIsThinking,
  useShowAgentHelp,
  useIsDeckCollapsed,
  useTaskContext,
} from '../../store/useHiveStore';
import { type AgentRole } from '../../types';
import TeamDock from './TeamDock';
import TheDeck from './TheDeck';
import ChatPanel from '../chat/ChatPanel';
import TopBar from './TopBar';

interface MainLayoutProps {
  children?: React.ReactNode;
  showChat?: boolean;
}

export default function MainLayout({ children, showChat = true }: MainLayoutProps) {
  const messages = useChatMessages();
  const activeAgent = useActiveAgent();
  const isThinking = useIsThinking();
  const showAgentHelp = useShowAgentHelp();
  const isDeckCollapsed = useIsDeckCollapsed();
  const taskContext = useTaskContext();

  const handleAgentSelect = (agent: AgentRole) => {
    useHiveStore.getState().setActiveAgent(agent);
  };

  const handleAgentHelpClick = (agent: AgentRole) => {
    const currentHelp = useHiveStore.getState().showAgentHelp;
    if (currentHelp === agent) {
      useHiveStore.getState().setShowAgentHelp(null);
    } else {
      useHiveStore.getState().setShowAgentHelp(agent);
      // Auto-expand deck if collapsed
      if (useHiveStore.getState().isDeckCollapsed) {
        useHiveStore.getState().setDeckCollapsed(false);
      }
    }
  };

  const handleCloseHelp = () => {
    useHiveStore.getState().setShowAgentHelp(null);
  };

  const handleToggleDeck = () => {
    useHiveStore.getState().toggleDeck();
  };

  const handleSendMessage = (text: string, imageBase64?: string) => {
    useHiveStore.getState().sendMessage(text, imageBase64);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Top Bar (User Menu) */}
      <TopBar />

      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Team Dock */}
        <TeamDock
          activeAgent={activeAgent}
          onAgentSelect={handleAgentSelect}
          onAgentHelpClick={handleAgentHelpClick}
        />

        {/* Center: Content or Chat */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {showChat ? (
            <ChatPanel
              messages={messages}
              activeAgent={activeAgent}
              isThinking={isThinking}
              onSendMessage={handleSendMessage}
              taskContext={taskContext}
            />
          ) : (
            children
          )}
        </div>

        {/* Right: The Deck (Agent Help) - Collapsible */}
        <TheDeck
          showAgentHelp={showAgentHelp}
          onCloseHelp={handleCloseHelp}
          isCollapsed={isDeckCollapsed}
          onToggleCollapse={handleToggleDeck}
        />
      </div>
    </div>
  );
}
