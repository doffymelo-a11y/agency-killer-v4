// ═══════════════════════════════════════════════════════════════
// Agent Avatar Component
// ═══════════════════════════════════════════════════════════════

import { AGENTS } from '../../../types';
import type { AgentRole } from '../../../types';

export interface AgentAvatarProps {
  agentId: AgentRole;
  size?: 'sm' | 'md' | 'lg';
}

export default function AgentAvatar({
  agentId,
  size = 'md',
}: AgentAvatarProps) {
  const agent = AGENTS[agentId];
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  return (
    <img
      src={agent.avatar}
      alt={agent.name}
      className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-offset-1`}
      style={{
        '--tw-ring-color': agent.color.primary,
      } as React.CSSProperties}
    />
  );
}
