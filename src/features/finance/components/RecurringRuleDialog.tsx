'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useRecurringRules } from '../hooks/useRecurringRules';
import { RecurringRule } from '../actions/recurring-rules';

interface RecurringRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  rule?: RecurringRule;
  entries?: any[];
}

const FREQUENCY_LABELS = {
  daily: 'Diária',
  weekly: 'Semanal',
  monthly: 'Mensal',
  yearly: 'Anual',
};

const WEEKDAYS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
];

export function RecurringRuleDialog({
  open,
  onOpenChange,
  workspaceId,
  rule,
  entries = [],
}: RecurringRuleDialogProps) {
  const { createRule, updateRule } = useRecurringRules(workspaceId);

  // Extrair categorias únicas
  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    entries.forEach(entry => {
      if (entry.category) categories.add(entry.category);
    });
    return Array.from(categories).sort();
  }, [entries]);

  // Extrair empresas únicas
  const uniqueCompanies = useMemo(() => {
    const companies = new Set<string>();
    entries.forEach(entry => {
      if (entry.company) companies.add(entry.company);
    });
    return Array.from(companies).sort();
  }, [entries]);

  const [formData, setFormData] = useState({
    title: '',
    type: 'expense' as 'income' | 'expense' | 'investment',
    category: '',
    amount: '',
    company: '',
    description: '',
    note: '',
    frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    day_of_month: '1',
    day_of_week: '1',
  });

  // Preencher formulário se estiver editando
  useEffect(() => {
    if (rule) {
      setFormData({
        title: rule.title,
        type: rule.type,
        category: rule.category,
        amount: rule.amount.toString(),
        company: rule.company || '',
        description: rule.description || '',
        note: rule.note || '',
        frequency: rule.frequency,
        start_date: rule.start_date,
        end_date: rule.end_date || '',
        day_of_month: rule.day_of_month?.toString() || '1',
        day_of_week: rule.day_of_week?.toString() || '1',
      });
    }
  }, [rule]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      title: formData.title,
      type: formData.type,
      category: formData.category,
      amount: parseFloat(formData.amount),
      company: formData.company || undefined,
      description: formData.description || undefined,
      note: formData.note || undefined,
      frequency: formData.frequency,
      start_date: formData.start_date,
      end_date: formData.end_date || undefined,
      day_of_month: formData.frequency === 'monthly' || formData.frequency === 'yearly'
        ? parseInt(formData.day_of_month)
        : undefined,
      day_of_week: formData.frequency === 'weekly'
        ? parseInt(formData.day_of_week)
        : undefined,
    };

    if (rule) {
      updateRule({ ruleId: rule.id, updates: data });
    } else {
      createRule(data);
    }

    // Resetar formulário
    setFormData({
      title: '',
      type: 'expense',
      category: '',
      amount: '',
      company: '',
      description: '',
      note: '',
      frequency: 'monthly',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      day_of_month: '1',
      day_of_week: '1',
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {rule ? 'Editar Regra de Recorrência' : 'Nova Regra de Recorrência'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Título */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                type="text"
                placeholder="Ex: Aluguel, Salário, Netflix..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            {/* Tipo */}
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
                </SelectContent>
              </Select>
            </div>

            {/* Valor */}
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Input
                id="category"
                type="text"
                list="category-options"
                placeholder="Ex: Moradia, Alimentação..."
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              />
              <datalist id="category-options">
                {uniqueCategories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>

            {/* Empresa */}
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
            </div>

            {/* Descrição */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                type="text"
                placeholder="Descrição curta..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Nota */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="note">Observações</Label>
              <Textarea
                id="note"
                placeholder="Observações adicionais..."
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">Configuração de Recorrência</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Frequência */}
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequência *</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}
                >
                  <SelectTrigger id="frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diária</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dia da semana (apenas para semanal) */}
              {formData.frequency === 'weekly' && (
                <div className="space-y-2">
                  <Label htmlFor="day_of_week">Dia da Semana *</Label>
                  <Select
                    value={formData.day_of_week}
                    onValueChange={(value) => setFormData({ ...formData, day_of_week: value })}
                  >
                    <SelectTrigger id="day_of_week">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WEEKDAYS.map((day) => (
                        <SelectItem key={day.value} value={day.value.toString()}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Dia do mês (para mensal e anual) */}
              {(formData.frequency === 'monthly' || formData.frequency === 'yearly') && (
                <div className="space-y-2">
                  <Label htmlFor="day_of_month">Dia do Mês *</Label>
                  <Input
                    id="day_of_month"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.day_of_month}
                    onChange={(e) => setFormData({ ...formData, day_of_month: e.target.value })}
                    required
                  />
                </div>
              )}

              {/* Data de início */}
              <div className="space-y-2">
                <Label htmlFor="start_date">Data de Início *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>

              {/* Data de fim */}
              <div className="space-y-2">
                <Label htmlFor="end_date">Data de Fim (opcional)</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Deixe vazio para recorrência sem fim
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {rule ? 'Atualizar' : 'Criar'} Regra
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
