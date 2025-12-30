'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  getCustomWidgets,
  createCustomWidget,
  updateCustomWidget,
  deleteCustomWidget,
  CustomWidget,
} from '../actions/custom-widgets';

export function useCustomWidgets(workspaceId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const widgetsQuery = useQuery({
    queryKey: ['custom-widgets', workspaceId],
    queryFn: () => getCustomWidgets(workspaceId),
  });

  const createMutation = useMutation({
    mutationFn: ({
      widgetType,
      title,
      config,
      width,
      height,
    }: {
      widgetType: 'summary' | 'chart';
      title: string;
      config: any;
      width?: number;
      height?: number;
    }) => createCustomWidget(workspaceId, widgetType, title, config, width, height),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-widgets', workspaceId] });
      toast({
        title: 'Widget criado',
        description: 'Widget personalizado criado com sucesso',
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

  const updateMutation = useMutation({
    mutationFn: ({
      widgetId,
      updates,
    }: {
      widgetId: string;
      updates: {
        title?: string;
        config?: any;
        width?: number;
        height?: number;
        position?: number;
      };
    }) => updateCustomWidget(widgetId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-widgets', workspaceId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar widget',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (widgetId: string) => deleteCustomWidget(widgetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-widgets', workspaceId] });
      toast({
        title: 'Widget deletado',
        description: 'Widget personalizado deletado com sucesso',
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
    updateWidget: updateMutation.mutate,
    deleteWidget: deleteMutation.mutate,
  };
}
