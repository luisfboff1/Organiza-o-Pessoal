'use server';

import { createServerClient } from '@/lib/supabase/server';
import { FinanceEntry, FinanceSummary } from '../types';

interface GetEntriesOptions {
  workspaceId: string;
  startDate?: string;
  endDate?: string;
  category?: string;
  type?: 'income' | 'expense' | 'investment' | 'balance';
  projectId?: string;
}

export async function getFinanceEntries(options: GetEntriesOptions): Promise<FinanceEntry[]> {
  const supabase = await createServerClient();

  let query = supabase
    .from('finance_entries')
    .select(`
      *,
      projects(id, title),
      pages(id, title)
    `)
    .eq('workspace_id', options.workspaceId)
    .order('date', { ascending: false });

  if (options.startDate) {
    query = query.gte('date', options.startDate);
  }

  if (options.endDate) {
    query = query.lte('date', options.endDate);
  }

  if (options.category) {
    query = query.eq('category', options.category);
  }

  if (options.type) {
    query = query.eq('type', options.type);
  }

  if (options.projectId) {
    query = query.eq('project_id', options.projectId);
  }

  const { data: entries, error } = await query;

  if (error) {
    throw new Error(`Erro ao buscar lançamentos: ${error.message}`);
  }

  return entries;
}

export async function getFinanceSummary(workspaceId: string, startDate?: string, endDate?: string): Promise<FinanceSummary> {
  const supabase = await createServerClient();

  // Buscar entradas do período para o resumo (TODAS, sem filtrar por status)
  let query = supabase
    .from('finance_entries')
    .select('type, amount, status')
    .eq('workspace_id', workspaceId);

  if (startDate) {
    query = query.gte('date', startDate);
  }

  if (endDate) {
    query = query.lte('date', endDate);
  }

  const { data: entries, error } = await query;

  if (error) {
    throw new Error(`Erro ao buscar resumo financeiro: ${error.message}`);
  }

  const income = entries
    .filter((e: any) => e.type === 'income' || e.type === 'balance')
    .reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0);

  const expense = entries
    .filter((e: any) => e.type === 'expense')
    .reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0);

  const investment = entries
    .filter((e: any) => e.type === 'investment')
    .reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0);

  // Buscar TODAS as entradas até hoje para calcular saldo total (APENAS PAGAS)
  const today = new Date().toISOString().split('T')[0];
  const { data: allEntries } = await supabase
    .from('finance_entries')
    .select('type, amount, status')
    .eq('workspace_id', workspaceId)
    .eq('status', 'paid')
    .lte('date', today)
    .order('date', { ascending: true });

  const totalIncome = (allEntries || [])
    .filter((e: any) => e.type === 'income' || e.type === 'balance')
    .reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0);

  const totalExpense = (allEntries || [])
    .filter((e: any) => e.type === 'expense')
    .reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0);

  const totalInvestment = (allEntries || [])
    .filter((e: any) => e.type === 'investment')
    .reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0);

  return {
    income,
    expense,
    investment,
    balance: income - expense - investment,
    totalBalance: totalIncome - totalExpense - totalInvestment,
  };
}
