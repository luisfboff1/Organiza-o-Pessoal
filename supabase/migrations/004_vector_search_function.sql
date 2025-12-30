-- Função RPC para busca vetorial por similaridade

CREATE OR REPLACE FUNCTION search_embeddings(
  query_embedding TEXT,
  workspace_uuid UUID,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  chunk_text TEXT,
  page_id UUID,
  project_id UUID,
  metadata JSONB,
  similarity FLOAT
) AS $$
DECLARE
  query_vector vector(1536);
BEGIN
  -- Convert JSON string to vector
  query_vector := query_embedding::vector;

  RETURN QUERY
  SELECT
    e.id,
    e.chunk_text,
    e.page_id,
    e.project_id,
    e.metadata,
    1 - (e.embedding <=> query_vector) AS similarity
  FROM embeddings e
  WHERE
    e.workspace_id = workspace_uuid
    AND 1 - (e.embedding <=> query_vector) > match_threshold
  ORDER BY e.embedding <=> query_vector
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
