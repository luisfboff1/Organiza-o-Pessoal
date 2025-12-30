'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';

interface CreateWidgetDialogProps {
  workspaceId: string;
  onCreateWidget: (data: any) => void;
}

export function CreateWidgetDialog({ workspaceId, onCreateWidget }: CreateWidgetDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area' | 'pie' | 'donut'>('bar');
  const [dataSource, setDataSource] = useState<'finance' | 'tasks' | 'projects' | 'pages'>('finance');
  const [groupBy, setGroupBy] = useState('category');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onCreateWidget({
      workspaceId,
      title,
      chartType,
      dataSource,
      queryConfig: { groupBy },
    });

    // Reset form
    setTitle('');
    setChartType('bar');
    setDataSource('finance');
    setGroupBy('category');
    setOpen(false);
  };

  const getGroupByOptions = () => {
    switch (dataSource) {
      case 'finance':
        return [
          { value: 'category', label: 'Por Categoria' },
          { value: 'type', label: 'Por Tipo (Receita/Despesa)' },
        ];
      case 'tasks':
        return [
          { value: 'status', label: 'Por Status' },
          { value: 'priority', label: 'Por Prioridade' },
        ];
      case 'projects':
        return [{ value: 'status', label: 'Por Status' }];
      case 'pages':
        return [{ value: 'month', label: 'Por Mês' }];
      default:
        return [];
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Novo Widget
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Novo Widget</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome do widget"
              required
            />
          </div>

          <div>
            <Label htmlFor="chartType">Tipo de Gráfico</Label>
            <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Barras</SelectItem>
                <SelectItem value="line">Linha</SelectItem>
                <SelectItem value="area">Área</SelectItem>
                <SelectItem value="pie">Pizza</SelectItem>
                <SelectItem value="donut">Rosquinha</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="dataSource">Fonte de Dados</Label>
            <Select
              value={dataSource}
              onValueChange={(value: any) => {
                setDataSource(value);
                setGroupBy(getGroupByOptions()[0]?.value || 'category');
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="finance">Financeiro</SelectItem>
                <SelectItem value="tasks">Tasks</SelectItem>
                <SelectItem value="projects">Projetos</SelectItem>
                <SelectItem value="pages">Páginas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="groupBy">Agrupar Por</Label>
            <Select value={groupBy} onValueChange={setGroupBy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getGroupByOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Criar Widget</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
