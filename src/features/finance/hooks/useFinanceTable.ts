'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFinanceEntries, getFinanceSummary } from '../actions/get-entries';
import { createFinanceEntry } from '../actions/create-entry';
import { updateFinanceEntry } from '../actions/update-entry';
import { deleteFinanceEntry } from '../actions/delete-entry';
import { useToast } from '@/hooks/use-toast';

interface UseFinanceTableOptions {
  workspaceId: string;
  startDate?: string;
  endDate?: string;
  category?: string;
  type?: 'income' | 'expense';
  projectId?: string;
}

export function useFinanceTable(options: UseFinanceTableOptions) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const entriesQuery = useQuery({
    queryKey: ['finance-entries', options],
    queryFn: () => getFinanceEntries(options),
  });

  const summaryQuery = useQuery({
    queryKey: ['finance-summary', options.workspaceId, options.startDate, options.endDate],
    queryFn: () => getFinanceSummary(options.workspaceId, options.startDate, options.endDate),
  });

  const createMutation = useMutation({
    mutationFn: createFinanceEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-entries'] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary'] });
      toast({
        title: 'Lançamento criado',
        description: 'O lançamento foi criado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar lançamento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateFinanceEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-entries'] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar lançamento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFinanceEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-entries'] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary'] });
      toast({
        title: 'Lançamento deletado',
        description: 'O lançamento foi deletado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao deletar lançamento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    entries: entriesQuery.data || [],
    summary: summaryQuery.data || { income: 0, expense: 0, investment: 0, balance: 0, totalBalance: 0 },
    isLoading: entriesQuery.isLoading || summaryQuery.isLoading,
    createEntry: createMutation.mutate,
    updateEntry: updateMutation.mutate,
    deleteEntry: deleteMutation.mutate,
  };
}
