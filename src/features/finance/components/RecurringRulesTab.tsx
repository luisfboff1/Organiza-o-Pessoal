'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Play, Pause, Trash2, Edit, Repeat, CalendarPlus } from 'lucide-react';
import { useRecurringRules } from '../hooks/useRecurringRules';
import { RecurringRuleDialog } from './RecurringRuleDialog';
import { RecurringRule } from '../actions/recurring-rules';
import { formatCurrency } from '../lib/currency-formatter';

interface RecurringRulesTabProps {
  workspaceId: string;
  entries?: any[];
}

const FREQUENCY_LABELS = {
  daily: 'Diária',
  weekly: 'Semanal',
  monthly: 'Mensal',
  yearly: 'Anual',
};

const TYPE_LABELS = {
  income: 'Receita',
  expense: 'Despesa',
  investment: 'Investimento',
};

export function RecurringRulesTab({ workspaceId, entries = [] }: RecurringRulesTabProps) {
  const { rules, isLoading, toggleRule, deleteRule, regenerateEntries } = useRecurringRules(workspaceId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RecurringRule | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);

  const handleEdit = (rule: RecurringRule) => {
    setEditingRule(rule);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingRule(undefined);
    setDialogOpen(true);
  };

  const handleToggle = (ruleId: string, isActive: boolean) => {
    toggleRule({ ruleId, isActive: !isActive });
  };

  const handleDeleteClick = (ruleId: string) => {
    setRuleToDelete(ruleId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (ruleToDelete) {
      deleteRule(ruleToDelete);
      setRuleToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const handleRegenerateEntries = (ruleId: string) => {
    regenerateEntries({ ruleId, additionalMonths: 12 });
  };

  const getNextOccurrence = (rule: RecurringRule): string => {
    const today = new Date();
    const startDate = new Date(rule.start_date + 'T12:00:00');
    let next = new Date(Math.max(today.getTime(), startDate.getTime()));

    switch (rule.frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        if (rule.day_of_week !== undefined) {
          while (next.getDay() !== rule.day_of_week) {
            next.setDate(next.getDate() + 1);
          }
        }
        break;
      case 'monthly':
        if (rule.day_of_month !== undefined) {
          next.setDate(rule.day_of_month);
          if (next <= today) {
            next.setMonth(next.getMonth() + 1);
          }
        }
        break;
      case 'yearly':
        if (rule.day_of_month !== undefined) {
          next.setMonth(startDate.getMonth());
          next.setDate(rule.day_of_month);
          if (next <= today) {
            next.setFullYear(next.getFullYear() + 1);
          }
        }
        break;
    }

    return next.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400';
      case 'expense':
        return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400';
      case 'investment':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Carregando regras de recorrência...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Regras de Recorrência</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie lançamentos que se repetem automaticamente
          </p>
        </div>
        <div className="flex gap-2">
          {rules.length > 0 && rules.some(r => r.is_active) && (
            <Button
              variant="outline"
              onClick={() => {
                rules.filter(r => r.is_active).forEach(rule => {
                  handleRegenerateEntries(rule.id);
                });
              }}
            >
              <CalendarPlus className="w-4 h-4 mr-2" />
              Regenerar Todas
            </Button>
          )}
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Regra
          </Button>
        </div>
      </div>

      {rules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Repeat className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma regra criada</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Crie regras para gerar lançamentos recorrentes automaticamente
            </p>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Regra
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {rules.map((rule) => (
            <Card key={rule.id} className={!rule.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-base">{rule.title}</CardTitle>
                      <Badge variant="outline" className={getTypeColor(rule.type)}>
                        {TYPE_LABELS[rule.type]}
                      </Badge>
                      {!rule.is_active && (
                        <Badge variant="secondary">Pausada</Badge>
                      )}
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(rule.amount)}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(rule)}
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggle(rule.id, rule.is_active)}
                      title={rule.is_active ? 'Pausar' : 'Ativar'}
                    >
                      {rule.is_active ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    {rule.is_active && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRegenerateEntries(rule.id)}
                        title="Gerar +12 meses"
                      >
                        <CalendarPlus className="w-4 h-4 text-blue-500" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(rule.id)}
                      title="Deletar"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Categoria:</span>
                    <p className="font-medium">{rule.category}</p>
                  </div>
                  {rule.company && (
                    <div>
                      <span className="text-muted-foreground">Empresa:</span>
                      <p className="font-medium">{rule.company}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Frequência:</span>
                    <p className="font-medium">{FREQUENCY_LABELS[rule.frequency]}</p>
                  </div>
                  {rule.is_active && (
                    <div>
                      <span className="text-muted-foreground">Próxima:</span>
                      <p className="font-medium">{getNextOccurrence(rule)}</p>
                    </div>
                  )}
                </div>
                {rule.description && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Descrição:</span>
                    <p className="font-medium">{rule.description}</p>
                  </div>
                )}
                {rule.note && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Nota:</span>
                    <p className="text-muted-foreground italic">{rule.note}</p>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                  <span>Início: {new Date(rule.start_date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                  {rule.end_date && (
                    <>
                      <span>•</span>
                      <span>Fim: {new Date(rule.end_date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                    </>
                  )}
                  {!rule.end_date && (
                    <>
                      <span>•</span>
                      <span>Sem data final</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para criar/editar */}
      <RecurringRuleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workspaceId={workspaceId}
        rule={editingRule}
        entries={entries}
      />

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar regra de recorrência?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os lançamentos futuros pendentes
              gerados por esta regra serão removidos. Lançamentos já pagos permanecerão
              no histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-500 hover:bg-red-600">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
