'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '../lib/currency-formatter';
import { Plus, Trash2, GripHorizontal } from 'lucide-react';
import { useCustomWidgets } from '../hooks/useCustomWidgets';
import { useParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';

interface CustomChart {
  id: string;
  title: string;
  chartType: 'bar' | 'line' | 'pie';
  xAxis: string;
  yAxis: string;
  groupBy?: string;
  filter?: {
    field: string;
    value: string;
  };
}

interface CustomChartBuilderProps {
  entries: any[];
}

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function CustomChartBuilder({ entries }: CustomChartBuilderProps) {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;
  const { widgets, createWidget, updateWidget, deleteWidget } = useCustomWidgets(workspaceId);

  // Filtrar apenas widgets do tipo 'chart'
  const chartWidgets = useMemo(() => {
    return widgets
      .filter((w) => w.widget_type === 'chart')
      .map((w) => ({
        id: w.id,
        title: w.title,
        chartType: w.config.chartType,
        xAxis: w.config.xAxis,
        yAxis: w.config.yAxis,
        groupBy: w.config.groupBy,
        filter: w.config.filter,
      }));
  }, [widgets]);

  const [editingChart, setEditingChart] = useState<string | null>(null);

  // Ref para armazenar referências aos cards de gráfico
  const chartRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Debounced callback para salvar dimensões no Supabase
  const handleResize = useDebouncedCallback((widgetId: string, width: number, height: number) => {
    updateWidget({
      widgetId,
      updates: { width, height },
    });
  }, 500);

  // Extrair categorias únicas
  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    entries.forEach(entry => {
      if (entry.category) categories.add(entry.category);
    });
    return Array.from(categories).sort();
  }, [entries]);

  // ResizeObserver para detectar redimensionamento dos gráficos
  useEffect(() => {
    const observers = new Map<string, ResizeObserver>();

    chartWidgets.forEach((chart) => {
      const element = chartRefs.current.get(chart.id);
      if (element) {
        const observer = new ResizeObserver((entries) => {
          const entry = entries[0];
          if (entry) {
            const { width, height } = entry.contentRect;
            handleResize(chart.id, Math.round(width), Math.round(height));
          }
        });
        observer.observe(element);
        observers.set(chart.id, observer);
      }
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [chartWidgets, handleResize]);

  const addChart = () => {
    createWidget({
      widgetType: 'chart',
      title: 'Novo Gráfico',
      config: {
        chartType: 'bar',
        xAxis: 'category',
        yAxis: 'amount',
      },
    });
  };

  const updateChart = (id: string, updates: Partial<CustomChart>) => {
    const widget = widgets.find(w => w.id === id);
    if (widget) {
      updateWidget({
        widgetId: id,
        updates: {
          title: updates.title,
          config: {
            ...widget.config,
            ...updates,
          },
        },
      });
    }
  };

  const handleDeleteChart = (id: string) => {
    deleteWidget(id);
  };

  const processChartData = (chart: CustomChart) => {
    let filteredEntries = entries;

    // Aplicar filtro se existir
    if (chart.filter) {
      filteredEntries = filteredEntries.filter(
        e => e[chart.filter!.field] === chart.filter!.value
      );
    }

    // Agrupar dados baseado no eixo X
    const grouped = new Map<string, number>();

    filteredEntries.forEach(entry => {
      const key = chart.xAxis === 'month'
        ? new Date(entry.date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
        : entry[chart.xAxis] || 'Sem categoria';

      const value = chart.yAxis === 'count' ? 1 : entry[chart.yAxis] || 0;

      grouped.set(key, (grouped.get(key) || 0) + value);
    });

    // Converter para array
    return Array.from(grouped.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const renderChart = (chart: CustomChart) => {
    const data = processChartData(chart);

    const CustomTooltip = ({ active, payload }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-card border rounded-lg p-3 shadow-lg">
            <p className="font-semibold text-card-foreground">{payload[0].name}</p>
            <p className="text-sm text-muted-foreground">
              {chart.yAxis === 'amount'
                ? formatCurrency(payload[0].value)
                : `${payload[0].value} lançamentos`}
            </p>
          </div>
        );
      }
      return null;
    };

    switch (chart.chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" tick={{ fill: 'currentColor' }} />
              <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" tick={{ fill: 'currentColor' }} />
              <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        );
    }
  };

  const renderChartEditor = (chart: CustomChart) => {
    return (
      <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
        <div className="space-y-2">
          <Label>Título do Gráfico</Label>
          <Input
            value={chart.title}
            onChange={(e) => updateChart(chart.id, { title: e.target.value })}
            placeholder="Nome do gráfico"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Tipo de Gráfico</Label>
            <Select
              value={chart.chartType}
              onValueChange={(value) =>
                updateChart(chart.id, { chartType: value as any })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Barra</SelectItem>
                <SelectItem value="line">Linha</SelectItem>
                <SelectItem value="pie">Pizza</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Eixo X (Agrupamento)</Label>
            <Select
              value={chart.xAxis}
              onValueChange={(value) => updateChart(chart.id, { xAxis: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="category">Categoria</SelectItem>
                <SelectItem value="type">Tipo</SelectItem>
                <SelectItem value="company">Empresa</SelectItem>
                <SelectItem value="month">Mês</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Eixo Y (Métrica)</Label>
            <Select
              value={chart.yAxis}
              onValueChange={(value) => updateChart(chart.id, { yAxis: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="amount">Valor (R$)</SelectItem>
                <SelectItem value="count">Contagem</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Filtrar por</Label>
            <Select
              value={chart.filter?.field || 'none'}
              onValueChange={(value) =>
                updateChart(chart.id, {
                  filter: value === 'none' ? undefined : { field: value, value: '' },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem filtro</SelectItem>
                <SelectItem value="type">Tipo</SelectItem>
                <SelectItem value="category">Categoria</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {chart.filter && (
            <div className="space-y-2">
              <Label>Valor do Filtro</Label>
              {chart.filter.field === 'category' ? (
                <>
                  <Input
                    type="text"
                    list="filter-category-options"
                    placeholder="Selecione ou digite uma categoria"
                    value={chart.filter.value}
                    onChange={(e) =>
                      updateChart(chart.id, {
                        filter: { ...chart.filter!, value: e.target.value },
                      })
                    }
                  />
                  <datalist id="filter-category-options">
                    {uniqueCategories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </>
              ) : (
                <Select
                  value={chart.filter.value}
                  onValueChange={(value) =>
                    updateChart(chart.id, {
                      filter: { ...chart.filter!, value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {chart.filter.field === 'type' && (
                      <>
                        <SelectItem value="income">Receita</SelectItem>
                        <SelectItem value="expense">Despesa</SelectItem>
                        <SelectItem value="investment">Investimento</SelectItem>
                        <SelectItem value="balance">Saldo</SelectItem>
                      </>
                    )}
                    {chart.filter.field === 'status' && (
                      <>
                        <SelectItem value="paid">Pago</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditingChart(null)}
          >
            Fechar
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Gráficos Personalizados</h2>
        <Button onClick={addChart} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Gráfico
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {chartWidgets.map(chart => {
          const widget = widgets.find(w => w.id === chart.id);
          const savedWidth = widget?.width;
          const savedHeight = widget?.height;

          return (
            <Card
              key={chart.id}
              ref={(el) => {
                if (el) {
                  chartRefs.current.set(chart.id, el);
                } else {
                  chartRefs.current.delete(chart.id);
                }
              }}
              className="resize overflow-auto min-w-[300px] min-h-[400px]"
              style={{
                resize: 'both',
                width: savedWidth ? `${savedWidth}px` : undefined,
                height: savedHeight ? `${savedHeight}px` : undefined,
              }}
            >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <GripHorizontal className="w-4 h-4 text-muted-foreground cursor-move" />
                <CardTitle className="text-base font-medium">{chart.title}</CardTitle>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setEditingChart(editingChart === chart.id ? null : chart.id)
                  }
                >
                  {editingChart === chart.id ? 'Ver' : 'Editar'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteChart(chart.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {editingChart === chart.id ? renderChartEditor(chart) : renderChart(chart)}
            </CardContent>
          </Card>
          );
        })}
      </div>
    </div>
  );
}
