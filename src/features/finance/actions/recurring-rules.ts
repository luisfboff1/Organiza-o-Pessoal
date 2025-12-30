'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface RecurringRule {
  id: string;
  workspace_id: string;
  user_id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense' | 'investment';
  category: string;
  company?: string;
  description?: string;
  note?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date?: string;
  day_of_month?: number;
  day_of_week?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Buscar todas as regras de recorrência do workspace
export async function getRecurringRules(workspaceId: string) {
  const supabase = await createServerClient();

  const { data, error } = await (supabase as any)
    .from('finance_recurring_rules')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Erro ao buscar regras de recorrência: ${error.message}`);
  return data as RecurringRule[];
}

// Criar uma regra de recorrência e gerar as entradas futuras
export async function createRecurringRule(
  workspaceId: string,
  data: {
    title: string;
    amount: number;
    type: 'income' | 'expense' | 'investment';
    category: string;
    company?: string;
    description?: string;
    note?: string;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    start_date: string;
    end_date?: string;
    day_of_month?: number;
    day_of_week?: number;
  }
) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  // Criar a regra
  const { data: rule, error: ruleError } = await (supabase as any)
    .from('finance_recurring_rules')
    .insert({
      workspace_id: workspaceId,
      user_id: user.id,
      ...data,
      is_active: true,
    })
    .select()
    .single();

  if (ruleError) throw new Error(`Erro ao criar regra de recorrência: ${ruleError.message}`);

  // Gerar as entradas futuras (próximos 12 meses)
  await generateEntriesFromRule(workspaceId, rule.id);

  revalidatePath(`/${workspaceId}/finance`);
  return rule as RecurringRule;
}

// Atualizar uma regra de recorrência
export async function updateRecurringRule(
  ruleId: string,
  workspaceId: string,
  updates: Partial<Omit<RecurringRule, 'id' | 'workspace_id' | 'user_id' | 'created_at' | 'updated_at'>>
) {
  const supabase = await createServerClient();

  const { data: rule, error } = await (supabase as any)
    .from('finance_recurring_rules')
    .update(updates)
    .eq('id', ruleId)
    .select()
    .single();

  if (error) throw new Error(`Erro ao atualizar regra de recorrência: ${error.message}`);

  // Se houver mudanças significativas, remover entradas futuras pendentes e re-gerar
  if (updates.amount !== undefined || updates.frequency !== undefined ||
      updates.start_date !== undefined || updates.day_of_month !== undefined ||
      updates.day_of_week !== undefined) {
    await deleteFutureEntriesFromRule(ruleId);
    await generateEntriesFromRule(workspaceId, ruleId);
  }

  revalidatePath(`/${workspaceId}/finance`);
  return rule as RecurringRule;
}

// Deletar uma regra de recorrência e suas entradas futuras pendentes
export async function deleteRecurringRule(ruleId: string, workspaceId: string) {
  const supabase = await createServerClient();

  // Primeiro, deletar as entradas futuras pendentes
  await deleteFutureEntriesFromRule(ruleId);

  // Depois, deletar a regra
  const { error } = await (supabase as any)
    .from('finance_recurring_rules')
    .delete()
    .eq('id', ruleId);

  if (error) throw new Error(`Erro ao deletar regra de recorrência: ${error.message}`);

  revalidatePath(`/${workspaceId}/finance`);
}

// Ativar/desativar uma regra
export async function toggleRecurringRule(ruleId: string, workspaceId: string, isActive: boolean) {
  const supabase = await createServerClient();

  const { error } = await (supabase as any)
    .from('finance_recurring_rules')
    .update({ is_active: isActive })
    .eq('id', ruleId);

  if (error) throw new Error(`Erro ao ${isActive ? 'ativar' : 'desativar'} regra: ${error.message}`);

  // Se ativou, gerar entradas futuras; se desativou, remover futuras pendentes
  if (isActive) {
    await generateEntriesFromRule(workspaceId, ruleId);
  } else {
    await deleteFutureEntriesFromRule(ruleId);
  }

  revalidatePath(`/${workspaceId}/finance`);
}

// Regenerar lançamentos futuros (adicionar mais meses)
export async function regenerateEntriesFromRule(ruleId: string, workspaceId: string, additionalMonths: number = 12) {
  const supabase = await createServerClient();

  // Buscar a regra
  const { data: rule, error: ruleError } = await (supabase as any)
    .from('finance_recurring_rules')
    .select('*')
    .eq('id', ruleId)
    .single();

  if (ruleError || !rule) throw new Error('Regra não encontrada');
  if (!rule.is_active) throw new Error('Regra está inativa');

  // Gerar mais lançamentos
  await generateEntriesFromRule(workspaceId, ruleId, additionalMonths);

  revalidatePath(`/${workspaceId}/finance`);
}

// Função auxiliar: Deletar entradas futuras pendentes de uma regra
async function deleteFutureEntriesFromRule(ruleId: string) {
  const supabase = await createServerClient();
  const today = new Date().toISOString().split('T')[0];

  const { error } = await (supabase as any)
    .from('finance_entries')
    .delete()
    .eq('recurring_rule_id', ruleId)
    .eq('status', 'pending')
    .gte('date', today);

  if (error) throw new Error(`Erro ao deletar entradas futuras: ${error.message}`);
}

// Função auxiliar: Gerar entradas futuras baseadas em uma regra
async function generateEntriesFromRule(workspaceId: string, ruleId: string, monthsAhead: number = 12) {
  const supabase = await createServerClient();

  // Buscar a regra
  const { data: rule, error: ruleError } = await (supabase as any)
    .from('finance_recurring_rules')
    .select('*')
    .eq('id', ruleId)
    .single();

  if (ruleError || !rule) throw new Error('Regra não encontrada');
  if (!rule.is_active) return; // Não gerar se estiver inativa

  const entries = [];
  const today = new Date();
  const startDate = new Date(rule.start_date + 'T12:00:00');
  const endDate = rule.end_date ? new Date(rule.end_date + 'T12:00:00') : null;

  // Buscar a última entrada gerada para esta regra
  const { data: lastEntry } = await (supabase as any)
    .from('finance_entries')
    .select('date')
    .eq('recurring_rule_id', ruleId)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  // Começar a gerar a partir da última entrada ou de hoje
  const lastGeneratedDate = lastEntry ? new Date(lastEntry.date + 'T12:00:00') : today;
  const maxDate = new Date(Math.max(today.getTime(), lastGeneratedDate.getTime()));
  maxDate.setMonth(maxDate.getMonth() + monthsAhead);

  // Buscar TODAS as datas que já existem para esta regra (mais eficiente)
  const { data: existingEntries } = await (supabase as any)
    .from('finance_entries')
    .select('date')
    .eq('recurring_rule_id', ruleId);

  const existingDates = new Set(existingEntries?.map((e: any) => e.date) || []);

  let currentDate = new Date(startDate);

  // Garantir que currentDate não seja no passado
  if (currentDate < today) {
    currentDate = new Date(today);
    // Ajustar para o próximo dia válido baseado na frequência
    currentDate = getNextValidDate(currentDate, rule);
  }

  while (currentDate <= maxDate && (!endDate || currentDate <= endDate)) {
    const dateStr = currentDate.toISOString().split('T')[0];

    // Verificar se já existe usando o Set (muito mais rápido)
    if (!existingDates.has(dateStr)) {
      entries.push({
        workspace_id: workspaceId,
        type: rule.type,
        category: rule.category,
        amount: rule.amount,
        date: dateStr,
        description: rule.description || rule.title, // Usar title se description estiver vazia
        company: rule.company,
        note: rule.note,
        status: 'pending',
        recurrence: rule.frequency,
        recurring_rule_id: ruleId,
      });
    }

    // Avançar para a próxima data baseado na frequência
    currentDate = getNextOccurrence(currentDate, rule);
  }

  // Inserir todas as entradas novas
  if (entries.length > 0) {
    const { error: insertError } = await (supabase as any)
      .from('finance_entries')
      .insert(entries);

    if (insertError) throw new Error(`Erro ao gerar entradas: ${insertError.message}`);
  }
}

// Função auxiliar: Obter próxima data válida baseada na regra
function getNextValidDate(date: Date, rule: RecurringRule): Date {
  const result = new Date(date);

  switch (rule.frequency) {
    case 'daily':
      // Já está na data certa
      break;

    case 'weekly':
      // Avançar para o próximo dia da semana especificado
      if (rule.day_of_week !== undefined) {
        while (result.getDay() !== rule.day_of_week) {
          result.setDate(result.getDate() + 1);
        }
      }
      break;

    case 'monthly':
      // Avançar para o próximo dia do mês especificado
      if (rule.day_of_month !== undefined) {
        result.setDate(rule.day_of_month);
        if (result <= date) {
          result.setMonth(result.getMonth() + 1);
        }
      }
      break;

    case 'yearly':
      // Avançar para o próximo mês/dia especificado
      if (rule.day_of_month !== undefined) {
        const startDate = new Date(rule.start_date + 'T12:00:00');
        result.setMonth(startDate.getMonth());
        result.setDate(rule.day_of_month);
        if (result <= date) {
          result.setFullYear(result.getFullYear() + 1);
        }
      }
      break;
  }

  return result;
}

// Função auxiliar: Calcular próxima ocorrência baseada na frequência
function getNextOccurrence(date: Date, rule: RecurringRule): Date {
  const result = new Date(date);

  switch (rule.frequency) {
    case 'daily':
      result.setDate(result.getDate() + 1);
      break;

    case 'weekly':
      result.setDate(result.getDate() + 7);
      break;

    case 'monthly':
      result.setMonth(result.getMonth() + 1);
      // Manter o mesmo dia do mês (ou último dia se não existir)
      if (rule.day_of_month !== undefined) {
        result.setDate(rule.day_of_month);
      }
      break;

    case 'yearly':
      result.setFullYear(result.getFullYear() + 1);
      break;
  }

  return result;
}
