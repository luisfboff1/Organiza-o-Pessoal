'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjects } from '../actions/get-projects';
import { createProject } from '../actions/create-project';
import { updateProject } from '../actions/update-project';
import { moveProject } from '../actions/move-project';
import { useToast } from '@/hooks/use-toast';

export function useProjects(workspaceId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const projectsQuery = useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: () => getProjects(workspaceId),
  });

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
      toast({
        title: 'Projeto criado',
        description: 'O projeto foi criado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar projeto',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
      toast({
        title: 'Projeto atualizado',
        description: 'O projeto foi atualizado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar projeto',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const moveMutation = useMutation({
    mutationFn: moveProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao mover projeto',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    projects: projectsQuery.data || [],
    isLoading: projectsQuery.isLoading,
    createProject: createMutation.mutate,
    updateProject: updateMutation.mutate,
    moveProject: moveMutation.mutate,
  };
}
