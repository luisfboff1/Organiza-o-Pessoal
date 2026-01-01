'use client';

/**
 * Componente para visualizar histórico de versões
 */

import { useState } from 'react';
import { History, Clock, User, RotateCcw } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { VersionDiffViewer } from './VersionDiffViewer';

interface PageVersion {
  id: string;
  page_id: string;
  content_json: any;
  content_text: string;
  created_at: string;
  created_by: string;
  change_summary?: string;
}

interface VersionHistoryProps {
  pageId: string;
  workspaceId: string;
}

export function VersionHistory({ pageId, workspaceId }: VersionHistoryProps) {
  const [open, setOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<PageVersion | null>(null);
  const [versions, setVersions] = useState<PageVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadVersions = async () => {
    setIsLoading(true);
    try {
      // Buscar versões via API
      const response = await fetch(
        `/api/pages/${pageId}/versions?workspaceId=${workspaceId}`
      );

      if (response.ok) {
        const data = await response.json();
        setVersions(data.versions || []);
      }
    } catch (error) {
      console.error('Error loading versions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && versions.length === 0) {
      loadVersions();
    }
  };

  const handleRestoreVersion = async (version: PageVersion) => {
    try {
      const response = await fetch(`/api/pages/${pageId}/restore-version`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          versionId: version.id,
          workspaceId,
        }),
      });

      if (response.ok) {
        setOpen(false);
        window.location.reload(); // Recarregar página para mostrar conteúdo restaurado
      }
    } catch (error) {
      console.error('Error restoring version:', error);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <History className="w-4 h-4" />
          Histórico
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Histórico de versões</SheetTitle>
          <SheetDescription>
            Visualize e restaure versões anteriores desta página
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 h-[calc(100vh-120px)]">
          {selectedVersion ? (
            <VersionDiffViewer
              version={selectedVersion}
              onBack={() => setSelectedVersion(null)}
              onRestore={() => handleRestoreVersion(selectedVersion)}
            />
          ) : (
            <ScrollArea className="h-full pr-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-24" />
                  ))}
                </div>
              ) : versions.length > 0 ? (
                <div className="space-y-2">
                  {versions.map((version, index) => (
                    <VersionItem
                      key={version.id}
                      version={version}
                      isLatest={index === 0}
                      onClick={() => setSelectedVersion(version)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <History className="w-12 h-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma versão anterior disponível
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    As versões são criadas automaticamente quando você edita a página
                  </p>
                </div>
              )}
            </ScrollArea>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Item de versão individual
 */
function VersionItem({
  version,
  isLatest,
  onClick,
}: {
  version: PageVersion;
  isLatest: boolean;
  onClick: () => void;
}) {
  const timeAgo = formatDistanceToNow(new Date(version.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <button
      onClick={onClick}
      className="w-full p-4 border rounded-lg hover:bg-muted transition-colors text-left group"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">{timeAgo}</span>
          {isLatest && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
              Atual
            </span>
          )}
        </div>
      </div>

      {version.change_summary && (
        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
          {version.change_summary}
        </p>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <User className="w-3 h-3" />
        <span>Editado por você</span>
      </div>

      <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <RotateCcw className="w-3 h-3" />
        <span className="text-xs text-primary">Visualizar e restaurar</span>
      </div>
    </button>
  );
}
