'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCustomWidgets } from '../hooks/useCustomWidgets';

interface FinanceWidgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  entries?: any[];
}

export function FinanceWidgetDialog({
  open,
  onOpenChange,
  workspaceId,
  entries = [],
}: FinanceWidgetDialogProps) {
  const { createWidget } = useCustomWidgets(workspaceId);

  // Extrair categorias únicas das entradas
  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    entries.forEach(entry => {
      if (entry.category) {
        categories.add(entry.category);
      }
    });
    return Array.from(categories).sort();
  }, [entries]);

  // Extrair empresas únicas
  const uniqueCompanies = useMemo(() => {
    const companies = new Set<string>();
    entries.forEach(entry => {
      if (entry.company) {
        companies.add(entry.company);
      }
    });
    return Array.from(companies).sort();
  }, [entries]);

  const [formData, setFormData] = useState({
    title: '',
    type: 'expense' as 'income' | 'expense' | 'investment' | 'balance',
    category: '',
    company: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createWidget({
      widgetType: 'summary',
      title: formData.title,
      config: {
        type: formData.type,
        filters: {
          category: formData.category || undefined,
          company: formData.company || undefined,
          description: formData.description || undefined,
        },
      },
    });

    // Resetar formulário
    setFormData({
      title: '',
      type: 'expense',
      category: '',
      company: '',
      description: '',
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Widget Personalizado</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título do Widget *</Label>
            <Input
              id="title"
              type="text"
              placeholder="Ex: Cartão de Crédito, Supermercado, etc."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo *</Label>
            <Select
              value={formData.type}
              onValueChange={(value: any) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Receita</SelectItem>
                <SelectItem value="expense">Despesa</SelectItem>
                <SelectItem value="investment">Investimento</SelectItem>
                <SelectItem value="balance">Saldo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">Filtros (opcional - deixe em branco para mostrar tudo)</p>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  type="text"
                  list="category-options"
                  placeholder="Ex: Alimentação, Transporte..."
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
                <datalist id="category-options">
                  {uniqueCategories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
                {uniqueCategories.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Selecione uma categoria existente ou digite uma nova
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Empresa</Label>
                <Input
                  id="company"
                  type="text"
                  list="company-options"
                  placeholder="Ex: Nubank, Itaú..."
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
                <datalist id="company-options">
                  {uniqueCompanies.map((comp) => (
                    <option key={comp} value={comp} />
                  ))}
                </datalist>
                {uniqueCompanies.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Selecione uma empresa existente ou digite uma nova
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição (contém)</Label>
                <Input
                  id="description"
                  type="text"
                  placeholder="Ex: Uber, Ifood..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Criar Widget</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
