'use server';

import { createServerClient } from '@/lib/supabase/server';

export async function getProjects(workspaceId: string) {
  const supabase = await createServerClient();

  const { data: projects, error } = await supabase
    .from('projects')
    .select(`
      *,
      project_pages(count),
      tasks(id, status)
    `)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Erro ao buscar projetos: ${error.message}`);
  }

  // Calcular estatísticas por projeto
  const projectsWithStats = projects.map((project: any) => ({
    ...project,
    pageCount: project.project_pages[0]?.count || 0,
    taskCount: project.tasks?.length || 0,
    tasksDone: project.tasks?.filter((t: any) => t.status === 'done').length || 0,
  }));

  return projectsWithStats;
}
