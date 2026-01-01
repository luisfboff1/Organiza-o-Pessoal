'use client';

/**
 * Breadcrumbs para navegação de páginas
 */

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { useBreadcrumbs } from '../hooks/useBreadcrumbs';
import { Skeleton } from '@/components/ui/skeleton';

interface BreadcrumbsProps {
  pageId: string;
  workspaceId: string;
}

export function Breadcrumbs({ pageId, workspaceId }: BreadcrumbsProps) {
  const { data: breadcrumbs, isLoading } = useBreadcrumbs(pageId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    );
  }

  if (!breadcrumbs || breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      {/* Home */}
      <Link
        href={`/${workspaceId}/pages`}
        className="hover:text-foreground transition-colors"
      >
        <Home className="w-4 h-4" />
      </Link>

      {/* Breadcrumb items */}
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;

        return (
          <div key={item.id} className="flex items-center gap-1">
            <ChevronRight className="w-3 h-3" />
            {isLast ? (
              <span className="text-foreground font-medium">
                {item.icon && <span className="mr-1">{item.icon}</span>}
                {item.title}
              </span>
            ) : (
              <Link
                href={`/${workspaceId}/pages/${item.id}`}
                className="hover:text-foreground transition-colors"
              >
                {item.icon && <span className="mr-1">{item.icon}</span>}
                {item.title}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
