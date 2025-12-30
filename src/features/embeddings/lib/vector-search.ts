import { createServerClient } from '@/lib/supabase/server';
import { generateEmbedding } from './embedding-client';
import { RAG_TOP_K } from '@/lib/constants';

export async function searchSimilar(
  workspaceId: string,
  query: string,
  limit: number = RAG_TOP_K
) {
  const supabase = await createServerClient();

  // Gerar embedding da query
  const queryEmbedding = await generateEmbedding(query);

  // Buscar chunks similares
  const { data, error } = await (supabase as any).rpc('search_embeddings', {
    query_embedding: JSON.stringify(queryEmbedding),
    workspace_uuid: workspaceId,
    match_threshold: 0.7,
    match_count: limit,
  });

  if (error) {
    console.error('Vector search error:', error);
    return [];
  }

  return data || [];
}
