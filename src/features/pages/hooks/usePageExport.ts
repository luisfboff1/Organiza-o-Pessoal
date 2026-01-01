/**
 * Hook para exportar páginas
 */

import { useState } from 'react';
import { toast } from 'sonner';
import type { ExportFormat } from '../actions/export-page';

export interface ExportOptions {
  format: ExportFormat;
  includeChildren?: boolean;
}

export function usePageExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportPage = async (pageId: string, options: ExportOptions) => {
    const { format, includeChildren = false } = options;

    try {
      setIsExporting(true);

      // Construir URL da API
      const params = new URLSearchParams({
        format,
        includeChildren: includeChildren.toString(),
      });

      const url = `/api/pages/${pageId}/export?${params.toString()}`;

      // Fazer requisição
      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao exportar página');
      }

      // Obter nome do arquivo do header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `page.${format === 'markdown' ? 'md' : 'pdf'}`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Baixar arquivo
      const blob = await response.blob();
      downloadBlob(blob, filename);

      toast.success(`Página exportada com sucesso: ${filename}`);
    } catch (error) {
      console.error('Error exporting page:', error);
      toast.error(
        error instanceof Error ? error.message : 'Erro ao exportar página'
      );
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportPage,
    isExporting,
  };
}

/**
 * Faz download de um Blob como arquivo
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
