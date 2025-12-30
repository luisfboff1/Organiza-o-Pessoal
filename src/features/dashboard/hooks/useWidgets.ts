'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWidgets } from '../actions/get-widgets';
import { createWidget } from '../actions/create-widget';
import { deleteWidget } from '../actions/delete-widget';
import { useToast } from '@/hooks/use-toast';

export function useWidgets(workspaceId: string, projectId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const widgetsQuery = useQuery({
    queryKey: ['widgets', workspaceId, projectId],
    queryFn: () => getWidgets(workspaceId, projectId),
  });

  const createMutation = useMutation({
    mutationFn: createWidget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['widgets'] });
      toast({
        title: 'Widget criado',
        description: 'O widget foi criado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar widget',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWidget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['widgets'] });
      toast({
        title: 'Widget deletado',
        description: 'O widget foi deletado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao deletar widget',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    widgets: widgetsQuery.data || [],
    isLoading: widgetsQuery.isLoading,
    createWidget: createMutation.mutate,
    deleteWidget: deleteMutation.mutate,
  };
}
