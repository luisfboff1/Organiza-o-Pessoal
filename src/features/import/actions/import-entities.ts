'use server';

import { createServerClient } from '@/lib/supabase/server';

export async function importFinanceEntries(data: {
  workspaceId: string;
  entries: Array<{
    type: 'income' | 'expense';
    category: string;
    amount: number;
    date: string;
    note?: string;
  }>;
}) {
  const supabase = await createServerClient();

  const { data: result, error } = await supabase
    .from('finance_entries')
    .insert(
      data.entries.map((entry) => ({
        workspace_id: data.workspaceId,
        ...entry,
      })) as any
    );

  if (error) {
    throw new Error(error.message);
  }

  return { success: true, count: data.entries.length };
}

export async function importProjects(data: {
  workspaceId: string;
  projects: Array<{
    title: string;
    description?: string;
    status: 'backlog' | 'in_progress' | 'done';
  }>;
}) {
  const supabase = await createServerClient();

  const { data: result, error } = await supabase
    .from('projects')
    .insert(
      data.projects.map((project) => ({
        workspace_id: data.workspaceId,
        ...project,
      })) as any
    );

  if (error) {
    throw new Error(error.message);
  }

  return { success: true, count: data.projects.length };
}
