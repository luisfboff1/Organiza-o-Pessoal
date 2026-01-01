/**
 * Hook para gerar breadcrumbs de uma página
 */

import { useQuery } from '@tanstack/react-query';
import { createBrowserClient } from '@/lib/supabase/client';
import { BreadcrumbItem } from '../types';

/**
 * Carrega o caminho completo (breadcrumbs) até uma página
 */
export function useBreadcrumbs(pageId: string | null) {
  return useQuery({
    queryKey: ['breadcrumbs', pageId],
    queryFn: async () => {
      if (!pageId) return [];

      const supabase = createBrowserClient();
      const breadcrumbs: BreadcrumbItem[] = [];

      // Carregar página atual
      let currentId: string | null = pageId;

      while (currentId) {
        const { data: page, error }: { data: any; error: any } = await supabase
          .from('pages')
          .select('id, title, icon, parent_id')
          .eq('id', currentId)
          .single();

        if (error || !page) break;

        // Adicionar no início (para ter ordem correta)
        breadcrumbs.unshift({
          id: page.id,
          title: page.title,
          icon: page.icon,
        });

        currentId = page.parent_id;
      }

      return breadcrumbs;
    },
    enabled: !!pageId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
