'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const bulkCreateSchema = z.object({
  workspaceId: z.string().uuid(),
  entries: z.array(
    z.object({
      type: z.enum(['income', 'expense']),
      category: z.string().min(1),
      amount: z.number().positive(),
      date: z.string(),
      note: z.string().optional(),
      projectId: z.string().uuid().optional(),
    })
  ),
});

export async function bulkCreateFinanceEntries(data: z.infer<typeof bulkCreateSchema>) {
  const supabase = await createServerClient();

  const validatedData = bulkCreateSchema.parse(data);

  const entriesToInsert = validatedData.entries.map((entry) => ({
    workspace_id: validatedData.workspaceId,
    type: entry.type,
    category: entry.category,
    amount: entry.amount,
    date: entry.date,
    note: entry.note,
    project_id: entry.projectId,
  }));

  const { data: entries, error } = await supabase.from('finance_entries').insert(entriesToInsert as any).select();

  if (error) {
    throw new Error(`Erro ao criar lançamentos em lote: ${error.message}`);
  }

  revalidatePath(`/${validatedData.workspaceId}/finance`);

  return entries;
}
