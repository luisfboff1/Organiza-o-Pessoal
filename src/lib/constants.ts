export const APP_NAME = 'Personal OS';
export const APP_DESCRIPTION = 'Your personal Notion-like workspace with AI';

// Supabase
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// AI
export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

// App
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Defaults
export const DEFAULT_WORKSPACE_NAME = 'My Workspace';
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const AUTOSAVE_DEBOUNCE_MS = 1000;
export const EMBEDDINGS_CHUNK_SIZE = 500;
export const RAG_TOP_K = 10;
