-- ============================================
-- Migration 013: Add doffy to agent_role enum
-- ============================================
-- Date: 2026-03-16
-- Description: Add 'doffy' agent for social media campaigns

-- Add doffy to agent_role enum
ALTER TYPE agent_role ADD VALUE IF NOT EXISTS 'doffy';

-- Verify the change
COMMENT ON TYPE agent_role IS 'Agent roles: sora, luna, marcus, milo, doffy, orchestrator';
