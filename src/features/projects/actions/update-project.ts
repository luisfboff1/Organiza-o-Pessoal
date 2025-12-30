'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const updateProjectSchema = z.object({
  projectId: z.string().uuid(),
  workspaceId: z.string().uuid(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['backlog', 'in_progress', 'done']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function updateProject(data: z.infer<typeof updateProjectSchema>) {
  const supabase = await createServerClient();

  const validatedData = updateProjectSchema.parse(data);
  const { projectId, workspaceId, ...updates } = validatedData;

  const updateData: any = {};
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.startDate !== undefined) updateData.start_date = updates.startDate;
  if (updates.endDate !== undefined) updateData.end_date = updates.endDate;

  const { data: project, error } = await (supabase as any)
    .from('projects')
    .update(updateData)
    .eq('id', projectId)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar projeto: ${error.message}`);
  }

  revalidatePath(`/${workspaceId}/projects`);

  return project;
}
