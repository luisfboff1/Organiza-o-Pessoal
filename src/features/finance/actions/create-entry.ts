'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Database } from '@/types/database.types';

const createEntrySchema = z.object({
  workspaceId: z.string().uuid(),
  type: z.enum(['income', 'expense', 'investment', 'balance']),
  category: z.string().min(1, 'Categoria é obrigatória'),
  amount: z.number().positive('Valor deve ser positivo'),
  date: z.string(),
  description: z.string().optional(),
  note: z.string().optional(),
  status: z.enum(['paid', 'pending']).default('paid'),
  company: z.string().optional(),
  projectId: z.string().uuid().optional(),
  pageId: z.string().uuid().optional(),
  recurrence: z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly']).default('none'),
});

type FinanceEntry = Database['public']['Tables']['finance_entries']['Row'];

export async function createFinanceEntry(data: z.infer<typeof createEntrySchema>): Promise<FinanceEntry> {
  const supabase = await createServerClient();

  const validatedData = createEntrySchema.parse(data);

  const { data: entry, error} = await supabase
    .from('finance_entries')
    .insert({
      workspace_id: validatedData.workspaceId,
      type: validatedData.type,
      category: validatedData.category,
      amount: validatedData.amount,
      date: validatedData.date,
      description: validatedData.description,
      note: validatedData.note,
      status: validatedData.status,
      company: validatedData.company,
      project_id: validatedData.projectId,
      page_id: validatedData.pageId,
      recurrence: validatedData.recurrence,
    } as any)
    .select()
    .single<FinanceEntry>();

  if (error) {
    throw new Error(`Erro ao criar lançamento: ${error.message}`);
  }

  revalidatePath(`/${validatedData.workspaceId}/finance`);

  return entry;
}
