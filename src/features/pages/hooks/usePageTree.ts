/**
 * Hook para carregar e gerenciar a árvore de páginas
 */

import { useQuery } from '@tanstack/react-query';
import { createBrowserClient } from '@/lib/supabase/client';
import { PageNode } from '../types';

/**
 * Carrega a hierarquia completa de páginas de um workspace
 */
export function usePageTree(workspaceId: string) {
  return useQuery({
    queryKey: ['pages', 'tree', workspaceId],
    queryFn: async () => {
      const supabase = createBrowserClient();

      // Carregar todas as páginas do workspace
      const { data: pages, error } = await supabase
        .from('pages')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('archived', false)
        .order('position')
        .order('title');

      if (error) throw error;

      // Construir árvore
      return buildPageTree(pages || []);
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Constrói a estrutura de árvore a partir de uma lista plana de páginas
 */
function buildPageTree(pages: any[]): PageNode[] {
  const pageMap = new Map<string, PageNode>();
  const rootNodes: PageNode[] = [];

  // Criar mapa de páginas
  for (const page of pages) {
    pageMap.set(page.id, {
      ...page,
      children: [],
      level: 0,
      path: [],
    });
  }

  // Construir hierarquia
  for (const page of pages) {
    const node = pageMap.get(page.id)!;

    if (page.parent_id) {
      const parent = pageMap.get(page.parent_id);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(node);
        node.level = (parent.level || 0) + 1;
        node.path = [...(parent.path || []), parent.id];
      } else {
        // Parent não encontrado, adicionar como raiz
        rootNodes.push(node);
      }
    } else {
      rootNodes.push(node);
    }
  }

  return rootNodes;
}

/**
 * Hook para buscar uma página específica
 */
export function usePage(pageId: string | null) {
  return useQuery({
    queryKey: ['page', pageId],
    queryFn: async () => {
      if (!pageId) return null;

      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('id', pageId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!pageId,
  });
}
