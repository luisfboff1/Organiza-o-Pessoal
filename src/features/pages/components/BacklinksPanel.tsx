'use client';

/**
 * Painel mostrando páginas que mencionam a página atual (backlinks)
 */

import Link from 'next/link';
import { Link2, FileText } from 'lucide-react';
import { usePageLinks } from '../hooks/usePageLinks';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BacklinksPanelProps {
  pageId: string;
  workspaceId: string;
}

export function BacklinksPanel({ pageId, workspaceId }: BacklinksPanelProps) {
  const { data: backlinks, isLoading } = usePageLinks(pageId);

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!backlinks || backlinks.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground text-center">
        <Link2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Nenhuma página menciona esta página</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Link2 className="w-4 h-4" />
        Mencionado em {backlinks.length}{' '}
        {backlinks.length === 1 ? 'página' : 'páginas'}
      </h3>

      <div className="space-y-1">
        {backlinks.map((page) => (
          <Link
            key={page.id}
            href={`/${workspaceId}/pages/${page.id}`}
            className="flex items-center gap-2 p-2 rounded hover:bg-accent group transition-colors"
          >
            <div className="w-5 h-5 flex items-center justify-center text-sm flex-shrink-0">
              {page.icon ? (
                <span>{page.icon}</span>
              ) : (
                <FileText className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate group-hover:underline">
                {page.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(page.updated_at), {
                  locale: ptBR,
                  addSuffix: true,
                })}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
