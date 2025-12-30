'use client';

import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { ChartRenderer } from './ChartRenderer';
import { useChartData } from '../hooks/useChartData';

interface WidgetCardProps {
  widget: any;
  workspaceId: string;
  onDelete: (widgetId: string) => void;
}

export function WidgetCard({ widget, workspaceId, onDelete }: WidgetCardProps) {
  const { data, isLoading } = useChartData(workspaceId, widget.data_source, widget.query_config);

  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-card-foreground">{widget.title}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (confirm('Tem certeza que deseja deletar este widget?')) {
              onDelete(widget.id);
            }
          }}
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>
      ) : (
        <ChartRenderer chartType={widget.chart_type} data={data} dataSource={widget.data_source} />
      )}
    </div>
  );
}
