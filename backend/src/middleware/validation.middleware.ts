/**
 * Validation Middleware - Zod schema validation
 * Validates request bodies against Zod schemas
 */

import type { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

// ─────────────────────────────────────────────────────────────────
// Validation Middleware Factory
// ─────────────────────────────────────────────────────────────────

/**
 * Create middleware that validates request body against Zod schema
 */
export function validate<T extends z.ZodTypeAny>(schema: T) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate and parse request body
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors into user-friendly messages
        const formattedErrors = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        res.status(400).json({
          success: false,
          error: {
            message: 'Validation error',
            code: 'VALIDATION_ERROR',
            details: formattedErrors,
          },
        });
        return;
      }

      // Unknown error
      console.error('[Validation Middleware] Error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Validation processing error',
          code: 'VALIDATION_PROCESSING_ERROR',
        },
      });
    }
  };
}

// ─────────────────────────────────────────────────────────────────
// Common Schemas
// ─────────────────────────────────────────────────────────────────

export const schemas = {
  // Shared schemas
  agentId: z.enum(['luna', 'sora', 'marcus', 'milo', 'doffy']),
  chatMode: z.enum(['task_execution', 'quick_research', 'chat']),
  projectScope: z.enum([
    'seo_campaign',
    'paid_ads_launch',
    'social_media_campaign',
    'content_marketing',
    'brand_strategy',
    'website_audit',
    'competitor_analysis',
  ]),

  // Chat request schema
  chatRequest: z.object({
    action: z.enum(['task_launch', 'quick_action', 'chat']),
    chatInput: z.string().min(1, 'Chat input cannot be empty'),
    session_id: z.string().uuid('Invalid session ID'),
    project_id: z.string().uuid('Invalid project ID'),
    activeAgentId: z.enum(['luna', 'sora', 'marcus', 'milo', 'doffy']),
    system_instruction: z.string().optional(),
    chat_mode: z.enum(['task_execution', 'quick_research', 'chat']),
    shared_memory: z.object({
      project_id: z.string().uuid(),
      project_name: z.string(),
      project_scope: z.enum([
        'seo_campaign',
        'paid_ads_launch',
        'social_media_campaign',
        'content_marketing',
        'brand_strategy',
        'website_audit',
        'competitor_analysis',
      ]),
      project_metadata: z.record(z.unknown()),
      current_phase: z.string().optional(),
      state_flags: z.record(z.boolean()).optional(),
      deliverables: z.array(z.unknown()).optional(),
      recent_activity: z.array(z.string()).optional(),
    }),
    task_context: z
      .object({
        task_id: z.string().uuid(),
        task_title: z.string(),
        task_description: z.string(),
        task_type: z.string(),
        assigned_agent: z.enum(['luna', 'sora', 'marcus', 'milo', 'doffy']),
        dependencies: z.array(z.string()).optional(),
        user_inputs: z.record(z.string()).optional(),
      })
      .optional(),
    image: z.string().optional(), // Base64
  }),

  // Genesis request schema
  genesisRequest: z.object({
    action: z.literal('genesis'),
    project_name: z.string().min(1, 'Project name is required'),
    scope: z.enum([
      'seo_campaign',
      'paid_ads_launch',
      'social_media_campaign',
      'content_marketing',
      'brand_strategy',
      'website_audit',
      'competitor_analysis',
    ]),
    metadata: z.record(z.unknown()),
    generated_tasks: z.array(
      z.object({
        title: z.string(),
        description: z.string(),
        type: z.string(),
        status: z.enum(['pending', 'in_progress', 'blocked', 'completed', 'cancelled']),
        assigned_agent: z.enum(['luna', 'sora', 'marcus', 'milo', 'doffy']),
        dependencies: z.array(z.string()).optional(),
      })
    ),
  }),

  // Analytics request schema
  analyticsRequest: z.object({
    action: z.literal('analytics_fetch'),
    project_id: z.string().uuid(),
    source: z.enum(['ga4', 'google_ads', 'meta_ads', 'overview']),
    date_range: z.object({
      start: z.string(), // ISO date
      end: z.string(), // ISO date
      preset: z.enum(['7d', '30d', '90d', 'custom']),
    }),
    metrics: z.array(z.string()).optional(),
    shared_memory: z.object({
      project_id: z.string().uuid(),
      project_name: z.string(),
      project_scope: z.enum([
        'seo_campaign',
        'paid_ads_launch',
        'social_media_campaign',
        'content_marketing',
        'brand_strategy',
        'website_audit',
        'competitor_analysis',
      ]),
      project_metadata: z.record(z.unknown()),
    }),
  }),
};
