/**
 * Ensure all required RPC functions exist in Supabase
 * This is run once at backend startup to verify functions
 */

import { supabaseAdmin } from '../services/supabase.service.js';
import { logger } from '../lib/logger.js';

export async function ensureRPCFunctions() {
  try {
    logger.log('[Setup] Checking RPC functions...');

    // Check update_ticket_status function
    const { error: statusError } = await supabaseAdmin.rpc('update_ticket_status', {
      p_ticket_id: '00000000-0000-0000-0000-000000000000',
      p_status: 'open',
      p_resolved_at: null,
    });

    if (statusError) {
      if (statusError.message.includes('Could not find') || statusError.message.includes('does not exist')) {
        logger.log('[Setup] ⚠️  update_ticket_status function missing');
      } else if (statusError.message.includes('Ticket not found')) {
        logger.log('[Setup] ✓ update_ticket_status function exists');
      }
    } else {
      logger.log('[Setup] ✓ update_ticket_status function exists');
    }

    // Check create_user_support_message function
    const { error: userMessageError } = await supabaseAdmin.rpc('create_user_support_message', {
      p_ticket_id: '00000000-0000-0000-0000-000000000000',
      p_message: 'test',
      p_attachments: [],
    });

    if (userMessageError) {
      if (userMessageError.message.includes('Could not find') || userMessageError.message.includes('does not exist')) {
        logger.log('[Setup] ⚠️  create_user_support_message function missing');
      } else {
        // Any other error means the function exists (like foreign key constraint)
        logger.log('[Setup] ✓ create_user_support_message function exists');
      }
    } else {
      logger.log('[Setup] ✓ create_user_support_message function exists');
    }

    // Check create_admin_support_message function
    const { error: adminMessageError } = await supabaseAdmin.rpc('create_admin_support_message', {
      p_ticket_id: '00000000-0000-0000-0000-000000000000',
      p_message: 'test',
      p_attachments: [],
    });

    if (adminMessageError) {
      if (adminMessageError.message.includes('Could not find') || adminMessageError.message.includes('does not exist')) {
        logger.log('[Setup] ⚠️  create_admin_support_message function missing');
      } else {
        // Any other error means the function exists (like foreign key constraint)
        logger.log('[Setup] ✓ create_admin_support_message function exists');
      }
    } else {
      logger.log('[Setup] ✓ create_admin_support_message function exists');
    }
  } catch (error) {
    console.error('[Setup] Error checking RPC functions:', error);
  }
}
