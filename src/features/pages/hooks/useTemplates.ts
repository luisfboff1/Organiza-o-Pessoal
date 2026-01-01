/**
 * Hook para gerenciar templates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  listTemplates,
  createPageFromTemplate,
  savePageAsTemplate,
  deleteTemplate,
  type Template,
} from '../actions/manage-templates';

/**
 * Hook para listar templates
 */
export function useTemplates(workspaceId: string) {
  return useQuery({
    queryKey: ['templates', workspaceId],
    queryFn: () => listTemplates(workspaceId),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para criar página a partir de template
 */
export function useCreateFromTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPageFromTemplate,
    onSuccess: (result, variables) => {
      if (result.success) {
        toast.success('Página criada a partir do template');
        queryClient.invalidateQueries({ queryKey: ['page-tree', variables.workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['pages', variables.workspaceId] });
      } else {
        toast.error(result.error || 'Erro ao criar página');
      }
    },
    onError: (error) => {
      console.error('Error creating from template:', error);
      toast.error('Erro ao criar página do template');
    },
  });
}

/**
 * Hook para salvar página como template
 */
export function useSaveAsTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: savePageAsTemplate,
    onSuccess: (result, variables) => {
      if (result.success) {
        toast.success('Template salvo com sucesso');
        queryClient.invalidateQueries({ queryKey: ['templates', variables.workspaceId] });
      } else {
        toast.error(result.error || 'Erro ao salvar template');
      }
    },
    onError: (error) => {
      console.error('Error saving as template:', error);
      toast.error('Erro ao salvar template');
    },
  });
}

/**
 * Hook para deletar template
 */
export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTemplate,
    onSuccess: (result, variables) => {
      if (result.success) {
        toast.success('Template deletado');
        queryClient.invalidateQueries({ queryKey: ['templates', variables.workspaceId] });
      } else {
        toast.error(result.error || 'Erro ao deletar template');
      }
    },
    onError: (error) => {
      console.error('Error deleting template:', error);
      toast.error('Erro ao deletar template');
    },
  });
}
