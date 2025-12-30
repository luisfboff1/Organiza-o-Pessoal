'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const deleteWidgetSchema = z.object({
  widgetId: z.string().uuid(),
  workspaceId: z.string().uuid(),
});

export async function deleteWidget(data: z.infer<typeof deleteWidgetSchema>) {
  const supabase = await createServerClient();

  const validatedData = deleteWidgetSchema.parse(data);

  const { error } = await supabase
    .from('dashboard_widgets')
    .delete()
    .eq('id', validatedData.widgetId)
    .eq('workspace_id', validatedData.workspaceId);

  if (error) {
    throw new Error(`Erro ao deletar widget: ${error.message}`);
  }

  revalidatePath(`/${validatedData.workspaceId}/dashboard`);

  return { success: true };
}
