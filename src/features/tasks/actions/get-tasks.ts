'use server';

import { createServerClient } from '@/lib/supabase/server';

interface GetTasksOptions {
  workspaceId: string;
  projectId?: string;
  status?: 'todo' | 'doing' | 'done';
  pageId?: string;
}

export async function getTasks(options: GetTasksOptions) {
  const supabase = await createServerClient();

  let query = supabase
    .from('tasks')
    .select(`
      *,
      projects(id, title),
      pages(id, title)
    `)
    .eq('workspace_id', options.workspaceId)
    .order('created_at', { ascending: false });

  if (options.projectId) {
    query = query.eq('project_id', options.projectId);
  }

  if (options.status) {
    query = query.eq('status', options.status);
  }

  if (options.pageId) {
    query = query.eq('page_id', options.pageId);
  }

  const { data: tasks, error } = await query;

  if (error) {
    throw new Error(`Erro ao buscar tasks: ${error.message}`);
  }

  return tasks;
}
