/**
 * Hook para importação do Notion
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface ImportNotionParams {
  workspaceId: string;
  zipFile: File;
  parentId?: string | null;
}

interface ImportNotionResponse {
  success: boolean;
  jobId?: string;
  error?: string;
  message?: string;
}

/**
 * Hook para importar arquivo ZIP do Notion
 */
export function useNotionImport() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (params: ImportNotionParams) => {
      const formData = new FormData();
      formData.append('file', params.zipFile);
      formData.append('workspaceId', params.workspaceId);
      if (params.parentId) {
        formData.append('parentId', params.parentId);
      }

      const response = await fetch('/api/upload/notion', {
        method: 'POST',
        body: formData,
      });

      const data: ImportNotionResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao importar arquivo');
      }

      return data;
    },
    onSuccess: (data, variables) => {
      toast.success('Importação concluída com sucesso!', {
        description: 'As páginas do Notion foram importadas.',
      });

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['pages', variables.workspaceId] });

      // Refresh da página
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error('Erro na importação', {
        description: error.message,
      });
    },
  });
}
