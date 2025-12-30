'use server';

import { createServerClient } from '@/lib/supabase/server';

export async function searchPages(workspaceId: string, query: string) {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const supabase = await createServerClient();

  // Busca usando Full-Text Search (FTS)
  const { data, error } = await (supabase as any).rpc('search_pages_fts', {
    workspace_uuid: workspaceId,
    search_query: query,
  });

  if (error) {
    console.error('Search error:', error);
    return [];
  }

  return data || [];
}
