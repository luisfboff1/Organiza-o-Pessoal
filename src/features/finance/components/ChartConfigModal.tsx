'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';

interface ChartConfig {
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

interface ChartConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: ChartConfig | null;
  onSave: (config: Partial<ChartConfig>) => void;
  uniqueCategories: string[];
}

const COLOR_PRESETS = {
  blue: { primary: '#3b82f6', secondary: '#93c5fd', label: 'Azul' },
  green: { primary: '#10b981', secondary: '#6ee7b7', label: 'Verde' },
  purple: { primary: '#8b5cf6', secondary: '#c4b5fd', label: 'Roxo' },
  orange: { primary: '#f59e0b', secondary: '#fcd34d', label: 'Laranja' },
  red: { primary: '#ef4444', secondary: '#fca5a5', label: 'Vermelho' },
  pink: { primary: '#ec4899', secondary: '#f9a8d4', label: 'Rosa' },
  teal: { primary: '#14b8a6', secondary: '#5eead4', label: 'Azul-turquesa' },
  indigo: { primary: '#6366f1', secondary: '#a5b4fc', label: 'Índigo' },
};

export function ChartConfigModal({
  open,
  onOpenChange,
  config,
  onSave,
  uniqueCategories,
}: ChartConfigModalProps) {
  const [title, setTitle] = useState('');
  const [chartType, setChartType] = useState<ChartConfig['chartType']>('bar');
  const [xAxis, setXAxis] = useState('category');
  const [yAxis, setYAxis] = useState('amount');
  const [colorPreset, setColorPreset] = useState('blue');
  const [customPrimary, setCustomPrimary] = useState('#3b82f6');
  const [customSecondary, setCustomSecondary] = useState('#93c5fd');
  const [useCustomColors, setUseCustomColors] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [height, setHeight] = useState([300]);
  const [filterField, setFilterField] = useState('none');
  const [filterValue, setFilterValue] = useState('');

  useEffect(() => {
    if (config) {
      setTitle(config.title);
      setChartType(config.chartType);
      setXAxis(config.xAxis);
      setYAxis(config.yAxis);
      setShowGrid(config.showGrid ?? true);
      setShowLegend(config.showLegend ?? true);
      setHeight([config.height ?? 300]);
      setFilterField(config.filter?.field || 'none');
      setFilterValue(config.filter?.value || '');

      // Detectar se usa cores customizadas ou preset
      if (config.colors) {
        const preset = Object.entries(COLOR_PRESETS).find(
          ([_, colors]) => colors.primary === config.colors?.primary
        );
        if (preset) {
          setColorPreset(preset[0]);
          setUseCustomColors(false);
        } else {
          setUseCustomColors(true);
          setCustomPrimary(config.colors.primary);
          setCustomSecondary(config.colors.secondary || '#93c5fd');
        }
      }
    }
  }, [config]);

  const handleSave = () => {
    const colors = useCustomColors
      ? { primary: customPrimary, secondary: customSecondary }
      : COLOR_PRESETS[colorPreset as keyof typeof COLOR_PRESETS];

    onSave({
      title,
      chartType,
      xAxis,
      yAxis,
      colors,
      showGrid,
      showLegend,
      height: height[0],
      filter: filterField === 'none' ? undefined : { field: filterField, value: filterValue },
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Gráfico</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título do Gráfico</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Digite o título"
            />
          </div>

          {/* Tipo de Gráfico */}
          <div className="space-y-2">
            <Label htmlFor="chartType">Tipo de Gráfico</Label>
            <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
              <SelectTrigger id="chartType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Barras</SelectItem>
                <SelectItem value="line">Linha</SelectItem>
                <SelectItem value="area">Área</SelectItem>
                <SelectItem value="pie">Pizza</SelectItem>
                <SelectItem value="composed">Combinado (Linha + Barra)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Eixos (não mostrar para pie) */}
          {chartType !== 'pie' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="xAxis">Eixo X (Agrupamento)</Label>
                <Select value={xAxis} onValueChange={setXAxis}>
                  <SelectTrigger id="xAxis">
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
                <Label htmlFor="yAxis">Eixo Y (Métrica)</Label>
                <Select value={yAxis} onValueChange={setYAxis}>
                  <SelectTrigger id="yAxis">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amount">Valor (R$)</SelectItem>
                    <SelectItem value="count">Contagem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Cores */}
          <div className="space-y-3">
            <Label>Cores</Label>
            <div className="flex items-center gap-2">
              <Switch checked={useCustomColors} onCheckedChange={setUseCustomColors} />
              <span className="text-sm">Usar cores personalizadas</span>
            </div>

            {useCustomColors ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Cor Primária</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={customPrimary}
                      onChange={(e) => setCustomPrimary(e.target.value)}
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={customPrimary}
                      onChange={(e) => setCustomPrimary(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Cor Secundária</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={customSecondary}
                      onChange={(e) => setCustomSecondary(e.target.value)}
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={customSecondary}
                      onChange={(e) => setCustomSecondary(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {Object.entries(COLOR_PRESETS).map(([key, colors]) => (
                  <button
                    key={key}
                    onClick={() => setColorPreset(key)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      colorPreset === key
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex gap-1 mb-1">
                      <div
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: colors.primary }}
                      />
                      <div
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: colors.secondary }}
                      />
                    </div>
                    <span className="text-xs">{colors.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Opções de exibição */}
          {chartType !== 'pie' && (
            <div className="space-y-3">
              <Label>Opções de Exibição</Label>
              <div className="flex items-center justify-between">
                <span className="text-sm">Mostrar Grid</span>
                <Switch checked={showGrid} onCheckedChange={setShowGrid} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Mostrar Legenda</span>
                <Switch checked={showLegend} onCheckedChange={setShowLegend} />
              </div>
            </div>
          )}

          {/* Altura */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="height">Altura do Gráfico</Label>
              <span className="text-sm text-muted-foreground">{height[0]}px</span>
            </div>
            <Slider
              id="height"
              min={250}
              max={500}
              step={50}
              value={height}
              onValueChange={setHeight}
            />
          </div>

          {/* Filtros */}
          <div className="space-y-3">
            <Label>Filtros</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="filterField">Filtrar por</Label>
                <Select value={filterField} onValueChange={setFilterField}>
                  <SelectTrigger id="filterField">
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

              {filterField !== 'none' && (
                <div className="space-y-2">
                  <Label htmlFor="filterValue">Valor do Filtro</Label>
                  {filterField === 'category' ? (
                    <>
                      <Input
                        id="filterValue"
                        type="text"
                        list="filter-category-options"
                        placeholder="Selecione ou digite"
                        value={filterValue}
                        onChange={(e) => setFilterValue(e.target.value)}
                      />
                      <datalist id="filter-category-options">
                        {uniqueCategories.map((cat) => (
                          <option key={cat} value={cat} />
                        ))}
                      </datalist>
                    </>
                  ) : (
                    <Select value={filterValue} onValueChange={setFilterValue}>
                      <SelectTrigger id="filterValue">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {filterField === 'type' && (
                          <>
                            <SelectItem value="income">Receita</SelectItem>
                            <SelectItem value="expense">Despesa</SelectItem>
                            <SelectItem value="investment">Investimento</SelectItem>
                            <SelectItem value="balance">Saldo</SelectItem>
                          </>
                        )}
                        {filterField === 'status' && (
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
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
