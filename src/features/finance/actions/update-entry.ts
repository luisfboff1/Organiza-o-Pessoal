'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const updateEntrySchema = z.object({
  entryId: z.string().uuid(),
  workspaceId: z.string().uuid(),
  type: z.enum(['income', 'expense', 'investment', 'balance']).optional(),
  category: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  date: z.string().optional(),
  note: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['paid', 'pending']).optional(),
  company: z.string().optional(),
  recurrence: z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly']).optional(),
  projectId: z.string().uuid().optional(),
  pageId: z.string().uuid().optional(),
});

export async function updateFinanceEntry(data: z.infer<typeof updateEntrySchema>) {
  const supabase = await createServerClient();

  const validatedData = updateEntrySchema.parse(data);
  const { entryId, workspaceId, ...updates } = validatedData;

  const updateData: any = {};
  if (updates.type !== undefined) updateData.type = updates.type;
  if (updates.category !== undefined) updateData.category = updates.category;
  if (updates.amount !== undefined) updateData.amount = updates.amount;
  if (updates.date !== undefined) updateData.date = updates.date;
  if (updates.note !== undefined) updateData.note = updates.note;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.company !== undefined) updateData.company = updates.company;
  if (updates.recurrence !== undefined) updateData.recurrence = updates.recurrence;
  if (updates.projectId !== undefined) updateData.project_id = updates.projectId;
  if (updates.pageId !== undefined) updateData.page_id = updates.pageId;

  const { data: entry, error } = await (supabase as any)
    .from('finance_entries')
    .update(updateData)
    .eq('id', entryId)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar lançamento: ${error.message}`);
  }

  revalidatePath(`/${workspaceId}/finance`);

  return entry;
}
