'use server';

import { createServerClient } from '@/lib/supabase/server';

export async function getChartData(workspaceId: string, dataSource: string, queryConfig: any) {
  const supabase = await createServerClient();

  switch (dataSource) {
    case 'finance':
      return getFinanceChartData(supabase, workspaceId, queryConfig);
    case 'tasks':
      return getTasksChartData(supabase, workspaceId, queryConfig);
    case 'projects':
      return getProjectsChartData(supabase, workspaceId, queryConfig);
    case 'pages':
      return getPagesChartData(supabase, workspaceId, queryConfig);
    default:
      throw new Error('Fonte de dados inválida');
  }
}

async function getFinanceChartData(supabase: any, workspaceId: string, config: any) {
  const groupBy = config.groupBy || 'category'; // category, month, type

  if (groupBy === 'category') {
    const { data, error } = await supabase
      .from('finance_entries')
      .select('category, type, amount')
      .eq('workspace_id', workspaceId);

    if (error) throw new Error(error.message);

    // Agrupar por categoria
    const grouped = data.reduce((acc: any, entry: any) => {
      if (!acc[entry.category]) {
        acc[entry.category] = { income: 0, expense: 0 };
      }
      if (entry.type === 'income') {
        acc[entry.category].income += parseFloat(entry.amount);
      } else {
        acc[entry.category].expense += parseFloat(entry.amount);
      }
      return acc;
    }, {});

    return Object.entries(grouped).map(([category, values]: [string, any]) => ({
      name: category,
      Receita: values.income,
      Despesa: values.expense,
    }));
  }

  if (groupBy === 'type') {
    const { data, error } = await supabase
      .from('finance_entries')
      .select('type, amount')
      .eq('workspace_id', workspaceId);

    if (error) throw new Error(error.message);

    const income = data
      .filter((e: any) => e.type === 'income')
      .reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0);

    const expense = data
      .filter((e: any) => e.type === 'expense')
      .reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0);

    return [
      { name: 'Receita', value: income },
      { name: 'Despesa', value: expense },
    ];
  }

  return [];
}

async function getTasksChartData(supabase: any, workspaceId: string, config: any) {
  const groupBy = config.groupBy || 'status'; // status, priority, project

  const { data, error } = await supabase
    .from('tasks')
    .select('status, priority')
    .eq('workspace_id', workspaceId);

  if (error) throw new Error(error.message);

  if (groupBy === 'status') {
    const grouped = data.reduce((acc: any, task: any) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped).map(([status, count]) => ({
      name: status === 'todo' ? 'A Fazer' : status === 'doing' ? 'Fazendo' : 'Feito',
      value: count,
    }));
  }

  if (groupBy === 'priority') {
    const grouped = data.reduce((acc: any, task: any) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped).map(([priority, count]) => ({
      name: `P${priority}`,
      value: count,
    }));
  }

  return [];
}

async function getProjectsChartData(supabase: any, workspaceId: string, config: any) {
  const { data, error } = await supabase
    .from('projects')
    .select('status')
    .eq('workspace_id', workspaceId);

  if (error) throw new Error(error.message);

  const grouped = data.reduce((acc: any, project: any) => {
    acc[project.status] = (acc[project.status] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(grouped).map(([status, count]) => ({
    name: status === 'backlog' ? 'Backlog' : status === 'in_progress' ? 'Em Progresso' : 'Concluído',
    value: count,
  }));
}

async function getPagesChartData(supabase: any, workspaceId: string, config: any) {
  const { data, error } = await supabase
    .from('pages')
    .select('created_at')
    .eq('workspace_id', workspaceId)
    .eq('archived', false);

  if (error) throw new Error(error.message);

  // Agrupar por mês
  const grouped = data.reduce((acc: any, page: any) => {
    const month = new Date(page.created_at).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
    });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(grouped).map(([month, count]) => ({
    name: month,
    value: count,
  }));
}
