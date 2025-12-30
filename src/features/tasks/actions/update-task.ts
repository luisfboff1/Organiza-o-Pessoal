'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const updateTaskSchema = z.object({
  taskId: z.string().uuid(),
  workspaceId: z.string().uuid(),
  title: z.string().min(1).optional(),
  status: z.enum(['todo', 'doing', 'done']).optional(),
  priority: z.number().min(1).max(5).optional(),
  dueDate: z.string().optional(),
  projectId: z.string().uuid().optional(),
  pageId: z.string().uuid().optional(),
});

export async function updateTask(data: z.infer<typeof updateTaskSchema>) {
  const supabase = await createServerClient();

  const validatedData = updateTaskSchema.parse(data);
  const { taskId, workspaceId, ...updates } = validatedData;

  const updateData: any = {};
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.priority !== undefined) updateData.priority = updates.priority;
  if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;
  if (updates.projectId !== undefined) updateData.project_id = updates.projectId;
  if (updates.pageId !== undefined) updateData.page_id = updates.pageId;

  const { data: task, error } = await (supabase as any)
    .from('tasks')
    .update(updateData)
    .eq('id', taskId)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar task: ${error.message}`);
  }

  revalidatePath(`/${workspaceId}/tasks`);
  revalidatePath(`/${workspaceId}/projects`);

  return task;
}
