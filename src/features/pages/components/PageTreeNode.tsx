'use client';

/**
 * Nó individual da árvore de páginas com drag-and-drop
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronRight, ChevronDown, FileText, Folder, GripVertical, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageNode } from '../types';
import { CreatePageDialog } from './CreatePageDialog';

interface PageTreeNodeProps {
  node: PageNode;
  level: number;
  expandedIds: Set<string>;
  onToggleExpanded: (id: string) => void;
  workspaceId: string;
}

export function PageTreeNode({
  node,
  level,
  expandedIds,
  onToggleExpanded,
  workspaceId,
}: PageTreeNodeProps) {
  const pathname = usePathname();
  const isExpanded = expandedIds.has(node.id);
  const hasChildren = node.children && node.children.length > 0;
  const isActive = pathname === `/${workspaceId}/pages/${node.id}`;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: node.id,
    data: {
      type: 'page',
      node,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    paddingLeft: `${level * 16}px`,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'group flex items-center gap-1 py-1.5 px-2 rounded-md hover:bg-accent cursor-pointer transition-colors',
          isActive && 'bg-accent'
        )}
      >
        {/* Chevron (se tiver filhos) */}
        <button
          className="w-4 h-4 flex items-center justify-center hover:bg-accent-foreground/10 rounded"
          onClick={(e) => {
            e.preventDefault();
            if (hasChildren) {
              onToggleExpanded(node.id);
            }
          }}
        >
          {hasChildren && (
            isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )
          )}
        </button>

        {/* Drag Handle */}
        <div
          {...listeners}
          {...attributes}
          className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="w-3 h-3 text-muted-foreground" />
        </div>

        {/* Ícone da página/pasta */}
        <div className="w-5 h-5 flex items-center justify-center text-sm flex-shrink-0">
          {node.icon ? (
            <span>{node.icon}</span>
          ) : node.is_folder ? (
            <Folder className="w-4 h-4 text-muted-foreground" />
          ) : (
            <FileText className="w-4 h-4 text-muted-foreground" />
          )}
        </div>

        {/* Título (link) */}
        <Link
          href={`/${workspaceId}/pages/${node.id}`}
          className={cn(
            'flex-1 truncate text-sm hover:underline',
            isActive && 'font-medium'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {node.title}
        </Link>

        {/* Botão criar subpágina (aparece no hover) */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <CreatePageDialog
            workspaceId={workspaceId}
            parentId={node.id}
            parentTitle={node.title}
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            trigger={
              <button
                className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent"
                title="Criar subpágina"
                onClick={(e) => e.stopPropagation()}
              >
                <Plus className="w-3 h-3" />
              </button>
            }
          />
        </div>
      </div>

      {/* Filhos (recursivo) */}
      {hasChildren && isExpanded && (
        <div>
          {node.children?.map((child) => (
            <PageTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              expandedIds={expandedIds}
              onToggleExpanded={onToggleExpanded}
              workspaceId={workspaceId}
            />
          ))}
        </div>
      )}
    </>
  );
}
