'use client';

import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  ComposedChart,
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
import { Plus, Trash2, Settings2 } from 'lucide-react';
import { useCustomWidgets } from '../hooks/useCustomWidgets';
import { useParams } from 'next/navigation';
import { ChartConfigModal } from './ChartConfigModal';

interface CustomChart {
  id: string;
  title: string;
  chartType: 'bar' | 'line' | 'pie' | 'area' | 'composed';
  xAxis: string;
  yAxis: string;
  colors?: {
    primary: string;
    secondary?: string;
  };
  showGrid?: boolean;
  showLegend?: boolean;
  height?: number;
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
        colors: w.config.colors,
        showGrid: w.config.showGrid,
        showLegend: w.config.showLegend,
        height: w.config.height,
        filter: w.config.filter,
      }));
  }, [widgets]);

  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [editingChart, setEditingChart] = useState<CustomChart | null>(null);

  // Extrair categorias únicas
  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    entries.forEach(entry => {
      if (entry.category) categories.add(entry.category);
    });
    return Array.from(categories).sort();
  }, [entries]);

  const addChart = () => {
    createWidget({
      widgetType: 'chart',
      title: 'Novo Gráfico',
      config: {
        chartType: 'bar',
        xAxis: 'category',
        yAxis: 'amount',
        colors: {
          primary: '#3b82f6',
          secondary: '#93c5fd',
        },
        showGrid: true,
        showLegend: true,
        height: 300,
      },
    });
  };

  const handleOpenConfig = (chart: CustomChart) => {
    setEditingChart(chart);
    setConfigModalOpen(true);
  };

  const handleSaveConfig = (updates: Partial<CustomChart>) => {
    if (!editingChart) return;

    const widget = widgets.find(w => w.id === editingChart.id);
    if (widget) {
      updateWidget({
        widgetId: editingChart.id,
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
    const chartHeight = chart.height || 300;
    const primaryColor = chart.colors?.primary || '#3b82f6';
    const secondaryColor = chart.colors?.secondary || '#93c5fd';
    const showGrid = chart.showGrid ?? true;
    const showLegend = chart.showLegend ?? true;

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
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={data}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
              <XAxis dataKey="name" className="text-xs" tick={{ fill: 'currentColor' }} />
              <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
              <Bar dataKey="value" fill={primaryColor} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart data={data}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
              <XAxis dataKey="name" className="text-xs" tick={{ fill: 'currentColor' }} />
              <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
              <Line
                type="monotone"
                dataKey="value"
                stroke={primaryColor}
                strokeWidth={2}
                dot={{ r: 4, fill: primaryColor }}
                activeDot={{ r: 6, fill: primaryColor }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <AreaChart data={data}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
              <XAxis dataKey="name" className="text-xs" tick={{ fill: 'currentColor' }} />
              <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
              <Area
                type="monotone"
                dataKey="value"
                stroke={primaryColor}
                fill={primaryColor}
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'composed':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <ComposedChart data={data}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
              <XAxis dataKey="name" className="text-xs" tick={{ fill: 'currentColor' }} />
              <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
              <Line
                type="monotone"
                dataKey="value"
                stroke={primaryColor}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Bar dataKey="value" fill={secondaryColor} radius={[4, 4, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
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
              {showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );
    }
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
          return (
            <Card key={chart.id} className="overflow-auto">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">{chart.title}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenConfig(chart)}
                  >
                    <Settings2 className="w-4 h-4" />
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
                {renderChart(chart)}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal de Configuração */}
      <ChartConfigModal
        open={configModalOpen}
        onOpenChange={setConfigModalOpen}
        config={editingChart}
        onSave={handleSaveConfig}
        uniqueCategories={uniqueCategories}
      />
    </div>
  );
}
