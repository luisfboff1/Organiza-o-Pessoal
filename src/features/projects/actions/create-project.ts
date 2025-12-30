'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const createProjectSchema = z.object({
  workspaceId: z.string().uuid(),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  status: z.enum(['backlog', 'in_progress', 'done']).default('backlog'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function createProject(data: z.infer<typeof createProjectSchema>) {
  const supabase = await createServerClient();

  const validatedData = createProjectSchema.parse(data);

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      workspace_id: validatedData.workspaceId,
      title: validatedData.title,
      description: validatedData.description,
      status: validatedData.status,
      start_date: validatedData.startDate,
      end_date: validatedData.endDate,
    } as any)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar projeto: ${error.message}`);
  }

  revalidatePath(`/${validatedData.workspaceId}/projects`);

  return project;
}
