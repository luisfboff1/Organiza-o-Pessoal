'use server';

import { createServerClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database.types';

type Widget = Database['public']['Tables']['dashboard_widgets']['Row'];

export async function getWidgets(workspaceId: string, projectId?: string): Promise<Widget[]> {
  const supabase = await createServerClient();

  let query = supabase
    .from('dashboard_widgets')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true });

  if (projectId) {
    query = query.eq('project_id', projectId);
  } else {
    query = query.is('project_id', null);
  }

  const { data: widgets, error } = await query;

  if (error) {
    throw new Error(`Erro ao buscar widgets: ${error.message}`);
  }

  return widgets || [];
}
