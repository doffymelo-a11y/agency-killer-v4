// ═══════════════════════════════════════════════════════════════
// THE HIVE OS V4 - Supabase Database Types
// Auto-generated types for type safety
// ═══════════════════════════════════════════════════════════════

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          name: string;
          scope: 'meta_ads' | 'sem' | 'seo' | 'analytics' | 'full_scale';
          status: 'planning' | 'in_progress' | 'completed' | 'paused';
          current_phase: string;
          state_flags: Json;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          scope: 'meta_ads' | 'sem' | 'seo' | 'analytics' | 'full_scale';
          status?: 'planning' | 'in_progress' | 'completed' | 'paused';
          current_phase?: string;
          state_flags?: Json;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          scope?: 'meta_ads' | 'sem' | 'seo' | 'analytics' | 'full_scale';
          status?: 'planning' | 'in_progress' | 'completed' | 'paused';
          current_phase?: string;
          state_flags?: Json;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string | null;
          assignee: 'sora' | 'luna' | 'marcus' | 'milo' | 'orchestrator';
          phase: 'Audit' | 'Setup' | 'Production' | 'Optimization';
          status: 'todo' | 'in_progress' | 'done' | 'blocked';
          context_questions: string[];
          user_inputs: Json | null;
          estimated_hours: number;
          due_date: string;
          depends_on: string[];
          deliverable_url: string | null;
          deliverable_type: 'image' | 'video' | 'pdf' | 'text' | 'report' | null;
          created_at: string;
          started_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string | null;
          assignee: 'sora' | 'luna' | 'marcus' | 'milo' | 'orchestrator';
          phase: 'Audit' | 'Setup' | 'Production' | 'Optimization';
          status?: 'todo' | 'in_progress' | 'done' | 'blocked';
          context_questions?: string[];
          user_inputs?: Json | null;
          estimated_hours?: number;
          due_date: string;
          depends_on?: string[];
          deliverable_url?: string | null;
          deliverable_type?: 'image' | 'video' | 'pdf' | 'text' | 'report' | null;
          created_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          description?: string | null;
          assignee?: 'sora' | 'luna' | 'marcus' | 'milo' | 'orchestrator';
          phase?: 'Audit' | 'Setup' | 'Production' | 'Optimization';
          status?: 'todo' | 'in_progress' | 'done' | 'blocked';
          context_questions?: string[];
          user_inputs?: Json | null;
          estimated_hours?: number;
          due_date?: string;
          depends_on?: string[];
          deliverable_url?: string | null;
          deliverable_type?: 'image' | 'video' | 'pdf' | 'text' | 'report' | null;
          created_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
        };
      };
      chat_sessions: {
        Row: {
          id: string;
          project_id: string;
          mode: 'quick_research' | 'task_execution';
          linked_task_id: string | null;
          injected_context: Json | null;
          messages: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          mode?: 'quick_research' | 'task_execution';
          linked_task_id?: string | null;
          injected_context?: Json | null;
          messages?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          mode?: 'quick_research' | 'task_execution';
          linked_task_id?: string | null;
          injected_context?: Json | null;
          messages?: Json;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      agent_role: 'sora' | 'luna' | 'marcus' | 'milo' | 'orchestrator';
      chat_mode: 'quick_research' | 'task_execution';
      deliverable_type: 'image' | 'video' | 'pdf' | 'text' | 'report';
      project_scope: 'meta_ads' | 'sem' | 'seo' | 'analytics' | 'full_scale';
      project_status: 'planning' | 'in_progress' | 'completed' | 'paused';
      task_phase: 'Audit' | 'Setup' | 'Production' | 'Optimization';
      task_status: 'todo' | 'in_progress' | 'done' | 'blocked';
    };
  };
};
