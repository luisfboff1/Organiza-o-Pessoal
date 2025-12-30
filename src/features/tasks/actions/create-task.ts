'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const createTaskSchema = z.object({
  workspaceId: z.string().uuid(),
  title: z.string().min(1, 'Título é obrigatório'),
  status: z.enum(['todo', 'doing', 'done']).default('todo'),
  priority: z.number().min(1).max(5).default(2),
  dueDate: z.string().optional(),
  projectId: z.string().uuid().optional(),
  pageId: z.string().uuid().optional(),
});

export async function createTask(data: z.infer<typeof createTaskSchema>) {
  const supabase = await createServerClient();

  const validatedData = createTaskSchema.parse(data);

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      workspace_id: validatedData.workspaceId,
      title: validatedData.title,
      status: validatedData.status,
      priority: validatedData.priority,
      due_date: validatedData.dueDate,
      project_id: validatedData.projectId,
      page_id: validatedData.pageId,
    } as any)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar task: ${error.message}`);
  }

  revalidatePath(`/${validatedData.workspaceId}/tasks`);
  if (validatedData.projectId) {
    revalidatePath(`/${validatedData.workspaceId}/projects`);
  }

  return task;
}
