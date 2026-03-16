-- ============================================
-- Migration 011: Add social_media to project_scope enum
-- ============================================
-- Date: 2026-03-16
-- Description: Add 'social_media' value to project_scope enum for Doffy agent

-- Add social_media to project_scope enum
ALTER TYPE project_scope ADD VALUE IF NOT EXISTS 'social_media';

-- Verify the change
COMMENT ON TYPE project_scope IS 'Project scopes: meta_ads, sem, seo, analytics, social_media, full_scale';
