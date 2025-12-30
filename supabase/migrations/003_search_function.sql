-- Função RPC para busca full-text search

CREATE OR REPLACE FUNCTION search_pages_fts(
  workspace_uuid UUID,
  search_query TEXT
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  icon TEXT,
  content_text TEXT,
  created_at TIMESTAMPTZ,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.icon,
    p.content_text,
    p.created_at,
    ts_rank(
      to_tsvector('english', p.content_text || ' ' || p.title),
      plainto_tsquery('english', search_query)
    ) AS rank
  FROM pages p
  WHERE
    p.workspace_id = workspace_uuid
    AND p.archived = FALSE
    AND to_tsvector('english', p.content_text || ' ' || p.title) @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
