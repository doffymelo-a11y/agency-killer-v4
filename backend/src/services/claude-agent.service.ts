import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from './supabase.service.js';
import { logger } from '../lib/logger.js';

const execAsync = promisify(exec);

interface AgentConfig {
  ticketId: string;
  adminUserId: string;
  repoPath: string; // e.g., /Users/.../Agency-Killer-V4/cockpit
}

interface AgentResult {
  sessionId: string;
  status: 'completed' | 'failed';
  prUrl?: string;
  prNumber?: number;
  errorMessage?: string;
  filesChanged: string[];
  testsPassed: boolean;
  testOutput: string;
  report?: AgentReport;
}

interface AgentReport {
  status: 'fixed' | 'needs-human' | 'cannot-reproduce';
  root_cause: string;
  fix_summary: string;
  files_changed: string[];
  tests_run: string[];
  tests_status: 'pass' | 'fail' | 'no-tests-exist';
  risk: 'low' | 'medium' | 'high';
  risk_reasoning: string;
  follow_up_recommended: string | null;
  cost_usd?: number;
  duration_seconds?: number;
}

export class ClaudeAgentService {
  private readonly AGENT_TIMEOUT_MS = 600000; // 10 minutes
  private readonly MAX_COST_USD = 5.0; // Cost cap

  /**
   * Main entry point: Fix a ticket using Claude Agent SDK
   */
  async fixTicket(config: AgentConfig): Promise<AgentResult> {
    const { ticketId, adminUserId, repoPath } = config;

    logger.log(`[Claude Agent] Starting fix for ticket ${ticketId}`);

    // 1. Get ticket details
    const ticket = await this.getTicketDetails(ticketId);
    if (!ticket) throw new Error('Ticket not found');
    if (ticket.category !== 'bug') {
      throw new Error('Only bug tickets can be auto-fixed');
    }

    // 2. Create agent session in DB
    const sessionId = await this.createAgentSession(ticketId, adminUserId);

    // 3. Setup git worktree
    const branchName = `auto-fix/ticket-${ticketId.slice(0, 8)}`;
    const worktreePath = await this.createWorktree(repoPath, branchName);

    await this.updateSession(sessionId, {
      worktree_path: worktreePath,
      branch_name: branchName,
      status: 'running'
    });

    try {
      // 4. Build system prompt + user message
      const systemPrompt = this.buildSystemPrompt(ticket);
      const userMessage = await this.buildUserMessage(ticket);

      await this.updateSession(sessionId, {
        system_prompt: systemPrompt,
        user_message: userMessage
      });

      // 5. Run Claude Agent SDK (or fallback)
      const agentOutput = await this.runAgent(worktreePath, systemPrompt, userMessage, sessionId);

      // 6. Parse agent report
      const report = this.parseFinalReport(agentOutput);

      // If agent says "needs-human", don't create PR
      if (report.status === 'needs-human') {
        await this.updateSession(sessionId, {
          status: 'failed',
          completed_at: new Date().toISOString(),
          agent_output: agentOutput,
          error_message: `Agent flagged as needs-human: ${report.root_cause}`
        });

        await this.cleanupWorktree(worktreePath);

        return {
          sessionId,
          status: 'failed',
          errorMessage: `Agent flagged as needs-human: ${report.root_cause}`,
          filesChanged: report.files_changed || [],
          testsPassed: false,
          testOutput: report.tests_status,
          report
        };
      }

      // 7. Run tests
      const testResult = await this.runTests(worktreePath);

      // 8. Commit + Push
      await this.commitAndPush(worktreePath, branchName, ticket, report);

      // 9. Create GitHub PR
      const prResult = await this.createPullRequest(branchName, ticket, report, sessionId, worktreePath);

      // 10. Update session as completed
      const filesChanged = await this.getChangedFiles(worktreePath);

      await this.updateSession(sessionId, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        agent_output: agentOutput,
        files_changed: filesChanged,
        tests_passed: testResult.passed,
        test_output: testResult.output,
        pr_number: prResult.number,
        pr_url: prResult.url,
        pr_branch: branchName
      });

      logger.log(`[Claude Agent] ✓ Fix completed: ${prResult.url}`);

      return {
        sessionId,
        status: 'completed',
        prUrl: prResult.url,
        prNumber: prResult.number,
        filesChanged,
        testsPassed: testResult.passed,
        testOutput: testResult.output,
        report
      };

    } catch (error: any) {
      console.error(`[Claude Agent] ✗ Fix failed:`, error);

      await this.updateSession(sessionId, {
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error.message
      });

      // Cleanup worktree
      await this.cleanupWorktree(worktreePath);

      return {
        sessionId,
        status: 'failed',
        errorMessage: error.message,
        filesChanged: [],
        testsPassed: false,
        testOutput: ''
      };
    }
  }

  /**
   * Get ticket details from Supabase
   */
  private async getTicketDetails(ticketId: string) {
    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create agent session record using RPC function (bypasses PostgREST cache)
   */
  private async createAgentSession(ticketId: string, adminUserId: string): Promise<string> {
    logger.log(`[Agent Session] Creating session for ticket ${ticketId}`);

    const { data, error } = await supabaseAdmin.rpc('create_agent_session', {
      p_ticket_id: ticketId,
      p_started_by: adminUserId,
      p_worktree_path: '',
      p_branch_name: ''
    });

    if (error) {
      console.error('[Agent Session] Error creating session:', error);
      throw error;
    }

    logger.log(`[Agent Session] ✓ Session created: ${data}`);
    return data;
  }

  /**
   * Update agent session using RPC function (bypasses PostgREST cache)
   */
  private async updateSession(sessionId: string, updates: any) {
    logger.log(`[Agent Session] Updating ${sessionId}:`, Object.keys(updates).join(', '));

    // Map updates object to RPC function parameters
    const params: any = {
      p_session_id: sessionId,
      p_status: updates.status || null,
      p_worktree_path: updates.worktree_path || null,
      p_branch_name: updates.branch_name || null,
      p_system_prompt: updates.system_prompt || null,
      p_user_message: updates.user_message || null,
      p_agent_output: updates.agent_output || null,
      p_error_message: updates.error_message || null,
      p_pr_number: updates.pr_number || null,
      p_pr_url: updates.pr_url || null,
      p_pr_branch: updates.pr_branch || null,
      p_completed_at: updates.completed_at || null,
      p_duration_seconds: updates.duration_seconds || null,
      p_tokens_used: updates.tokens_used || null,
      p_cost_usd: updates.cost_usd || null,
      p_files_changed: updates.files_changed || null,
      p_tests_passed: updates.tests_passed || null,
      p_test_output: updates.test_output || null
    };

    const { error } = await supabaseAdmin.rpc('update_agent_session', params);

    if (error) {
      console.error('[Agent Session] Error updating session:', error);
      throw error;
    }

    logger.log(`[Agent Session] ✓ Session updated`);
  }

  /**
   * Create git worktree for isolated work
   */
  private async createWorktree(repoPath: string, branchName: string): Promise<string> {
    const worktreePath = path.join('/tmp', `hive-agent-${Date.now()}`);

    logger.log(`[Git] Creating worktree at ${worktreePath}`);

    // Create worktree from main branch
    await execAsync(`git -C ${repoPath} worktree add ${worktreePath} -b ${branchName}`, {
      timeout: 30000
    });

    logger.log(`[Git] ✓ Worktree created: ${worktreePath}`);

    return worktreePath;
  }

  /**
   * Build system prompt (EXACT spec from user)
   */
  private buildSystemPrompt(_ticket: any): string {
    return `You are Hive Doctor, an autonomous senior full-stack engineer agent
embedded in the Hive OS V5 codebase. Your sole purpose is to diagnose
and fix bugs reported by users through support tickets, then prepare a
clean pull request for human review.

# YOUR ENVIRONMENT
You operate inside an isolated git worktree at the path provided in your
working directory. You are on a fresh branch named \`auto-fix/ticket-<ID>\`
forked from \`main\`. You CANNOT push, merge, or affect production. A human
will review and merge your PR.

# THE CODEBASE
Hive OS V5 is a marketing automation SaaS with 4 specialized AI agents
(Luna, Sora, Marcus, Milo). Architecture:
- /cockpit/        → React 19 + Vite frontend (port 5173, end-user app)
- /backoffice/     → React 19 + Vite frontend (port 5174, super-admin app)
- /backend/        → Express + TypeScript API (port 3457)
- /mcp-bridge/     → Express gateway to MCP servers (port 3456)
- /mcp-servers/    → 14 specialized TypeScript MCP servers
- /supabase/migrations/ → SQL migrations (numbered)
- /shared/        → Shared types and schemas

Auth: Supabase Auth (JWT). DB: Supabase Postgres with RLS policies.
LLM provider: Anthropic Claude (orchestrator + agents).

# YOUR WORKFLOW (mandatory order)

## Step 1 — INVESTIGATE (do not skip)
- Read the ticket context (description, logs, suspect files, user actions)
- Use Glob + Grep to find ALL relevant code paths, not just the first one
- Read the actual files end-to-end before proposing a fix
- Check git log for recent commits that may have introduced the bug
- Look at related tests if they exist

## Step 2 — DIAGNOSE
Identify the ROOT CAUSE, not the symptom. State it explicitly in your
internal reasoning. If you can't reach high confidence on root cause,
STOP and output a "needs-human" report (see Step 7) — do not guess-fix.

## Step 3 — PLAN
Define the minimal change set. Prefer:
- Smallest diff that fixes root cause (not refactor sprees)
- Edits over rewrites
- Reusing existing utilities/patterns over creating new ones
- Backward-compatible changes (no breaking API contracts)

## Step 4 — IMPLEMENT

You have an edit_file tool that works like find-and-replace.

To fix a bug in a file:
1. Use read_file to see the current content
2. Identify the EXACT string to replace (including indentation/whitespace)
3. Call edit_file with:
   - path: file path
   - old_string: exact string to find (must match character-for-character)
   - new_string: replacement string

Example - Fix typo "Créerrr" to "Créer":
Step 1: read_file({ path: "cockpit/src/views/SupportView.tsx" })
Response: You see line 641 contains: {uploading ? 'Upload en cours...' : creating ? 'Création...' : 'Créerrr le ticket'}

Step 2: edit_file({
  path: "cockpit/src/views/SupportView.tsx",
  old_string: "{uploading ? 'Upload en cours...' : creating ? 'Création...' : 'Créerrr le ticket'}",
  new_string: "{uploading ? 'Upload en cours...' : creating ? 'Création...' : 'Créer le ticket'}"
})
Result: File edited successfully

CRITICAL RULES:
- old_string must match EXACTLY (whitespace, indentation, everything)
- Include enough context to make old_string unique in the file
- If unsure, read the file first to see exact formatting
- Match existing code style exactly
- Never add console.log unless the bug requires it
- Never touch unrelated files

## Step 5 — VERIFY
Mandatory checks before commit (use Bash):
- \`npx tsc --noEmit\` in any TypeScript package you modified → must pass
- \`npm test\` in the modified package → must pass (if tests exist)
- \`npm run lint\` → must pass (if configured)
- If any check fails, FIX the failure before commit. Do not commit broken code.

## Step 6 — OUTPUT FINAL REPORT (CRITICAL - DO NOT SKIP)

IMPORTANT: DO NOT run git add, git commit, or git push. The system will automatically:
1. Add all changed files to staging
2. Create a commit with a proper message
3. Push to the remote branch
4. Create a GitHub Pull Request

Your job is to FIX the code, VERIFY it works, then output the JSON report below.

Always end with a fenced JSON block (and ONLY one) with this exact shape:

\`\`\`json
{
  "status": "fixed" | "needs-human" | "cannot-reproduce",
  "root_cause": "1-2 sentences in plain English",
  "fix_summary": "1-2 sentences on what you changed",
  "files_changed": ["path/to/file1.ts", "path/to/file2.tsx"],
  "tests_run": ["tsc", "npm test", "lint"],
  "tests_status": "pass" | "fail" | "no-tests-exist",
  "risk": "low" | "medium" | "high",
  "risk_reasoning": "1 sentence on what could go wrong post-merge",
  "follow_up_recommended": "optional 1 sentence or null"
}
\`\`\`

This JSON will be parsed by the backend and shown to the founder on
Telegram. Be CONCISE — the founder reads this on a phone screen.

# HARD RULES (violation = abort)

NEVER:
- Run git add, git commit, or git push (the system handles this automatically)
- Force-push, amend commits, or rewrite history
- Delete files unless that IS the fix and you justified it explicitly
- Modify .env files, secrets, or credentials
- Modify CI/CD configs (.github/workflows/*) unless ticket explicitly asks
- Modify production database migrations that have already been applied
  (only ADD new migration files numbered after the latest)
- Make changes outside the worktree (no /tmp writes, no /etc, no $HOME)
- Install new dependencies unless absolutely required (justify in JSON if so)
- Refactor or "clean up" code unrelated to the bug
- Disable tests, eslint rules, or type checks to make them pass
- Use any to silence TypeScript errors — fix the actual type

ALWAYS:
- Stay scoped to the bug. If you spot another bug, mention it in
  follow_up_recommended, do NOT fix it
- Ask yourself "is this the smallest possible fix?" before each Edit
- Prefer reading 5 extra files vs. guessing
- Treat existing code as correct unless you have proof otherwise

# COMMUNICATION STYLE
- Internal reasoning: dense, no fluff, no preamble
- The final JSON is the ONLY thing the founder reads — make it count
- No emojis in commit messages or JSON
- No "I think" / "maybe" / hedging — be definitive or output needs-human

# WHEN TO GIVE UP (output needs-human)

Output status: "needs-human" and stop if:
- Root cause is genuinely unclear after thorough investigation
- The fix requires changes to >5 files or >200 lines
- The fix requires touching authentication, billing, or payment code
- The fix requires modifying database schema in a non-additive way
- Tests are missing for critical paths and you can't reasonably add them
- You've made >3 attempts at the fix and tests still fail
- The ticket describes a feature request, not a bug

In all "needs-human" cases, your JSON should still include root_cause
analysis and a recommended approach for the human to take.

# YOU ARE TRUSTED, BUT VERIFIED
The human founder will review your PR before merge. Be the kind of agent
they trust enough to merge with a 30-second skim. Quality > speed.
Correctness > coverage. Restraint > creativity.

Begin when you receive the ticket context.`;
  }

  /**
   * Build user message (EXACT spec from user)
   */
  private async buildUserMessage(ticket: any): Promise<string> {
    // Get user details
    const { data: user } = await supabaseAdmin
      .from('auth.users')
      .select('email, created_at, raw_user_meta_data')
      .eq('id', ticket.user_id)
      .single();

    // Get messages history
    const { data: messages } = await supabaseAdmin
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: true });

    // Get internal notes (if table exists)
    let internalNotes: any[] = [];
    try {
      const { data } = await supabaseAdmin
        .from('support_internal_notes')
        .select('*')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true });
      internalNotes = data || [];
    } catch (error) {
      logger.log('[Agent] Internal notes table not found, skipping');
    }

    // Get recent system logs (mock for now - implement when logging exists)
    const systemLogs = '(No system logs available)';

    // Get AI triage data (from ticket columns)
    const aiTriageHints = {
      likely_files: ticket.ai_suggested_files || [],
      similar_tickets: ticket.similar_tickets || [],
      suggested_category: ticket.ai_suggested_category
    };

    // Get recent commits
    const repoPath = process.env.CLAUDE_AGENT_REPO_PATH || '/Users/azzedinezazai/Documents/Agency-Killer-V4/cockpit';
    let gitLog = '(Git log unavailable)';
    try {
      const { stdout } = await execAsync('git log -5 --oneline', { cwd: repoPath });
      gitLog = stdout.trim();
    } catch (error) {
      logger.log('[Agent] Could not fetch git log');
    }

    return `# Ticket to resolve

**ID:** ${ticket.id}
**Created:** ${ticket.created_at}
**Category:** ${ticket.category}
**Priority:** ${ticket.priority}
**Reporter:** ${user?.email || 'Unknown'} (signed up ${user?.created_at?.slice(0, 10) || 'N/A'})

## User description
${ticket.description}

${ticket.subject ? `**Subject:** ${ticket.subject}\n` : ''}

## User's last actions
- Page URL when bug occurred: ${ticket.page_url || 'Not provided'}
- Browser: ${ticket.user_agent || 'Not provided'}
- Screenshot: ${ticket.screenshot_url || 'None'}

## Conversation history
${messages && messages.length > 0
  ? messages.map((m: any) => `[${m.sender_type}] ${m.message}`).join('\n')
  : '(No messages yet)'}

## Internal notes from founder
${internalNotes && internalNotes.length > 0
  ? internalNotes.map((n: any) => `- ${n.note}`).join('\n')
  : '(No internal notes)'}

## System logs (last 2h before ticket, level=error|warn, scoped to this user)
${systemLogs}

## AI triage hints
- Likely affected files: ${aiTriageHints.likely_files.join(', ') || 'None suggested'}
- Similar resolved tickets: ${aiTriageHints.similar_tickets.length > 0 ? aiTriageHints.similar_tickets.join(', ') : 'None found'}
- Suggested category: ${aiTriageHints.suggested_category || 'None'}

## Recent commits on main (HEAD~5)
${gitLog}

---

## Your task
Investigate, diagnose, fix, verify, commit. End with the JSON report.
You are on branch auto-fix/ticket-${ticket.id.slice(0, 8)}. Work autonomously.`;
  }

  /**
   * Run Claude Agent SDK (with fallback to Claude API direct)
   */
  private async runAgent(worktreePath: string, systemPrompt: string, userMessage: string, _sessionId: string): Promise<string> {
    logger.log(`[Agent] Running Claude Agent SDK (or fallback) in ${worktreePath}`);

    // Try to import SDK, fallback to direct API if not available
    try {
      // @ts-expect-error - SDK may not be installed yet, fallback to direct API
      const { query } = await import('@anthropic-ai/claude-agent-sdk');
      logger.log(`[Agent] Using official Claude Agent SDK`);

      const result = query({
        prompt: userMessage,
        options: {
          cwd: worktreePath,
          systemPrompt: systemPrompt,
          model: 'claude-opus-4-5',

          permissionMode: 'acceptEdits' as any,

          allowedTools: [
            'Read', 'Edit', 'Write', 'Glob', 'Grep',
            'Bash(npm test:*)', 'Bash(npm run test:*)', 'Bash(npm run lint:*)',
            'Bash(npm run typecheck:*)', 'Bash(npx tsc:*)', 'Bash(npx vitest:*)',
            'Bash(npx jest:*)', 'Bash(git status:*)', 'Bash(git diff:*)',
            'Bash(git log:*)', 'Bash(git add:*)', 'Bash(git commit:*)',
            'Bash(git branch:*)', 'Bash(node:*)', 'Bash(ls:*)',
            'Bash(cat:*)', 'Bash(pwd:*)',
          ],

          disallowedTools: [
            'Bash(rm:*)', 'Bash(sudo:*)', 'Bash(curl:*)', 'Bash(wget:*)',
            'Bash(git add:*)', 'Bash(git commit:*)', 'Bash(git push:*)',
            'Bash(git reset --hard:*)', 'Bash(git checkout main:*)',
            'Bash(git rebase:*)', 'Bash(npm install:*)', 'Bash(npm uninstall:*)',
            'Bash(yarn:*)', 'Bash(pnpm:*)', 'WebFetch', 'WebSearch', 'NotebookEdit',
          ],

          allowedAgents: ['Explore'],

          maxTurns: 40,
          timeoutMs: this.AGENT_TIMEOUT_MS,

          onCostUpdate: (cost: any) => {
            if (cost.totalCostUsd > this.MAX_COST_USD) {
              throw new Error(`Cost cap exceeded ($${this.MAX_COST_USD})`);
            }
          },

          includePartialMessages: false,
        },
      });

      let finalText = '';
      for await (const message of result) {
        if (message.type === 'assistant') {
          finalText = message.text;
        }
      }

      logger.log(`[Agent] ✓ SDK completed`);
      return finalText;

    } catch (error: any) {
      console.warn(`[Agent] SDK not available, using fallback:`, error.message);
      return await this.runAgentFallback(worktreePath, systemPrompt, userMessage);
    }
  }

  /**
   * Fallback: Run agent using Claude API directly with tool use
   */
  private async runAgentFallback(worktreePath: string, systemPrompt: string, userMessage: string): Promise<string> {
    logger.log(`[Agent] Running fallback via Claude API direct`);

    const anthropic = new Anthropic({
      apiKey: process.env.HIVE_DOCTOR_ANTHROPIC_KEY || process.env.ANTHROPIC_API_KEY
    });

    // Define tools
    const tools = [
      {
        name: 'read_file',
        description: 'Read a file from the codebase',
        input_schema: {
          type: 'object' as const,
          properties: {
            path: { type: 'string', description: 'Relative path to file from worktree root' }
          },
          required: ['path']
        }
      },
      {
        name: 'edit_file',
        description: 'Edit a file by replacing a specific string with a new string. Use this to fix bugs by changing specific lines.',
        input_schema: {
          type: 'object' as const,
          properties: {
            path: { type: 'string', description: 'Relative path to file' },
            old_string: { type: 'string', description: 'Exact string to find and replace (must match exactly including whitespace)' },
            new_string: { type: 'string', description: 'New string to replace with' }
          },
          required: ['path', 'old_string', 'new_string']
        }
      },
      {
        name: 'bash',
        description: 'Run a bash command (limited to whitelisted commands)',
        input_schema: {
          type: 'object' as const,
          properties: {
            command: { type: 'string', description: 'Command to run' }
          },
          required: ['command']
        }
      }
    ];

    let messages: Anthropic.MessageParam[] = [{ role: 'user', content: userMessage }];

    // Agentic loop (max 40 turns)
    for (let turn = 0; turn < 40; turn++) {
      const response = await anthropic.messages.create({
        model: 'claude-opus-4-5-20251101',
        max_tokens: 8000,
        system: systemPrompt,
        messages,
        tools
      });

      // Check stop reason
      if (response.stop_reason === 'end_turn') {
        // Agent finished
        const textContent = response.content.find((block): block is Anthropic.TextBlock => block.type === 'text');
        return textContent?.text || JSON.stringify(response.content);
      }

      // Execute tool calls
      const toolResults: Anthropic.MessageParam[] = [];

      for (const block of response.content) {
        if (block.type === 'tool_use') {
          // Log EXACTLY what Claude API returns
          logger.log(`[Agent] Tool use block from Claude API:`, {
            name: block.name,
            id: block.id,
            input: block.input,
            inputKeys: Object.keys(block.input || {}),
            inputJSON: JSON.stringify(block.input, null, 2)
          });

          const result = await this.executeToolFallback(worktreePath, block.name, block.input);

          toolResults.push({
            role: 'user',
            content: [{
              type: 'tool_result',
              tool_use_id: block.id,
              content: result
            }]
          });
        }
      }

      // Add assistant message + tool results to conversation
      messages.push({
        role: 'assistant',
        content: response.content
      });
      messages.push(...toolResults);
    }

    throw new Error('Agent exceeded max turns (40)');
  }

  /**
   * Execute tool for fallback mode
   */
  private async executeToolFallback(worktreePath: string, toolName: string, input: any): Promise<string> {
    logger.log(`[Tool] Executing ${toolName}`, input);

    switch (toolName) {
      case 'read_file':
        try {
          const content = await fs.readFile(path.join(worktreePath, input.path), 'utf-8');
          return content;
        } catch (error: any) {
          return `Error reading file: ${error.message}`;
        }

      case 'edit_file':
        try {
          logger.log(`[Tool] edit_file input:`, {
            path: input.path,
            hasOldString: !!input.old_string,
            hasNewString: !!input.new_string,
            oldLength: input.old_string?.length,
            newLength: input.new_string?.length
          });

          // Validate parameters
          if (!input.old_string || !input.new_string) {
            const errorMsg = `Error: edit_file requires 'old_string' and 'new_string' parameters. Received old_string: ${typeof input.old_string}, new_string: ${typeof input.new_string}`;
            console.error(`[Tool] ${errorMsg}`);
            return errorMsg;
          }

          const filePath = path.join(worktreePath, input.path);
          logger.log(`[Tool] Editing file: ${filePath}`);

          // Read current content
          const currentContent = await fs.readFile(filePath, 'utf-8');
          logger.log(`[Tool] Current file size: ${currentContent.length} chars`);

          // Replace old_string with new_string
          if (!currentContent.includes(input.old_string)) {
            const errorMsg = `Error: old_string not found in file. Make sure the string matches exactly (including whitespace and indentation).`;
            console.error(`[Tool] ${errorMsg}`);
            console.error(`[Tool] Looking for:`, input.old_string.substring(0, 100));
            return errorMsg;
          }

          const newContent = currentContent.replace(input.old_string, input.new_string);
          logger.log(`[Tool] Replacement made, new file size: ${newContent.length} chars`);

          // Write back
          await fs.writeFile(filePath, newContent, 'utf-8');
          logger.log(`[Tool] ✓ File edited successfully: ${input.path}`);

          return `File edited successfully: ${input.path}. Replaced ${input.old_string.length} characters with ${input.new_string.length} characters.`;
        } catch (error: any) {
          console.error(`[Tool] Error editing file:`, error);
          return `Error editing file: ${error.message}`;
        }

      case 'bash':
        // CRITICAL: Block git add/commit/push - the system handles these
        const blockedPatterns = [
          /git\s+add/, /git\s+commit/, /git\s+push/, /git\s+rebase/,
          /rm\s+-rf/, /sudo/, /curl/, /wget/
        ];

        const isBlocked = blockedPatterns.some(pattern => pattern.test(input.command));
        if (isBlocked) {
          return `ERROR: Command blocked for security: ${input.command}\n\nThe system automatically handles git add/commit/push. Just fix the code and output your JSON report.`;
        }

        // Whitelist check
        const allowedPatterns = [
          /^npm test/, /^npm run test/, /^npm run lint/, /^npm run typecheck/,
          /^npx tsc/, /^npx vitest/, /^npx jest/, /^git status/, /^git diff/,
          /^git log/, /^git branch/, /^grep/, /^node /, /^ls/, /^cat /, /^pwd/
        ];

        const isAllowed = allowedPatterns.some(pattern => pattern.test(input.command));
        if (!isAllowed) {
          return `ERROR: Command not allowed: ${input.command}`;
        }

        try {
          const { stdout, stderr } = await execAsync(input.command, {
            cwd: worktreePath,
            timeout: 120000 // 2 min max
          });
          return stdout + stderr;
        } catch (error: any) {
          return `Command failed: ${error.message}\nStdout: ${error.stdout}\nStderr: ${error.stderr}`;
        }

      default:
        return `Unknown tool: ${toolName}`;
    }
  }

  /**
   * Parse final JSON report from agent output
   */
  private parseFinalReport(text: string): AgentReport {
    const match = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (!match) {
      throw new Error('Agent did not produce a final JSON report');
    }

    try {
      const report = JSON.parse(match[1]);
      return report as AgentReport;
    } catch (error) {
      throw new Error(`Failed to parse agent JSON report: ${error}`);
    }
  }

  /**
   * Run tests in worktree
   */
  private async runTests(worktreePath: string): Promise<{ passed: boolean; output: string }> {
    logger.log(`[Tests] Running npm test in ${worktreePath}`);

    try {
      const { stdout, stderr } = await execAsync('npm test', {
        cwd: worktreePath,
        timeout: 120000 // 2 minutes max
      });

      logger.log(`[Tests] ✓ Tests passed`);

      return {
        passed: true,
        output: stdout + '\n' + stderr
      };

    } catch (error: any) {
      console.error(`[Tests] ✗ Tests failed`);

      return {
        passed: false,
        output: error.stdout + '\n' + error.stderr
      };
    }
  }

  /**
   * Commit and push changes
   */
  private async commitAndPush(worktreePath: string, branchName: string, ticket: any, report: AgentReport) {
    logger.log(`[Git] Committing changes in ${worktreePath}`);

    const commitMessage = `fix(${ticket.category}): ${ticket.subject.slice(0, 60)}

${report.fix_summary}

Closes ticket ${ticket.id.slice(0, 8)}

🤖 Generated with Claude Agent SDK
Agent: Hive Doctor (Claude Opus 4.5)`;

    await execAsync(`git add .`, { cwd: worktreePath });

    await execAsync(`git commit -m "${commitMessage.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`, {
      cwd: worktreePath
    });

    // Configure git to use GitHub token for push
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      throw new Error('GITHUB_TOKEN not configured');
    }

    await execAsync(`git push https://${githubToken}@github.com/doffymelo-a11y/agency-killer-v4.git ${branchName}`, {
      cwd: worktreePath,
      timeout: 30000
    });

    logger.log(`[Git] ✓ Pushed to ${branchName}`);
  }

  /**
   * Create GitHub PR using gh CLI
   */
  private async createPullRequest(
    branchName: string,
    ticket: any,
    report: AgentReport,
    sessionId: string,
    worktreePath: string
  ): Promise<{ url: string; number: number }> {
    logger.log(`[GitHub] Creating PR for ${branchName}`);

    const prBody = `## 🤖 Auto-fix by Hive Doctor

**Closes:** ticket TK-${ticket.id.slice(0, 8)}
**Reporter:** ${ticket.user_email || 'Unknown'}

### Root cause
${report.root_cause}

### What changed
${report.fix_summary}

**Files modified:**
${report.files_changed.map((f: string) => `- \`${f}\``).join('\n')}

### Verification
- Tests run: ${report.tests_run.join(', ')}
- Status: ${report.tests_status}

### Risk assessment
**Level:** ${report.risk}
${report.risk_reasoning}

### Follow-up
${report.follow_up_recommended || '_None_'}

---
_Generated by Claude Agent SDK · session_id: ${sessionId}_
_Cost: $${report.cost_usd || '0.00'} · Duration: ${report.duration_seconds || 0}s_
`;

    // Use gh CLI to create PR
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      throw new Error('GITHUB_TOKEN not configured');
    }

    const ghPath = process.env.HOME + '/bin/gh';
    const { stdout } = await execAsync(
      `GITHUB_TOKEN=${githubToken} ${ghPath} pr create --title "fix: ${ticket.subject}" --body "${prBody.replace(/"/g, '\\"').replace(/\n/g, '\\n')}" --base main --head ${branchName}`,
      {
        timeout: 30000,
        cwd: worktreePath
      }
    );

    // Extract PR URL from gh output
    const prUrl = stdout.trim();
    const prNumber = parseInt(prUrl.split('/').pop() || '0', 10);

    logger.log(`[GitHub] ✓ PR created: ${prUrl}`);

    return { url: prUrl, number: prNumber };
  }

  /**
   * Get list of changed files
   */
  private async getChangedFiles(worktreePath: string): Promise<string[]> {
    try {
      const { stdout } = await execAsync('git diff --name-only HEAD~1', {
        cwd: worktreePath
      });

      return stdout.trim().split('\n').filter(Boolean);
    } catch (error) {
      console.warn('[Git] Could not get changed files');
      return [];
    }
  }

  /**
   * Cleanup worktree after PR creation
   */
  private async cleanupWorktree(worktreePath: string) {
    logger.log(`[Git] Cleaning up worktree ${worktreePath}`);

    try {
      await execAsync(`git worktree remove ${worktreePath} --force`, {
        timeout: 10000
      });
      logger.log(`[Git] ✓ Worktree removed`);
    } catch (error) {
      console.warn(`[Git] Failed to remove worktree:`, error);
    }
  }
}

// Singleton instance
export const claudeAgentService = new ClaudeAgentService();
