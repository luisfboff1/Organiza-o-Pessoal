'use client';

/**
 * Bloco customizado para links entre páginas [[Page]]
 */

import Link from 'next/link';
import { FileText } from 'lucide-react';
import { usePage } from '../hooks/usePageTree';
import { useParams } from 'next/navigation';

interface PageLinkBlockProps {
  block: {
    props: {
      pageId: string;
      pageTitle: string;
      pageIcon: string;
    };
  };
}

export function PageLinkBlock({ block }: PageLinkBlockProps) {
  const { pageId, pageTitle, pageIcon } = block.props;
  const params = useParams();
  const workspaceId = params?.workspaceId as string;

  // Carregar dados atualizados da página (opcional)
  const { data: page } = usePage(pageId);

  const displayTitle = (page as any)?.title || pageTitle || 'Página não encontrada';
  const displayIcon = (page as any)?.icon || pageIcon;

  if (!pageId) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-sm text-muted-foreground">
        <FileText className="w-3 h-3" />
        Página não encontrada
      </span>
    );
  }

  return (
    <Link
      href={`/${workspaceId}/pages/${pageId}`}
      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded text-sm text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors no-underline"
      contentEditable={false}
    >
      {displayIcon ? (
        <span className="text-xs">{displayIcon}</span>
      ) : (
        <FileText className="w-3 h-3" />
      )}
      <span>{displayTitle}</span>
    </Link>
  );
}
