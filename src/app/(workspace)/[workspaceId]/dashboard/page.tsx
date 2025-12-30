'use client';

import { use } from 'react';
import { useWidgets } from '@/features/dashboard/hooks/useWidgets';
import { WidgetCard } from '@/features/dashboard/components/WidgetCard';
import { CreateWidgetDialog } from '@/features/dashboard/components/CreateWidgetDialog';

export default function DashboardPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = use(params);
  const { widgets, isLoading, createWidget, deleteWidget } = useWidgets(workspaceId);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">Carregando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b p-3 md:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-xl md:text-2xl font-bold">Dashboard</h1>
        <CreateWidgetDialog workspaceId={workspaceId} onCreateWidget={createWidget} />
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        {widgets.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="mb-4">Nenhum widget criado ainda.</p>
            <p className="text-sm">Clique em "Novo Widget" para criar seu primeiro gráfico.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {widgets.map((widget) => (
              <WidgetCard
                key={widget.id}
                widget={widget}
                workspaceId={workspaceId}
                onDelete={(widgetId) => deleteWidget({ widgetId, workspaceId })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
