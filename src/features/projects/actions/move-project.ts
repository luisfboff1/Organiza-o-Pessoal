'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const moveProjectSchema = z.object({
  projectId: z.string().uuid(),
  workspaceId: z.string().uuid(),
  status: z.enum(['backlog', 'in_progress', 'done']),
});

export async function moveProject(data: z.infer<typeof moveProjectSchema>) {
  const supabase = await createServerClient();

  const validatedData = moveProjectSchema.parse(data);

  const { data: project, error } = await (supabase as any)
    .from('projects')
    .update({ status: validatedData.status })
    .eq('id', validatedData.projectId)
    .eq('workspace_id', validatedData.workspaceId)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao mover projeto: ${error.message}`);
  }

  revalidatePath(`/${validatedData.workspaceId}/projects`);

  return project;
}
