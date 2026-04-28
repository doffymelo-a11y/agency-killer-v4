/**
 * Files Service - Project file management
 * Phase 4 - Chantier A: Files Persistant
 */

import { supabaseAdmin } from './supabase.service.js';

export interface ProjectFile {
  id: string;
  project_id: string;
  task_id?: string | null;
  agent_id?: string | null;
  uploaded_by?: string | null;
  filename: string;
  url: string;
  file_type: string;
  mime_type: string;
  size_bytes: number;
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateFileInput {
  project_id: string;
  task_id?: string | null;
  agent_id?: string | null;
  uploaded_by?: string | null;
  filename: string;
  url: string;
  file_type: string;
  mime_type: string;
  size_bytes: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

/**
 * Get all files for a project
 */
export async function getProjectFiles(projectId: string, userId: string): Promise<ProjectFile[]> {
  console.log(`[Files Service] Getting files for project ${projectId}, user ${userId}`);

  // Verify user owns this project
  const { data: project, error: projectError } = await supabaseAdmin
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single();

  if (projectError || !project) {
    throw new Error('Project not found or access denied');
  }

  // Get files using RPC function (respects RLS)
  const { data: files, error } = await supabaseAdmin
    .rpc('get_project_files', { p_project_id: projectId });

  if (error) {
    console.error('[Files Service] Error fetching files:', error);
    throw error;
  }

  return files || [];
}

/**
 * Create a new file record
 */
export async function createFile(input: CreateFileInput, userId: string): Promise<ProjectFile> {
  console.log(`[Files Service] Creating file for project ${input.project_id}:`, input.filename);

  // Verify user owns this project
  const { data: project, error: projectError } = await supabaseAdmin
    .from('projects')
    .select('id')
    .eq('id', input.project_id)
    .eq('user_id', userId)
    .single();

  if (projectError || !project) {
    throw new Error('Project not found or access denied');
  }

  // Insert file record
  const { data: file, error } = await supabaseAdmin
    .from('project_files')
    .insert({
      project_id: input.project_id,
      task_id: input.task_id || null,
      agent_id: input.agent_id || null,
      uploaded_by: input.uploaded_by || userId,
      filename: input.filename,
      url: input.url,
      file_type: input.file_type,
      mime_type: input.mime_type,
      size_bytes: input.size_bytes,
      tags: input.tags || [],
      metadata: input.metadata || {},
    })
    .select()
    .single();

  if (error) {
    console.error('[Files Service] Error creating file:', error);
    throw error;
  }

  console.log(`[Files Service] ✓ File created: ${file.id}`);

  return file;
}

/**
 * Delete a file
 */
export async function deleteFile(fileId: string, userId: string): Promise<void> {
  console.log(`[Files Service] Deleting file ${fileId} for user ${userId}`);

  // Get file to verify ownership
  const { data: file, error: fetchError } = await supabaseAdmin
    .from('project_files')
    .select('project_id, projects!inner(user_id)')
    .eq('id', fileId)
    .single();

  if (fetchError || !file) {
    throw new Error('File not found');
  }

  // Check if user owns the project
  const projectUserId = (file as any).projects?.user_id;
  if (projectUserId !== userId) {
    throw new Error('Access denied - not your project');
  }

  // Delete file
  const { error: deleteError } = await supabaseAdmin
    .from('project_files')
    .delete()
    .eq('id', fileId);

  if (deleteError) {
    console.error('[Files Service] Error deleting file:', error);
    throw deleteError;
  }

  console.log(`[Files Service] ✓ File deleted: ${fileId}`);
}

/**
 * Auto-tag a file based on its properties
 */
export function autoTagFile(filename: string, mimeType: string, agentId?: string): string[] {
  const tags: string[] = [];

  // Agent-specific tags
  if (agentId) {
    tags.push(agentId);
  }

  // File type tags
  if (mimeType.startsWith('image/')) {
    tags.push('image');
    if (mimeType.includes('png')) tags.push('png');
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) tags.push('jpg');
  } else if (mimeType.startsWith('video/')) {
    tags.push('video');
    if (mimeType.includes('mp4')) tags.push('mp4');
  } else if (mimeType.startsWith('audio/')) {
    tags.push('audio');
    if (mimeType.includes('mp3')) tags.push('mp3');
  } else if (mimeType.includes('pdf')) {
    tags.push('document', 'pdf');
  }

  // Content-based tags from filename
  const lowerFilename = filename.toLowerCase();
  if (lowerFilename.includes('ad') || lowerFilename.includes('creative')) {
    tags.push('ad_creative');
  }
  if (lowerFilename.includes('meta') || lowerFilename.includes('facebook')) {
    tags.push('meta_ads');
  }
  if (lowerFilename.includes('google')) {
    tags.push('google_ads');
  }
  if (lowerFilename.includes('carousel')) {
    tags.push('carousel');
  }
  if (lowerFilename.includes('story') || lowerFilename.includes('stories')) {
    tags.push('story');
  }

  return Array.from(new Set(tags)); // Remove duplicates
}
