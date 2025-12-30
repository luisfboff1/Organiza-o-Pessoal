'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const deleteTaskSchema = z.object({
  taskId: z.string().uuid(),
  workspaceId: z.string().uuid(),
});

export async function deleteTask(data: z.infer<typeof deleteTaskSchema>) {
  const supabase = await createServerClient();

  const validatedData = deleteTaskSchema.parse(data);

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', validatedData.taskId)
    .eq('workspace_id', validatedData.workspaceId);

  if (error) {
    throw new Error(`Erro ao deletar task: ${error.message}`);
  }

  revalidatePath(`/${validatedData.workspaceId}/tasks`);
  revalidatePath(`/${validatedData.workspaceId}/projects`);

  return { success: true };
}
