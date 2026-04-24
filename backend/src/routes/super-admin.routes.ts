/**
 * Super Admin Routes - Backoffice Management
 * Phase 1 - Super Admin Backoffice Implementation
 * Date: 2026-04-19
 *
 * All routes require super_admin role (NOT admin)
 * All actions are automatically logged to super_admin_access_logs
 *
 * Routes:
 * GET    /api/super-admin/tickets - List all support tickets
 * GET    /api/super-admin/tickets/:id - View ticket details
 * PATCH  /api/super-admin/tickets/:id/status - Update ticket status
 * POST   /api/super-admin/tickets/:id/reply - Reply to ticket
 * GET    /api/super-admin/users - List all users
 * GET    /api/super-admin/users/:id - View user details
 * GET    /api/super-admin/logs/audit - View audit trail
 * GET    /api/super-admin/logs/system - View system logs
 */

import { Router } from 'express';
import type { Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware.js';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth.middleware.js';
import {
  requireSuperAdmin,
  superAdminRateLimit,
  autoLogSuperAdminAction,
} from '../middleware/super-admin.middleware.js';
import { supabaseAdmin } from '../services/supabase.service.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────

/**
 * Fetch user details from Auth API
 * Cannot use JOIN with auth.users - must use Auth Admin API
 */
async function getUserDetails(userId: string) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (error || !data.user) {
      return null;
    }
    return {
      id: data.user.id,
      email: data.user.email || null,
      created_at: data.user.created_at,
    };
  } catch (error) {
    console.error(`[SuperAdmin] Failed to fetch user ${userId}:`, error);
    return null;
  }
}

/**
 * Enrich tickets with user details
 */
async function enrichTicketsWithUserDetails(tickets: any[]) {
  const enriched = await Promise.all(
    tickets.map(async (ticket) => {
      const user = ticket.user_id ? await getUserDetails(ticket.user_id) : null;
      const assignedAdmin = ticket.assigned_to ? await getUserDetails(ticket.assigned_to) : null;

      return {
        ...ticket,
        user,
        assigned_admin: assignedAdmin,
      };
    })
  );

  return enriched;
}

// Apply auth + super admin check + rate limit to ALL routes
router.use(authMiddleware);
router.use(requireSuperAdmin);
router.use(superAdminRateLimit);

// ─────────────────────────────────────────────────────────────────
// Support Ticket Management
// ─────────────────────────────────────────────────────────────────

/**
 * GET /api/superadmin/tickets/stats - Ticket statistics
 * IMPORTANT: Must be defined BEFORE /tickets/:id to avoid route conflict
 */
router.get(
  '/tickets/stats',
  autoLogSuperAdminAction('view_ticket_stats', 'ticket'),
  asyncHandler(async (_req, res) => {
    // Count by status
    const { data: statusCounts } = await supabaseAdmin
      .from('support_tickets')
      .select('status')
      .then((res) => {
        if (res.error) return { data: [] };
        const counts: Record<string, number> = {};
        res.data.forEach((ticket: any) => {
          counts[ticket.status] = (counts[ticket.status] || 0) + 1;
        });
        return { data: counts };
      });

    // Count by priority
    const { data: priorityCounts } = await supabaseAdmin
      .from('support_tickets')
      .select('priority')
      .then((res) => {
        if (res.error) return { data: [] };
        const counts: Record<string, number> = {};
        res.data.forEach((ticket: any) => {
          counts[ticket.priority] = (counts[ticket.priority] || 0) + 1;
        });
        return { data: counts };
      });

    // Total tickets
    const { count: totalTickets } = await supabaseAdmin
      .from('support_tickets')
      .select('*', { count: 'exact', head: true });

    // Average response time (calculate from tickets with first_response_at)
    const { data: ticketsWithResponse } = await supabaseAdmin
      .from('support_tickets')
      .select('created_at, first_response_at')
      .not('first_response_at', 'is', null);

    let avgResponseTimeHours = 0;
    if (ticketsWithResponse && ticketsWithResponse.length > 0) {
      const totalResponseTime = ticketsWithResponse.reduce((sum, ticket: any) => {
        const created = new Date(ticket.created_at).getTime();
        const responded = new Date(ticket.first_response_at).getTime();
        return sum + (responded - created);
      }, 0);
      avgResponseTimeHours = totalResponseTime / ticketsWithResponse.length / (1000 * 60 * 60);
    }

    res.json({
      success: true,
      data: {
        total: totalTickets || 0,
        by_status: statusCounts || {},
        by_priority: priorityCounts || {},
        avg_response_time_hours: avgResponseTimeHours,
      },
    });
  })
);

/**
 * GET /api/super-admin/tickets - List all support tickets
 * Query params:
 *   - status: filter by status (open, in_progress, resolved, closed)
 *   - priority: filter by priority (low, medium, high, critical)
 *   - category: filter by category
 *   - limit: max results (default 50)
 *   - offset: pagination offset
 */
router.get(
  '/tickets',
  autoLogSuperAdminAction('list_tickets', 'ticket'),
  asyncHandler(async (req, res) => {
    const status = req.query.status as string | undefined;
    const priority = req.query.priority as string | undefined;
    const category = req.query.category as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    // Fetch tickets WITHOUT JOINs (auth.users JOIN not supported)
    let query = supabaseAdmin
      .from('support_tickets')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }
    if (category) {
      query = query.eq('category', category);
    }

    const { data: tickets, error, count } = await query;

    if (error) {
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch tickets',
          code: 'TICKETS_FETCH_ERROR',
          details: error.message,
        },
      });
      return;
    }

    // Enrich with user details via Auth Admin API
    const enrichedTickets = await enrichTicketsWithUserDetails(tickets || []);

    res.json({
      success: true,
      data: {
        tickets: enrichedTickets,
        pagination: {
          limit,
          offset,
          total: count || 0,
        },
      },
    });
  })
);

/**
 * GET /api/super-admin/tickets/:id - View ticket details
 * Includes all messages and internal notes
 */
router.get(
  '/tickets/:id',
  autoLogSuperAdminAction('view_ticket', 'ticket'),
  asyncHandler(async (req, res) => {
    const ticketId = req.params.id;

    // Fetch ticket WITHOUT JOINs
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Ticket not found',
          code: 'TICKET_NOT_FOUND',
        },
      });
      return;
    }

    // Fetch user and admin details via Auth Admin API
    const user = ticket.user_id ? await getUserDetails(ticket.user_id) : null;
    const assignedAdmin = ticket.assigned_to ? await getUserDetails(ticket.assigned_to) : null;

    // Fetch messages
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch messages',
          code: 'MESSAGES_FETCH_ERROR',
        },
      });
      return;
    }

    // Fetch internal notes (WITHOUT JOIN)
    const { data: internalNotes } = await supabaseAdmin
      .from('support_internal_notes')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    // Enrich internal notes with author details
    const enrichedNotes = internalNotes
      ? await Promise.all(
          internalNotes.map(async (note) => {
            const author = note.author_id ? await getUserDetails(note.author_id) : null;
            return {
              ...note,
              author,
              author_email: author?.email || null,
            };
          })
        )
      : [];

    res.json({
      success: true,
      data: {
        ticket: {
          ...ticket,
          user,
          user_email: user?.email || null,
          assigned_admin: assignedAdmin,
        },
        messages: messages || [],
        internal_notes: enrichedNotes,
      },
    });
  })
);

/**
 * PATCH /api/super-admin/tickets/:id/status - Update ticket status
 * Body: { status: 'open' | 'in_progress' | 'resolved' | 'closed' }
 */
router.patch(
  '/tickets/:id/status',
  autoLogSuperAdminAction('update_ticket_status', 'ticket'),
  asyncHandler(async (req, res) => {
    const ticketId = req.params.id;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid status',
          code: 'INVALID_STATUS',
          details: `Status must be one of: ${validStatuses.join(', ')}`,
        },
      });
      return;
    }

    // Get current ticket status for logging
    const { data: oldTicket } = await supabaseAdmin
      .from('support_tickets')
      .select('status')
      .eq('id', ticketId)
      .single();

    // Update ticket status
    const updateData: any = { status };

    // Set resolved_at if status is resolved
    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { data: ticket, error } = await supabaseAdmin
      .from('support_tickets')
      .update(updateData)
      .eq('id', ticketId)
      .select()
      .single();

    if (error) {
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to update ticket status',
          code: 'STATUS_UPDATE_ERROR',
          details: error.message,
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        ticket,
        old_status: oldTicket?.status,
        new_status: status,
      },
    });
  })
);

/**
 * POST /api/superadmin/tickets/:id/reply - Reply to ticket as admin
 * Body: { message: string, attachments?: FileAttachment[] }
 */
router.post(
  '/tickets/:id/reply',
  autoLogSuperAdminAction('reply_ticket', 'ticket'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const ticketId = req.params.id;
    const { message, attachments } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Message is required',
          code: 'INVALID_MESSAGE',
        },
      });
      return;
    }

    // Create admin message
    const { data: newMessage, error } = await supabaseAdmin
      .from('support_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: req.user!.id,
        sender_type: 'admin',
        message: message.trim(),
        attachments: attachments || [],
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to send message',
          code: 'MESSAGE_SEND_ERROR',
          details: error.message,
        },
      });
      return;
    }

    // Update ticket status to in_progress if still open
    await supabaseAdmin
      .from('support_tickets')
      .update({ status: 'in_progress' })
      .eq('id', ticketId)
      .eq('status', 'open');

    res.json({
      success: true,
      data: {
        message: newMessage,
        ticket_id: ticketId,
      },
    });
  })
);

/**
 * POST /api/superadmin/tickets/:id/internal-notes - Add internal note
 * Body: { note: string }
 */
router.post(
  '/tickets/:id/internal-notes',
  autoLogSuperAdminAction('add_internal_note', 'ticket'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const ticketId = req.params.id;
    const { note } = req.body;

    if (!note || typeof note !== 'string' || note.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Note is required',
          code: 'INVALID_NOTE',
        },
      });
      return;
    }

    // Create internal note
    const { data: internalNote, error } = await supabaseAdmin
      .from('support_internal_notes')
      .insert({
        ticket_id: ticketId,
        author_id: req.user!.id,
        note: note.trim(),
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to create internal note',
          code: 'INTERNAL_NOTE_CREATE_ERROR',
          details: error.message,
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        note: internalNote,
        ticket_id: ticketId,
      },
    });
  })
);

/**
 * POST /api/superadmin/tickets/:id/claude-context - Generate Claude Code Context
 * Returns markdown formatted context for Claude Code CLI
 */
router.post(
  '/tickets/:id/claude-context',
  autoLogSuperAdminAction('generate_claude_context', 'ticket'),
  asyncHandler(async (_req, res) => {
    const ticketId = _req.params.id;

    // Fetch ticket
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Ticket not found',
          code: 'TICKET_NOT_FOUND',
        },
      });
      return;
    }

    // Fetch user info
    const { data: user } = await supabaseAdmin
      .from('auth.users')
      .select('id, email, created_at')
      .eq('id', (ticket as any).user_id)
      .single();

    // Fetch messages
    const { data: messages } = await supabaseAdmin
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    // Fetch internal notes with author
    const { data: internalNotes } = await supabaseAdmin
      .from('support_internal_notes')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    // Fetch author emails for internal notes
    const authorEmails: Record<string, string> = {};
    if (internalNotes && internalNotes.length > 0) {
      const authorIds = [...new Set(internalNotes.map((n: any) => n.author_id))];
      const { data: authors } = await supabaseAdmin
        .from('auth.users')
        .select('id, email')
        .in('id', authorIds);

      authors?.forEach((a: any) => {
        authorEmails[a.id] = a.email;
      });
    }

    // Fetch recent error logs for this user (last 2 hours)
    const twoHoursAgo = new Date(new Date((ticket as any).created_at).getTime() - 2 * 60 * 60 * 1000);
    const { data: errorLogs } = await supabaseAdmin
      .from('system_logs')
      .select('*')
      .eq('user_id', (ticket as any).user_id)
      .in('level', ['error', 'warn'])
      .gte('timestamp', twoHoursAgo.toISOString())
      .order('timestamp', { ascending: false })
      .limit(10);

    // Build markdown context
    const ticketNumber = `TK-${(ticket as any).id.substring(0, 6).toUpperCase()}`;
    const userEmail = user?.email || 'Unknown';
    const createdAt = new Date((ticket as any).created_at).toISOString();

    let markdown = `# Bug Report - Ticket ${ticketNumber}\n\n`;
    markdown += `**User**: ${userEmail}\n`;
    markdown += `**Category**: ${(ticket as any).category} | **Priority**: ${(ticket as any).priority} | **Status**: ${(ticket as any).status}\n`;
    markdown += `**Created**: ${createdAt}\n\n`;

    markdown += `## Description\n${(ticket as any).description}\n\n`;

    if ((ticket as any).screenshot_url) {
      markdown += `## Screenshot\n${(ticket as any).screenshot_url}\n\n`;
    }

    if (errorLogs && errorLogs.length > 0) {
      markdown += `## Relevant logs (last 2h, level: error|warn)\n`;
      errorLogs.forEach((log: any) => {
        markdown += `[${log.timestamp}] [${log.source}] ${log.level.toUpperCase()}: ${log.message}\n`;
      });
      markdown += `\n`;
    }

    if (messages && messages.length > 0) {
      markdown += `## Conversation\n`;
      messages.forEach((msg: any) => {
        const time = new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const sender = msg.sender_type === 'user' ? 'user' : 'admin';
        markdown += `[${sender} ${time}] ${msg.message}\n`;
      });
      markdown += `\n`;
    }

    if (internalNotes && internalNotes.length > 0) {
      markdown += `## Internal notes\n`;
      internalNotes.forEach((note: any) => {
        const time = new Date(note.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const author = authorEmails[note.author_id] || 'Unknown';
        markdown += `[${author} ${time}] ${note.note}\n`;
      });
      markdown += `\n`;
    }

    markdown += `---\n`;
    markdown += `Generated by Hive OS Backoffice on ${new Date().toISOString()}\n`;

    res.json({
      success: true,
      data: {
        markdown,
        ticket_id: ticketId,
        ticket_number: ticketNumber,
      },
    });
  })
);

// ─────────────────────────────────────────────────────────────────
// User Management
// ─────────────────────────────────────────────────────────────────

/**
 * GET /api/super-admin/users - List all users
 * Query params:
 *   - search: search by email
 *   - limit: max results (default 50)
 *   - offset: pagination offset
 */
router.get(
  '/users',
  autoLogSuperAdminAction('list_users', 'user'),
  asyncHandler(async (req, res) => {
    const search = req.query.search as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    // Use Supabase Auth Admin API to list users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
      page: Math.floor(offset / limit) + 1,
      perPage: limit,
    });

    if (authError) {
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch users',
          code: 'USERS_FETCH_ERROR',
          details: authError.message,
        },
      });
      return;
    }

    // Get user roles
    const userIds = authData.users.map((u) => u.id);
    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, role')
      .in('user_id', userIds);

    const rolesMap = new Map(roles?.map((r: any) => [r.user_id, r.role]) || []);

    const users = authData.users.map((u: any) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      role: rolesMap.get(u.id) || 'user',
    }));

    // Filter by search if provided
    const filteredUsers = search
      ? users.filter((u: any) => u.email.toLowerCase().includes(search.toLowerCase()))
      : users;

    const count = filteredUsers.length;

    res.json({
      success: true,
      data: filteredUsers,
      pagination: {
        total: count,
        limit,
        offset,
      },
    });
  })
);

/**
 * PATCH /api/superadmin/users/:id/role - Update user role
 */
router.patch(
  '/users/:id/role',
  autoLogSuperAdminAction('update_user_role', 'user'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    if (!['user', 'admin', 'super_admin'].includes(role)) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid role',
          code: 'INVALID_ROLE',
        },
      });
      return;
    }

    // Update user role
    const { data: updatedRole, error } = await supabaseAdmin
      .from('user_roles')
      .upsert({ user_id: id, role })
      .select()
      .single();

    if (error) {
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to update role',
          code: 'ROLE_UPDATE_ERROR',
          details: error.message,
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user_id: id,
        role: updatedRole?.role || role,
        updated_at: new Date().toISOString(),
      },
    });
  })
);

/**
 * GET /api/super-admin/users/:id - View user details
 * Includes user role, projects, and recent activity
 */
router.get(
  '/users/:id',
  autoLogSuperAdminAction('view_user', 'user'),
  asyncHandler(async (req, res) => {
    const userId = req.params.id;

    // Fetch user details via Auth Admin API (cannot query auth.users directly)
    const { data: authUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (userError || !authUser.user) {
      res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND',
        },
      });
      return;
    }

    const user = {
      id: authUser.user.id,
      email: authUser.user.email,
      created_at: authUser.user.created_at,
      last_sign_in_at: authUser.user.last_sign_in_at,
    };

    // Fetch user role
    const { data: userRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    // Fetch user projects
    const { data: projects } = await supabaseAdmin
      .from('projects')
      .select('id, name, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Fetch support tickets
    const { data: tickets } = await supabaseAdmin
      .from('support_tickets')
      .select('id, subject, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    res.json({
      success: true,
      data: {
        user: {
          ...user,
          role: userRole?.role || 'user',
        },
        projects: projects || [],
        tickets: tickets || [],
      },
    });
  })
);

/**
 * PATCH /api/superadmin/users/:id/role - Update user role
 * Body: { role: 'user' | 'admin' | 'super_admin' }
 * Warning: Cannot downgrade super_admin to prevent lock-out
 */
router.patch(
  '/users/:id/role',
  autoLogSuperAdminAction('update_user_role', 'user'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.params.id;
    const { role } = req.body;

    // Validate role
    const validRoles = ['user', 'admin', 'super_admin'];
    if (!role || !validRoles.includes(role)) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid role',
          code: 'INVALID_ROLE',
          details: `Role must be one of: ${validRoles.join(', ')}`,
        },
      });
      return;
    }

    // Check current role
    const { data: currentRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    // Prevent downgrading super_admin to avoid lock-out
    if (currentRole?.role === 'super_admin' && role !== 'super_admin') {
      res.status(403).json({
        success: false,
        error: {
          message: 'Cannot downgrade super_admin role',
          code: 'SUPER_ADMIN_DOWNGRADE_FORBIDDEN',
          details: 'For security reasons, super_admin role cannot be downgraded via API',
        },
      });
      return;
    }

    // Update role
    const { data: updatedRole, error } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: userId,
        role,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to update user role',
          code: 'ROLE_UPDATE_ERROR',
          details: error.message,
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user_id: userId,
        old_role: currentRole?.role || 'user',
        new_role: role,
        updated_role: updatedRole,
      },
    });
  })
);

// ─────────────────────────────────────────────────────────────────
// Audit Trail & System Logs
// ─────────────────────────────────────────────────────────────────

/**
 * GET /api/super-admin/logs/audit - View super admin audit trail
 * Query params:
 *   - action: filter by action type
 *   - admin_id: filter by specific admin
 *   - resource_type: filter by resource type
 *   - resource_id: filter by specific resource
 *   - limit: max results (default 100)
 *   - offset: pagination offset
 */
router.get(
  '/logs/audit',
  autoLogSuperAdminAction('view_audit_logs', 'logs'),
  asyncHandler(async (req, res) => {
    const action = req.query.action as string | undefined;
    const adminId = req.query.admin_id as string | undefined;
    const resourceType = req.query.resource_type as string | undefined;
    const resourceId = req.query.resource_id as string | undefined;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    let query = supabaseAdmin
      .from('super_admin_access_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (action) {
      query = query.eq('action', action);
    }
    if (adminId) {
      query = query.eq('super_admin_id', adminId);
    }
    if (resourceType) {
      query = query.eq('resource_type', resourceType);
    }
    if (resourceId) {
      query = query.eq('resource_id', resourceId);
    }

    const { data: logs, error, count } = await query;

    if (error) {
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch audit logs',
          code: 'AUDIT_LOGS_FETCH_ERROR',
          details: error.message,
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        logs: logs || [],
        pagination: {
          limit,
          offset,
          total: count || 0,
        },
      },
    });
  })
);

/**
 * GET /api/super-admin/logs/system - View system logs
 * Query params:
 *   - level: filter by log level (info, warn, error)
 *   - source: filter by source
 *   - limit: max results (default 100)
 */
router.get(
  '/logs/system',
  autoLogSuperAdminAction('view_system_logs', 'logs'),
  asyncHandler(async (req, res) => {
    const level = req.query.level as string | undefined;
    const source = req.query.source as string | undefined;
    const limit = parseInt(req.query.limit as string) || 100;

    // Call get_recent_logs() RPC function (from admin monitoring dashboard)
    const { data, error } = await supabaseAdmin.rpc('get_recent_logs', {
      p_limit: limit,
      p_level: level || null,
      p_source: source || null,
      p_agent_id: null,
    });

    if (error) {
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch system logs',
          code: 'SYSTEM_LOGS_FETCH_ERROR',
          details: error.message,
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        logs: data || [],
      },
    });
  })
);

// ─────────────────────────────────────────────────────────────────
// Global Metrics
// ─────────────────────────────────────────────────────────────────

/**
 * GET /api/superadmin/metrics/global - Global business metrics
 * Returns: MRR, active users, CSAT, ticket volume trends
 */
router.get(
  '/metrics/global',
  autoLogSuperAdminAction('view_global_metrics', 'metrics'),
  asyncHandler(async (_req, res) => {
    // Total users (via Auth Admin API)
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    const totalUsers = authUsers?.users.length || 0;

    // Users by role
    const { data: userRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role');

    const usersByRole: Record<string, number> = { user: 0, admin: 0, super_admin: 0 };
    userRoles?.forEach((r: any) => {
      usersByRole[r.role] = (usersByRole[r.role] || 0) + 1;
    });

    // Total tickets
    const { count: totalTickets } = await supabaseAdmin
      .from('support_tickets')
      .select('*', { count: 'exact', head: true });

    // Tickets by status
    const { data: ticketStatuses } = await supabaseAdmin
      .from('support_tickets')
      .select('status');

    const ticketsByStatus: Record<string, number> = {};
    ticketStatuses?.forEach((t: any) => {
      ticketsByStatus[t.status] = (ticketsByStatus[t.status] || 0) + 1;
    });

    // Tickets by priority
    const { data: ticketPriorities } = await supabaseAdmin
      .from('support_tickets')
      .select('priority');

    const ticketsByPriority: Record<string, number> = {};
    ticketPriorities?.forEach((t: any) => {
      ticketsByPriority[t.priority] = (ticketsByPriority[t.priority] || 0) + 1;
    });

    // Active users today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data: activeToday } = await supabaseAdmin.auth.admin.listUsers();
    const activeUsersToday = activeToday?.users.filter(u => {
      if (!u.last_sign_in_at) return false;
      return new Date(u.last_sign_in_at) >= todayStart;
    }).length || 0;

    // Average response time (calculate from tickets with first_response_at)
    const { data: ticketsWithResponse } = await supabaseAdmin
      .from('support_tickets')
      .select('created_at, first_response_at')
      .not('first_response_at', 'is', null);

    let avgResponseTimeHours = 0;
    if (ticketsWithResponse && ticketsWithResponse.length > 0) {
      const totalResponseTime = ticketsWithResponse.reduce((sum, ticket: any) => {
        const created = new Date(ticket.created_at).getTime();
        const responded = new Date(ticket.first_response_at).getTime();
        return sum + (responded - created);
      }, 0);
      avgResponseTimeHours = totalResponseTime / ticketsWithResponse.length / (1000 * 60 * 60);
    }

    res.json({
      success: true,
      data: {
        total_users: totalUsers,
        total_tickets: totalTickets || 0,
        active_users_today: activeUsersToday,
        avg_response_time_hours: avgResponseTimeHours,
        users_by_role: usersByRole,
        tickets_by_status: ticketsByStatus,
        tickets_by_priority: ticketsByPriority,
      },
    });
  })
);

export default router;
