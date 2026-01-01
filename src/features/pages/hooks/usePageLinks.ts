/**
 * Hook para gerenciar links entre páginas
 */

import { useQuery } from '@tanstack/react-query';
import { createBrowserClient } from '@/lib/supabase/client';
import { BacklinkPage } from '../types';

/**
 * Carrega backlinks de uma página (páginas que a mencionam)
 */
export function usePageLinks(pageId: string | null) {
  return useQuery({
    queryKey: ['page-links', pageId],
    queryFn: async () => {
      if (!pageId) return [];

      const supabase = createBrowserClient();

      // Usar função SQL get_page_backlinks
      const { data, error } = await (supabase as any).rpc('get_page_backlinks', {
        page_id: pageId,
      });

      if (error) {
        console.error('Erro ao carregar backlinks:', error);
        return [];
      }

      return (data || []) as BacklinkPage[];
    },
    enabled: !!pageId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
