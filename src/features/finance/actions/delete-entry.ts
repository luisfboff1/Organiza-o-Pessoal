'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const deleteEntrySchema = z.object({
  entryId: z.string().uuid(),
  workspaceId: z.string().uuid(),
});

export async function deleteFinanceEntry(data: z.infer<typeof deleteEntrySchema>) {
  const supabase = await createServerClient();

  const validatedData = deleteEntrySchema.parse(data);

  const { error } = await supabase
    .from('finance_entries')
    .delete()
    .eq('id', validatedData.entryId)
    .eq('workspace_id', validatedData.workspaceId);

  if (error) {
    throw new Error(`Erro ao deletar lançamento: ${error.message}`);
  }

  revalidatePath(`/${validatedData.workspaceId}/finance`);

  return { success: true };
}
