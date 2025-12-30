'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Database } from '@/types/database.types';

const createWidgetSchema = z.object({
  workspaceId: z.string().uuid(),
  projectId: z.string().uuid().optional(),
  title: z.string().min(1, 'Título é obrigatório'),
  widgetType: z.string().default('chart'),
  chartType: z.enum(['bar', 'line', 'area', 'pie', 'donut']),
  dataSource: z.enum(['finance', 'tasks', 'projects', 'pages']),
  queryConfig: z.any().default({}),
  layout: z.any().default({}),
});

type Widget = Database['public']['Tables']['dashboard_widgets']['Row'];

export async function createWidget(data: z.infer<typeof createWidgetSchema>): Promise<Widget> {
  const supabase = await createServerClient();

  const validatedData = createWidgetSchema.parse(data);

  const { data: widget, error } = await supabase
    .from('dashboard_widgets')
    .insert({
      workspace_id: validatedData.workspaceId,
      project_id: validatedData.projectId,
      title: validatedData.title,
      widget_type: validatedData.widgetType,
      chart_type: validatedData.chartType,
      data_source: validatedData.dataSource,
      query_config: validatedData.queryConfig,
      layout: validatedData.layout,
    } as any)
    .select()
    .single<Widget>();

  if (error) {
    throw new Error(`Erro ao criar widget: ${error.message}`);
  }

  revalidatePath(`/${validatedData.workspaceId}/dashboard`);

  return widget;
}
