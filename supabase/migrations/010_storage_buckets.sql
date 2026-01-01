-- Migration 010: Storage Buckets para Páginas
-- Cria buckets do Supabase Storage para:
-- - Capas de páginas
-- - Assets das páginas (imagens, arquivos)
-- - Arquivos temporários de importação

-- =====================================================
-- 1. CRIAR BUCKETS
-- =====================================================

-- Bucket para capas de páginas (imagens de capa/banner)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'page-covers',
  'page-covers',
  true,
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket para assets das páginas (imagens inseridas no conteúdo)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'page-assets',
  'page-assets',
  true,
  10485760,  -- 10MB
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
    'application/pdf',
    'video/mp4', 'video/webm',
    'audio/mpeg', 'audio/wav'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Bucket temporário para arquivos de importação (ZIP do Notion)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'import-temp',
  'import-temp',
  false,  -- Privado
  104857600,  -- 100MB
  ARRAY['application/zip', 'application/x-zip-compressed']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. POLÍTICAS DE ACESSO - PAGE-COVERS
-- =====================================================

-- SELECT: Capas são publicamente acessíveis
CREATE POLICY "Capas são publicamente acessíveis" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'page-covers');

-- INSERT: Usuários autenticados podem fazer upload
CREATE POLICY "Usuários podem fazer upload de capas" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'page-covers'
    AND auth.uid() IS NOT NULL
    -- Path deve ser: workspace_id/page_id/filename
    AND (storage.foldername(name))[1] IN (
      SELECT w.id::text
      FROM workspaces w
      WHERE has_workspace_access(w.id)
    )
  );

-- UPDATE: Usuários podem atualizar suas capas
CREATE POLICY "Usuários podem atualizar capas" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'page-covers'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IN (
      SELECT w.id::text
      FROM workspaces w
      WHERE has_workspace_access(w.id)
    )
  );

-- DELETE: Usuários podem deletar capas de seus workspaces
CREATE POLICY "Usuários podem deletar capas" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'page-covers'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IN (
      SELECT w.id::text
      FROM workspaces w
      WHERE has_workspace_access(w.id)
    )
  );

-- =====================================================
-- 3. POLÍTICAS DE ACESSO - PAGE-ASSETS
-- =====================================================

-- SELECT: Assets são publicamente acessíveis
CREATE POLICY "Assets são publicamente acessíveis" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'page-assets');

-- INSERT: Usuários autenticados podem fazer upload
CREATE POLICY "Usuários podem fazer upload de assets" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'page-assets'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IN (
      SELECT w.id::text
      FROM workspaces w
      WHERE has_workspace_access(w.id)
    )
  );

-- UPDATE: Usuários podem atualizar seus assets
CREATE POLICY "Usuários podem atualizar assets" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'page-assets'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IN (
      SELECT w.id::text
      FROM workspaces w
      WHERE has_workspace_access(w.id)
    )
  );

-- DELETE: Usuários podem deletar assets de seus workspaces
CREATE POLICY "Usuários podem deletar assets" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'page-assets'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IN (
      SELECT w.id::text
      FROM workspaces w
      WHERE has_workspace_access(w.id)
    )
  );

-- =====================================================
-- 4. POLÍTICAS DE ACESSO - IMPORT-TEMP
-- =====================================================

-- SELECT: Apenas o dono pode acessar
CREATE POLICY "Apenas o dono pode ler arquivos temporários" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'import-temp'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- INSERT: Apenas o próprio usuário pode fazer upload
CREATE POLICY "Apenas o usuário pode fazer upload temporário" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'import-temp'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- DELETE: Apenas o dono pode deletar
CREATE POLICY "Apenas o dono pode deletar arquivos temporários" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'import-temp'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- =====================================================
-- 5. FUNÇÃO HELPER: LIMPAR ARQUIVOS TEMPORÁRIOS ANTIGOS
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_old_import_files()
RETURNS void AS $$
BEGIN
  -- Deletar arquivos temporários com mais de 24 horas
  DELETE FROM storage.objects
  WHERE bucket_id = 'import-temp'
    AND created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_import_files IS 'Remove arquivos temporários de importação com mais de 24h';

-- =====================================================
-- 6. COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE storage.buckets IS 'Buckets de armazenamento para arquivos';

-- Comentários nos buckets (metadados)
UPDATE storage.buckets
SET public = true
WHERE id IN ('page-covers', 'page-assets');

UPDATE storage.buckets
SET public = false
WHERE id = 'import-temp';
