-- Migration 009: Recursos Notion
-- Adiciona funcionalidades estilo Notion ao sistema de páginas:
-- - Hierarquia com posicionamento
-- - Links entre páginas (backlinks)
-- - Templates
-- - Histórico de versões
-- - Importação do Notion

-- =====================================================
-- 1. ADICIONAR COLUNAS À TABELA PAGES
-- =====================================================

ALTER TABLE pages
  ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_folder BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES pages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS import_source TEXT,
  ADD COLUMN IF NOT EXISTS import_metadata JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN pages.position IS 'Posição da página dentro do parent (para ordenação)';
COMMENT ON COLUMN pages.is_folder IS 'Indica se é uma pasta (não tem conteúdo, apenas filhos)';
COMMENT ON COLUMN pages.template_id IS 'ID do template usado para criar esta página';
COMMENT ON COLUMN pages.import_source IS 'Fonte da importação (ex: "notion", "markdown")';
COMMENT ON COLUMN pages.import_metadata IS 'Metadados da importação (IDs originais, etc.)';

-- =====================================================
-- 2. TABELA PAGE_LINKS (BACKLINKS)
-- =====================================================

CREATE TABLE IF NOT EXISTS page_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  target_page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL DEFAULT 'mention',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_page_link UNIQUE(source_page_id, target_page_id, link_type)
);

COMMENT ON TABLE page_links IS 'Links entre páginas para sistema de backlinks';
COMMENT ON COLUMN page_links.source_page_id IS 'Página que contém o link';
COMMENT ON COLUMN page_links.target_page_id IS 'Página que é mencionada';
COMMENT ON COLUMN page_links.link_type IS 'Tipo de link: mention, embed, etc.';

CREATE INDEX IF NOT EXISTS idx_page_links_source ON page_links(source_page_id);
CREATE INDEX IF NOT EXISTS idx_page_links_target ON page_links(target_page_id);

-- =====================================================
-- 3. TABELA PAGE_TEMPLATES
-- =====================================================

CREATE TABLE IF NOT EXISTS page_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  content_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE page_templates IS 'Templates de páginas para criação rápida';
COMMENT ON COLUMN page_templates.is_default IS 'Se true, é template padrão do workspace';

CREATE INDEX IF NOT EXISTS idx_page_templates_workspace ON page_templates(workspace_id);

-- =====================================================
-- 4. TABELA PAGE_VERSIONS (HISTÓRICO)
-- =====================================================

CREATE TABLE IF NOT EXISTS page_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_json JSONB NOT NULL,
  content_text TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE page_versions IS 'Histórico de versões das páginas';
COMMENT ON COLUMN page_versions.version_number IS 'Número sequencial da versão';

CREATE INDEX IF NOT EXISTS idx_page_versions_page ON page_versions(page_id, version_number DESC);

-- =====================================================
-- 5. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índice para ordenação de páginas por parent e posição
CREATE INDEX IF NOT EXISTS idx_pages_position ON pages(parent_id, position, title) WHERE archived = FALSE;

-- Índice para buscar páginas de um workspace
CREATE INDEX IF NOT EXISTS idx_pages_workspace_parent ON pages(workspace_id, parent_id) WHERE archived = FALSE;

-- =====================================================
-- 6. FUNÇÃO: EXTRAIR LINKS DE UMA PÁGINA
-- =====================================================

CREATE OR REPLACE FUNCTION extract_page_links(p_page_id UUID)
RETURNS void AS $$
BEGIN
  -- Remove links antigos desta página
  DELETE FROM page_links WHERE source_page_id = p_page_id;

  -- Extrai links do content_json (blocos do tipo 'pageLink')
  INSERT INTO page_links (source_page_id, target_page_id, link_type)
  SELECT
    p_page_id,
    (block->>'pageId')::uuid,
    COALESCE(block->>'linkType', 'mention')
  FROM pages p,
  LATERAL jsonb_array_elements(p.content_json) AS block
  WHERE p.id = p_page_id
    AND block->>'type' = 'pageLink'
    AND block->>'pageId' IS NOT NULL
    AND (block->>'pageId')::uuid != p_page_id  -- Evitar self-links
  ON CONFLICT (source_page_id, target_page_id, link_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION extract_page_links IS 'Extrai e salva os links de uma página para a tabela page_links';

-- =====================================================
-- 7. FUNÇÃO: OBTER BACKLINKS DE UMA PÁGINA
-- =====================================================

CREATE OR REPLACE FUNCTION get_page_backlinks(p_page_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  icon TEXT,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.title, p.icon, p.updated_at
  FROM pages p
  INNER JOIN page_links pl ON pl.source_page_id = p.id
  WHERE pl.target_page_id = p_page_id
    AND p.archived = FALSE
  ORDER BY p.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_page_backlinks IS 'Retorna todas as páginas que mencionam a página especificada';

-- =====================================================
-- 8. FUNÇÃO: OBTER HIERARQUIA DE PÁGINAS
-- =====================================================

CREATE OR REPLACE FUNCTION get_page_hierarchy(
  p_root_page_id UUID DEFAULT NULL,
  p_workspace_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  parent_id UUID,
  title TEXT,
  icon TEXT,
  is_folder BOOLEAN,
  position INTEGER,
  level INTEGER,
  path UUID[]
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE page_tree AS (
    -- Caso base: páginas raiz
    SELECT
      p.id,
      p.parent_id,
      p.title,
      p.icon,
      p.is_folder,
      p.position,
      0 AS level,
      ARRAY[p.id] AS path
    FROM pages p
    WHERE
      -- Se root_page_id especificado, começar dele
      (p_root_page_id IS NOT NULL AND p.id = p_root_page_id)
      -- Senão, começar das páginas raiz
      OR (p_root_page_id IS NULL AND p.parent_id IS NULL)
      -- Filtrar por workspace se especificado
      AND (p_workspace_id IS NULL OR p.workspace_id = p_workspace_id)
      AND p.archived = FALSE

    UNION ALL

    -- Caso recursivo: filhos
    SELECT
      p.id,
      p.parent_id,
      p.title,
      p.icon,
      p.is_folder,
      p.position,
      pt.level + 1,
      pt.path || p.id
    FROM pages p
    INNER JOIN page_tree pt ON p.parent_id = pt.id
    WHERE p.archived = FALSE
  )
  SELECT * FROM page_tree
  ORDER BY level, position, title;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_page_hierarchy IS 'Retorna a hierarquia completa de páginas a partir de uma raiz';

-- =====================================================
-- 9. FUNÇÃO: DETECTAR CICLOS NA HIERARQUIA
-- =====================================================

CREATE OR REPLACE FUNCTION would_create_cycle(
  p_page_id UUID,
  p_new_parent_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_id UUID;
  v_visited UUID[];
BEGIN
  -- Se não há novo parent, não há ciclo
  IF p_new_parent_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Se page_id = new_parent_id, é ciclo direto
  IF p_page_id = p_new_parent_id THEN
    RETURN TRUE;
  END IF;

  -- Percorrer a árvore para cima a partir do novo parent
  v_current_id := p_new_parent_id;
  v_visited := ARRAY[]::UUID[];

  WHILE v_current_id IS NOT NULL LOOP
    -- Se encontramos o page_id, seria um ciclo
    IF v_current_id = p_page_id THEN
      RETURN TRUE;
    END IF;

    -- Evitar loop infinito
    IF v_current_id = ANY(v_visited) THEN
      RETURN FALSE;
    END IF;

    v_visited := v_visited || v_current_id;

    -- Ir para o parent
    SELECT parent_id INTO v_current_id
    FROM pages
    WHERE id = v_current_id;
  END LOOP;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION would_create_cycle IS 'Verifica se mover uma página criaria uma referência circular';

-- =====================================================
-- 10. RLS POLICIES
-- =====================================================

-- Page Links
ALTER TABLE page_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY page_links_select ON page_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pages p
      WHERE p.id = source_page_id
      AND has_workspace_access(p.workspace_id)
    )
  );

CREATE POLICY page_links_insert ON page_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pages p
      WHERE p.id = source_page_id
      AND has_workspace_access(p.workspace_id)
    )
  );

CREATE POLICY page_links_delete ON page_links FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM pages p
      WHERE p.id = source_page_id
      AND has_workspace_access(p.workspace_id)
    )
  );

-- Page Templates
ALTER TABLE page_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY page_templates_select ON page_templates FOR SELECT
  USING (has_workspace_access(workspace_id));

CREATE POLICY page_templates_insert ON page_templates FOR INSERT
  WITH CHECK (has_workspace_access(workspace_id));

CREATE POLICY page_templates_update ON page_templates FOR UPDATE
  USING (has_workspace_access(workspace_id));

CREATE POLICY page_templates_delete ON page_templates FOR DELETE
  USING (has_workspace_access(workspace_id));

-- Page Versions
ALTER TABLE page_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY page_versions_select ON page_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pages p
      WHERE p.id = page_id
      AND has_workspace_access(p.workspace_id)
    )
  );

CREATE POLICY page_versions_insert ON page_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pages p
      WHERE p.id = page_id
      AND has_workspace_access(p.workspace_id)
    )
  );

-- =====================================================
-- 11. TRIGGER: AUTO-INCREMENTAR VERSION_NUMBER
-- =====================================================

CREATE OR REPLACE FUNCTION auto_increment_version_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Se version_number não foi especificado, calcular o próximo
  IF NEW.version_number IS NULL OR NEW.version_number = 0 THEN
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO NEW.version_number
    FROM page_versions
    WHERE page_id = NEW.page_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_increment_version_number
  BEFORE INSERT ON page_versions
  FOR EACH ROW
  EXECUTE FUNCTION auto_increment_version_number();

-- =====================================================
-- 12. DADOS INICIAIS (OPCIONAL)
-- =====================================================

-- Criar template padrão "Página em Branco" para cada workspace
-- (executar apenas se desejar)
-- INSERT INTO page_templates (workspace_id, title, description, icon, is_default)
-- SELECT id, 'Página em Branco', 'Uma página em branco para começar', '📄', true
-- FROM workspaces
-- ON CONFLICT DO NOTHING;
