'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  getRecurringRules,
  createRecurringRule,
  updateRecurringRule,
  deleteRecurringRule,
  toggleRecurringRule,
  regenerateEntriesFromRule,
  RecurringRule,
} from '../actions/recurring-rules';

export function useRecurringRules(workspaceId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar regras
  const rulesQuery = useQuery({
    queryKey: ['recurring-rules', workspaceId],
    queryFn: () => getRecurringRules(workspaceId),
  });

  // Criar regra
  const createMutation = useMutation({
    mutationFn: (data: {
      title: string;
      amount: number;
      type: 'income' | 'expense' | 'investment';
      category: string;
      company?: string;
      description?: string;
      note?: string;
      frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
      start_date: string;
      end_date?: string;
      day_of_month?: number;
      day_of_week?: number;
    }) => createRecurringRule(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-rules', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['finance-entries', workspaceId] });
      toast({
        title: 'Regra criada',
        description: 'Lançamentos futuros foram gerados automaticamente',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar regra',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Atualizar regra
  const updateMutation = useMutation({
    mutationFn: ({ ruleId, updates }: { ruleId: string; updates: Partial<RecurringRule> }) =>
      updateRecurringRule(ruleId, workspaceId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-rules', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['finance-entries', workspaceId] });
      toast({
        title: 'Regra atualizada',
        description: 'Lançamentos futuros foram atualizados',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar regra',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Deletar regra
  const deleteMutation = useMutation({
    mutationFn: (ruleId: string) => deleteRecurringRule(ruleId, workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-rules', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['finance-entries', workspaceId] });
      toast({
        title: 'Regra deletada',
        description: 'Lançamentos futuros pendentes foram removidos',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao deletar regra',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Ativar/desativar regra
  const toggleMutation = useMutation({
    mutationFn: ({ ruleId, isActive }: { ruleId: string; isActive: boolean }) =>
      toggleRecurringRule(ruleId, workspaceId, isActive),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recurring-rules', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['finance-entries', workspaceId] });
      toast({
        title: variables.isActive ? 'Regra ativada' : 'Regra pausada',
        description: variables.isActive
          ? 'Lançamentos futuros foram gerados'
          : 'Lançamentos futuros pendentes foram removidos',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao alterar status da regra',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Regenerar lançamentos (gerar mais meses)
  const regenerateMutation = useMutation({
    mutationFn: ({ ruleId, additionalMonths }: { ruleId: string; additionalMonths?: number }) =>
      regenerateEntriesFromRule(ruleId, workspaceId, additionalMonths),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recurring-rules', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['finance-entries', workspaceId] });
      toast({
        title: 'Lançamentos gerados',
        description: `${variables.additionalMonths || 12} meses adicionais foram gerados`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao gerar lançamentos',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    rules: rulesQuery.data || [],
    isLoading: rulesQuery.isLoading,
    createRule: createMutation.mutate,
    updateRule: updateMutation.mutate,
    deleteRule: deleteMutation.mutate,
    toggleRule: toggleMutation.mutate,
    regenerateEntries: regenerateMutation.mutate,
  };
}
