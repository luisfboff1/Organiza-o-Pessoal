'use server';

import { createServerClient } from '@/lib/supabase/server';

export interface CustomWidget {
  id: string;
  workspace_id: string;
  user_id: string;
  widget_type: 'summary' | 'chart';
  title: string;
  config: any;
  width: number;
  height: number;
  position: number;
  created_at: string;
  updated_at: string;
}

export async function getCustomWidgets(workspaceId: string) {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('finance_custom_widgets')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('position', { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar widgets: ${error.message}`);
  }

  return data as CustomWidget[];
}

export async function createCustomWidget(
  workspaceId: string,
  widgetType: 'summary' | 'chart',
  title: string,
  config: any,
  width: number = 1,
  height: number = 1
) {
  const supabase = await createServerClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  // Get max position
  const { data: widgets } = await supabase
    .from('finance_custom_widgets')
    .select('position')
    .eq('workspace_id', workspaceId)
    .order('position', { ascending: false })
    .limit(1);

  const nextPosition = widgets && widgets.length > 0 ? widgets[0].position + 1 : 0;

  const { data, error } = await supabase
    .from('finance_custom_widgets')
    .insert({
      workspace_id: workspaceId,
      user_id: user.id,
      widget_type: widgetType,
      title,
      config,
      width,
      height,
      position: nextPosition,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar widget: ${error.message}`);
  }

  return data as CustomWidget;
}

export async function updateCustomWidget(
  widgetId: string,
  updates: {
    title?: string;
    config?: any;
    width?: number;
    height?: number;
    position?: number;
  }
) {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('finance_custom_widgets')
    .update(updates)
    .eq('id', widgetId)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar widget: ${error.message}`);
  }

  return data as CustomWidget;
}

export async function deleteCustomWidget(widgetId: string) {
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('finance_custom_widgets')
    .delete()
    .eq('id', widgetId);

  if (error) {
    throw new Error(`Erro ao deletar widget: ${error.message}`);
  }
}
