'use client';

/**
 * Árvore de páginas com drag-and-drop
 */

import { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { toast } from 'sonner';
import { usePageTree } from '../hooks/usePageTree';
import { PageTreeNode } from './PageTreeNode';
import { movePage } from '../actions/move-page';
import { PageNode } from '../types';
import { Loader2 } from 'lucide-react';

interface PageTreeProps {
  workspaceId: string;
}

export function PageTree({ workspaceId }: PageTreeProps) {
  const { data: pages, isLoading } = usePageTree(workspaceId);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Configurar sensores do drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Lista plana de IDs para o SortableContext
  const flatPageIds = useMemo(() => {
    if (!pages) return [];
    const ids: string[] = [];

    const collectIds = (nodes: PageNode[]) => {
      for (const node of nodes) {
        ids.push(node.id);
        if (node.children) {
          collectIds(node.children);
        }
      }
    };

    collectIds(pages);
    return ids;
  }, [pages]);

  // Toggle expand/collapse
  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Verificar se criaria ciclo (não pode arrastar para dentro de si mesmo ou de filhos)
    if (wouldCreateCycle(activeId, overId, pages || [])) {
      toast.error('Não é possível mover para dentro da própria página ou filhos');
      return;
    }

    // Mover página
    const result = await movePage({
      pageId: activeId,
      newParentId: overId,
      workspaceId,
    });

    if (!result.success) {
      toast.error(result.error || 'Erro ao mover página');
    } else {
      toast.success('Página movida com sucesso');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!pages || pages.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Nenhuma página criada ainda
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={flatPageIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-0.5">
          {pages.map((node) => (
            <PageTreeNode
              key={node.id}
              node={node}
              level={0}
              expandedIds={expandedIds}
              onToggleExpanded={toggleExpanded}
              workspaceId={workspaceId}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

/**
 * Verifica se arrastar criaria um ciclo
 */
function wouldCreateCycle(
  pageId: string,
  targetId: string,
  pages: PageNode[]
): boolean {
  // Não pode arrastar para si mesmo
  if (pageId === targetId) return true;

  // Verificar se targetId é filho de pageId
  const isDescendant = (node: PageNode, ancestorId: string): boolean => {
    if (node.id === ancestorId) return true;
    if (!node.children) return false;
    return node.children.some((child) => isDescendant(child, ancestorId));
  };

  // Encontrar o nó sendo arrastado
  const findNode = (nodes: PageNode[], id: string): PageNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNode(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const draggedNode = findNode(pages, pageId);
  if (!draggedNode) return false;

  return isDescendant(draggedNode, targetId);
}
