'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTasks } from '../actions/get-tasks';
import { createTask } from '../actions/create-task';
import { updateTask } from '../actions/update-task';
import { deleteTask } from '../actions/delete-task';
import { useToast } from '@/hooks/use-toast';

interface UseTasksOptions {
  workspaceId: string;
  projectId?: string;
  status?: 'todo' | 'doing' | 'done';
  pageId?: string;
}

export function useTasks(options: UseTasksOptions) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const tasksQuery = useQuery({
    queryKey: ['tasks', options],
    queryFn: () => getTasks(options),
  });

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: 'Task criada',
        description: 'A task foi criada com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar task',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: 'Task atualizada',
        description: 'A task foi atualizada com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar task',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: 'Task deletada',
        description: 'A task foi deletada com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao deletar task',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    tasks: tasksQuery.data || [],
    isLoading: tasksQuery.isLoading,
    createTask: createMutation.mutate,
    updateTask: updateMutation.mutate,
    deleteTask: deleteMutation.mutate,
  };
}
