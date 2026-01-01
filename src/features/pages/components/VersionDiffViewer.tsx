'use client';

/**
 * Visualizador de diferenças entre versões
 */

import { ArrowLeft, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { blocksToPlainText } from '../lib/block-to-text';

interface PageVersion {
  id: string;
  page_id: string;
  content_json: any;
  content_text: string;
  created_at: string;
  created_by: string;
  change_summary?: string;
}

interface VersionDiffViewerProps {
  version: PageVersion;
  onBack: () => void;
  onRestore: () => void;
}

export function VersionDiffViewer({
  version,
  onBack,
  onRestore,
}: VersionDiffViewerProps) {
  const timeAgo = formatDistanceToNow(new Date(version.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  // Extrair preview do conteúdo
  const contentPreview = version.content_text || blocksToPlainText(version.content_json);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Button size="sm" onClick={onRestore}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Restaurar versão
        </Button>
      </div>

      {/* Version info */}
      <div className="mb-4">
        <h3 className="font-semibold mb-1">Versão de {timeAgo}</h3>
        <p className="text-sm text-muted-foreground">
          {new Date(version.created_at).toLocaleString('pt-BR')}
        </p>
        {version.change_summary && (
          <p className="text-sm text-muted-foreground mt-2">
            {version.change_summary}
          </p>
        )}
      </div>

      {/* Content preview */}
      <div className="flex-1">
        <h4 className="text-sm font-medium mb-2">Conteúdo da versão:</h4>
        <ScrollArea className="h-full border rounded-lg p-4 bg-muted/50">
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm">
              {contentPreview}
            </pre>
          </div>
        </ScrollArea>
      </div>

      {/* Warning */}
      <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p className="text-xs text-yellow-800 dark:text-yellow-200">
          ⚠️ Restaurar esta versão irá substituir o conteúdo atual da página.
          Esta ação criará uma nova versão com o conteúdo restaurado.
        </p>
      </div>
    </div>
  );
}
