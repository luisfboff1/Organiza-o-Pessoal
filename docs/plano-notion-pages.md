# Plano: Sistema de Páginas Estilo Notion

## 🎯 Objetivo

Transformar o sistema de Páginas existente em um sistema completo estilo Notion com:
- **Hierarquia de pastas** (profundidade ilimitada)
- **Links entre páginas** (mencionar [[Página]])
- **Importação do Notion** (upload de ZIP)
- **Exportação** (Markdown e PDF)
- **Personalização** (ícones, capas, templates)

## 📊 Decisões do Usuário

1. ✅ **Expandir sistema de Páginas existente** (não criar nova seção)
2. ✅ **Hierarquia ilimitada** (como Notion)
3. ✅ **Prioridade #1**: Importação do Notion
4. ✅ **Método de importação**: Upload de arquivo ZIP exportado do Notion

---

## 🏗️ Arquitetura

### Estado Atual
- **Editor**: BlockNote 0.42.0 (já instalado)
- **Database**: Supabase PostgreSQL com RLS
- **Schema**: `pages` já tem `parent_id` para hierarquia (sem UI)
- **Autosave**: Implementado com debounce de 1000ms
- **Custom Blocks**: Padrão já estabelecido (spreadsheet)

### O Que Falta
- ❌ UI para hierarquia (sidebar com árvore)
- ❌ Sistema de links entre páginas
- ❌ Importação do Notion
- ❌ Exportação (MD/PDF)
- ❌ Suporte a pastas
- ❌ Ícones e capas
- ❌ Templates

---

## 🗄️ Mudanças no Schema

### Migration 009: Recursos Notion

```sql
-- 1. Adicionar colunas à tabela pages
ALTER TABLE pages
  ADD COLUMN position INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN is_folder BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN template_id UUID REFERENCES pages(id) ON DELETE SET NULL,
  ADD COLUMN import_source TEXT,
  ADD COLUMN import_metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Criar tabela page_links (para backlinks)
CREATE TABLE page_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  target_page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL DEFAULT 'mention',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(source_page_id, target_page_id, link_type)
);

CREATE INDEX idx_page_links_source ON page_links(source_page_id);
CREATE INDEX idx_page_links_target ON page_links(target_page_id);

-- 3. Criar tabela page_templates
CREATE TABLE page_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  content_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Criar tabela page_versions (histórico)
CREATE TABLE page_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_json JSONB NOT NULL,
  content_text TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_page_versions_page ON page_versions(page_id, version_number DESC);

-- 5. Função para extrair links de uma página
CREATE OR REPLACE FUNCTION extract_page_links(page_id UUID)
RETURNS void AS $$
BEGIN
  -- Remove links antigos
  DELETE FROM page_links WHERE source_page_id = page_id;

  -- Extrai links do content_json (blocos do tipo 'pageLink')
  INSERT INTO page_links (source_page_id, target_page_id, link_type)
  SELECT
    page_id,
    (block->>'pageId')::uuid,
    'mention'
  FROM pages p,
  LATERAL jsonb_array_elements(p.content_json) AS block
  WHERE p.id = page_id
    AND block->>'type' = 'pageLink'
    AND block->>'pageId' IS NOT NULL
  ON CONFLICT (source_page_id, target_page_id, link_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Função para obter backlinks de uma página
CREATE OR REPLACE FUNCTION get_page_backlinks(page_id UUID)
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
  WHERE pl.target_page_id = page_id
    AND p.archived = FALSE
  ORDER BY p.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Função recursiva para obter hierarquia completa
CREATE OR REPLACE FUNCTION get_page_hierarchy(root_page_id UUID DEFAULT NULL, workspace_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  parent_id UUID,
  title TEXT,
  icon TEXT,
  is_folder BOOLEAN,
  position INTEGER,
  level INTEGER,
  path TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE page_tree AS (
    -- Base: páginas raiz
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
    WHERE (root_page_id IS NULL AND p.parent_id IS NULL)
       OR (root_page_id IS NOT NULL AND p.id = root_page_id)
       AND (workspace_id IS NULL OR p.workspace_id = workspace_id)
       AND p.archived = FALSE

    UNION ALL

    -- Recursivo: filhos
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

-- 8. Índice para ordenação
CREATE INDEX idx_pages_position ON pages(parent_id, position, title);

-- 9. RLS Policies
ALTER TABLE page_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY page_links_select ON page_links FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM pages p WHERE p.id = source_page_id AND has_workspace_access(p.workspace_id)
  ));

CREATE POLICY page_templates_select ON page_templates FOR SELECT
  USING (has_workspace_access(workspace_id));

CREATE POLICY page_versions_select ON page_versions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM pages p WHERE p.id = page_id AND has_workspace_access(p.workspace_id)
  ));
```

### Migration 010: Storage Buckets

```sql
-- 1. Bucket para capas de páginas
INSERT INTO storage.buckets (id, name, public)
VALUES ('page-covers', 'page-covers', true);

-- 2. Bucket para assets das páginas
INSERT INTO storage.buckets (id, name, public)
VALUES ('page-assets', 'page-assets', true);

-- 3. Bucket temporário para importações
INSERT INTO storage.buckets (id, name, public)
VALUES ('import-temp', 'import-temp', false);

-- 4. Políticas de acesso para page-covers
CREATE POLICY "Usuários podem fazer upload de capas"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'page-covers' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Capas são publicamente acessíveis"
ON storage.objects FOR SELECT
USING (bucket_id = 'page-covers');

CREATE POLICY "Usuários podem deletar suas capas"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'page-covers' AND
  auth.uid() IS NOT NULL
);

-- 5. Políticas similares para page-assets
CREATE POLICY "Usuários podem fazer upload de assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'page-assets' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Assets são publicamente acessíveis"
ON storage.objects FOR SELECT
USING (bucket_id = 'page-assets');

-- 6. Política restrita para import-temp (apenas durante importação)
CREATE POLICY "Apenas o dono pode acessar arquivos temporários"
ON storage.objects FOR ALL
USING (
  bucket_id = 'import-temp' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## 📦 Dependências a Adicionar

```bash
pnpm add jszip markdown-it @types/markdown-it jspdf emoji-picker-react file-saver @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Por quê:**
- `jszip`: Parsear arquivos ZIP do Notion
- `markdown-it`: Converter Markdown → BlockNote
- `jspdf`: Gerar PDFs
- `emoji-picker-react`: Seletor de ícones
- `file-saver`: Download de arquivos exportados
- `@dnd-kit/*`: Drag-and-drop na árvore de páginas

---

## 📁 Estrutura de Arquivos

### Novos Arquivos (45 total)

#### 1. Database Migrations (2 arquivos)
```
supabase/migrations/
├── 009_notion_features.sql
└── 010_storage_buckets.sql
```

#### 2. Types & Utilities (8 arquivos)
```
src/features/pages/
├── types/
│   ├── index.ts                    # PageNode, ImportResult, etc.
│   ├── notion.ts                   # NotionPage, NotionBlock
│   └── export.ts                   # ExportFormat, ExportOptions
├── lib/
│   ├── notion-parser.ts            # Parsear ZIP do Notion
│   ├── markdown-to-blocknote.ts    # MD → BlockNote JSON
│   ├── blocknote-to-markdown.ts    # BlockNote → MD
│   ├── pdf-generator.ts            # Gerar PDFs
│   └── page-link-block-schema.tsx  # Custom block [[Page]]
```

#### 3. Server Actions (7 arquivos)
```
src/features/pages/actions/
├── import-notion.ts         # importNotionZip(), processNotionImport()
├── export-page.ts           # exportPageToMarkdown(), exportPageToPdf()
├── move-page.ts             # movePage(), reorderPages()
├── create-folder.ts         # createFolder()
├── duplicate-page.ts        # duplicatePage()
├── create-from-template.ts  # createFromTemplate()
└── manage-templates.ts      # saveAsTemplate(), listTemplates()
```

#### 4. Hooks (6 arquivos)
```
src/features/pages/hooks/
├── usePageTree.ts           # Hierarquia de páginas
├── usePageLinks.ts          # Links e backlinks
├── useNotionImport.ts       # Estado da importação
├── usePageExport.ts         # Exportação
├── useTemplates.ts          # Templates
└── useBreadcrumbs.ts        # Breadcrumbs
```

#### 5. Components - Navigation (5 arquivos)
```
src/features/pages/components/
├── PagesSidebar.tsx         # Sidebar completa
├── PageTree.tsx             # Árvore hierárquica (drag-and-drop)
├── PageTreeNode.tsx         # Nó individual da árvore
├── CreatePageMenu.tsx       # Menu: Nova Página/Pasta/Template
└── Breadcrumbs.tsx          # Navegação breadcrumb
```

#### 6. Components - Import/Export (6 arquivos)
```
src/features/pages/components/
├── NotionImportDialog.tsx   # Dialog de upload ZIP
├── ImportProgress.tsx       # Barra de progresso
├── ExportMenu.tsx           # Menu: Exportar MD/PDF
├── ExportDialog.tsx         # Opções de exportação
├── TemplateSelector.tsx     # Selecionar template
└── TemplateSaveDialog.tsx   # Salvar como template
```

#### 7. Components - Page Editor Extensions (5 arquivos)
```
src/features/pages/components/
├── PageLinkBlock.tsx        # Bloco customizado [[Page]]
├── PageMentionMenu.tsx      # Autocomplete de páginas
├── BacklinksPanel.tsx       # Painel de backlinks
├── PageHeader.tsx           # Header: título, ícone, capa
└── PageIconPicker.tsx       # Picker de ícone/emoji
```

#### 8. Components - Templates & Versions (3 arquivos)
```
src/features/pages/components/
├── TemplateGallery.tsx      # Galeria de templates
├── VersionHistory.tsx       # Histórico de versões
└── VersionDiffViewer.tsx    # Comparar versões
```

#### 9. API Routes (3 arquivos)
```
src/app/api/
├── upload/
│   └── notion/
│       └── route.ts         # POST: Upload ZIP do Notion
├── pages/
│   └── [pageId]/
│       ├── export/
│       │   └── route.ts     # GET: Download MD/PDF
│       └── versions/
│           └── route.ts     # GET: Listar versões
```

### Arquivos a Modificar (7 total)

1. **[src/types/database.types.ts](src/types/database.types.ts)**
   - Adicionar tipos para `page_links`, `page_templates`, `page_versions`
   - Atualizar tipo `Pages` com novos campos

2. **[src/features/pages/lib/spreadsheet-block-schema.tsx](src/features/pages/lib/spreadsheet-block-schema.tsx)**
   - Importar `pageLinkBlock`
   - Adicionar ao `blockSpecs`

3. **[src/features/pages/components/PageEditor.tsx](src/features/pages/components/PageEditor.tsx)**
   - Integrar plugin de menção de páginas
   - Chamar `extract_page_links()` após salvar
   - Adicionar suporte a versionamento

4. **[src/features/pages/actions/update-page.ts](src/features/pages/actions/update-page.ts)**
   - Criar versão antes de atualizar
   - Extrair links após salvar
   - Revalidar cache de backlinks

5. **[src/app/(workspace)/[workspaceId]/layout.tsx](src/app/(workspace)/[workspaceId]/layout.tsx)**
   - Adicionar `<PagesSidebar>` ao layout
   - Implementar toggle collapse/expand

6. **[src/app/(workspace)/[workspaceId]/page.tsx](src/app/(workspace)/[workspaceId]/page.tsx)**
   - Adicionar botão "Importar do Notion"
   - Mostrar progresso de importação

7. **[src/app/(workspace)/[workspaceId]/pages/[pageId]/page.tsx](src/app/(workspace)/[workspaceId]/pages/[pageId]/page.tsx)**
   - Adicionar breadcrumbs
   - Adicionar menu de exportação
   - Mostrar painel de backlinks

---

## 🚀 Fases de Implementação

### **FASE 1: Importação do Notion** (5-10 dias) ⭐ PRIORIDADE

#### Sprint 1.1: Foundation (3-4 dias)
**Arquivos:**
- `supabase/migrations/009_notion_features.sql`
- `supabase/migrations/010_storage_buckets.sql`
- `src/types/database.types.ts` (update)
- `src/features/pages/types/index.ts`
- `src/features/pages/types/notion.ts`

**Tasks:**
1. Criar e aplicar migrations
2. Gerar novos tipos TypeScript
3. Definir interfaces para NotionPage, ImportResult

#### Sprint 1.2: Parser & Converter (5-6 dias)
**Arquivos:**
- `src/features/pages/lib/notion-parser.ts` - Parsear ZIP
- `src/features/pages/lib/markdown-to-blocknote.ts` - MD → BlockNote
- `src/features/pages/actions/import-notion.ts` - Processar import
- `src/app/api/upload/notion/route.ts` - Upload endpoint

**Funcionalidades:**
- Extrair arquivos .md do ZIP
- Converter Markdown → BlockNote JSON
- Criar hierarquia baseado em paths
- Mapear IDs originais → novos IDs
- Resolver links [[Page Name]]

#### Sprint 1.3: UI de Importação (2-3 dias)
**Arquivos:**
- `src/features/pages/components/NotionImportDialog.tsx`
- `src/features/pages/components/ImportProgress.tsx`
- `src/features/pages/hooks/useNotionImport.ts`
- Modificar: `src/app/(workspace)/[workspaceId]/page.tsx`

**Funcionalidades:**
- Upload de arquivo ZIP
- Validação de tamanho e formato
- Barra de progresso
- Feedback de erros

**Resultado da Fase 1:**
- ✅ Upload de ZIP do Notion
- ✅ Parser completo (MD → BlockNote)
- ✅ Criação de hierarquia
- ✅ Resolução de links internos
- ✅ UI com progresso

---

### **FASE 2: Navegação & Hierarquia** (5-6 dias)

#### Sprint 2.1: Árvore de Páginas (3-4 dias)
**Arquivos:**
- `src/features/pages/components/PageTree.tsx` - Árvore com DnD
- `src/features/pages/components/PageTreeNode.tsx` - Nó individual
- `src/features/pages/components/PagesSidebar.tsx` - Sidebar completa
- `src/features/pages/hooks/usePageTree.ts` - Hook de dados
- `src/features/pages/actions/move-page.ts` - Mover páginas

**Funcionalidades:**
- Renderização recursiva de árvore
- Drag-and-drop para mover páginas
- Detecção de ciclos
- Collapse/expand de pastas
- Persistência de estado expandido

#### Sprint 2.2: Breadcrumbs & Sidebar (2 dias)
**Arquivos:**
- `src/features/pages/components/Breadcrumbs.tsx`
- `src/features/pages/hooks/useBreadcrumbs.ts`
- Modificar: `src/app/(workspace)/[workspaceId]/layout.tsx`
- Modificar: `src/app/(workspace)/[workspaceId]/pages/[pageId]/page.tsx`

**Funcionalidades:**
- Breadcrumb trail até raiz
- Integração da sidebar no layout
- Toggle de visibilidade
- Responsividade mobile

**Resultado da Fase 2:**
- ✅ Sidebar com árvore hierárquica
- ✅ Drag-and-drop para mover páginas
- ✅ Detecção de ciclos
- ✅ Breadcrumbs
- ✅ Collapse/expand de pastas

---

### **FASE 3: Links entre Páginas** (4-5 dias)

#### Sprint 3.1: Custom Block de Page Link (2-3 dias)
**Arquivos:**
- `src/features/pages/lib/page-link-block-schema.tsx`
- `src/features/pages/components/PageLinkBlock.tsx`
- `src/features/pages/components/PageMentionMenu.tsx`
- Modificar: `src/features/pages/lib/spreadsheet-block-schema.tsx`
- Modificar: `src/features/pages/components/PageEditor.tsx`

**Funcionalidades:**
- Bloco customizado do tipo `pageLink`
- Autocomplete ao digitar `[[`
- Inserção de link com ícone e título
- Plugin de menção integrado ao BlockNote

#### Sprint 3.2: Backlinks Panel (2 dias)
**Arquivos:**
- `src/features/pages/components/BacklinksPanel.tsx`
- `src/features/pages/hooks/usePageLinks.ts`
- Modificar: `src/app/(workspace)/[workspaceId]/pages/[pageId]/page.tsx`

**Funcionalidades:**
- Painel lateral com páginas que mencionam a atual
- Atualização automática ao salvar
- Link direto para páginas que mencionam

**Resultado da Fase 3:**
- ✅ Bloco customizado [[Page Link]]
- ✅ Autocomplete ao digitar [[
- ✅ Painel de backlinks
- ✅ Extração automática de links

---

### **FASE 4: Exportação** (3-4 dias)

#### Sprint 4.1: Export Markdown (1-2 dias)
**Arquivos:**
- `src/features/pages/lib/blocknote-to-markdown.ts`
- `src/features/pages/actions/export-page.ts`
- `src/app/api/pages/[pageId]/export/route.ts`

**Funcionalidades:**
- Converter BlockNote → Markdown
- Preservar formatação (bold, italic, etc.)
- Frontmatter com metadados
- Exportar pasta inteira como ZIP

#### Sprint 4.2: Export PDF (2 dias)
**Arquivos:**
- `src/features/pages/lib/pdf-generator.ts`

**Funcionalidades:**
- Gerar PDF com jsPDF
- Preservar hierarquia de headings
- Estilização adequada
- Paginação automática

#### Sprint 4.3: Export Menu UI (1 dia)
**Arquivos:**
- `src/features/pages/components/ExportMenu.tsx`
- `src/features/pages/hooks/usePageExport.ts`

**Funcionalidades:**
- Menu de exportação no header
- Opções: MD, PDF, incluir subpáginas
- Download automático

**Resultado da Fase 4:**
- ✅ Exportar página para Markdown
- ✅ Exportar página para PDF
- ✅ Exportar com subpáginas (ZIP)
- ✅ Menu de exportação integrado

---

### **FASE 5: Melhorias** (5-7 dias)

#### Sprint 5.1: Templates (2-3 dias)
- Sistema de templates
- Galeria de templates
- Criar página a partir de template
- Salvar página como template

#### Sprint 5.2: Ícones & Capas (2 dias)
- Picker de ícones/emojis
- Upload de imagem de capa
- Integração com storage

#### Sprint 5.3: Outras Funcionalidades (2 dias)
- Duplicar página
- Arquivar/Restaurar
- Histórico de versões (UI)

**Resultado da Fase 5:**
- ✅ Sistema de templates
- ✅ Picker de ícones/emojis
- ✅ Upload de capas
- ✅ Duplicação de páginas
- ✅ Versionamento com diff

---

## ⏱️ Timeline

| Fase | Duração | Dias Acumulados |
|------|---------|-----------------|
| **Fase 1**: Importação Notion | 5-10 dias | 10 dias |
| **Fase 2**: Navegação & Hierarquia | 5-6 dias | 16 dias |
| **Fase 3**: Links entre Páginas | 4-5 dias | 21 dias |
| **Fase 4**: Exportação | 3-4 dias | 25 dias |
| **Fase 5**: Melhorias | 5-7 dias | 30-32 dias |
| **QA & Ajustes** | 5-8 dias | **35-40 dias** |

**Total estimado: 30-40 dias de desenvolvimento**

---

## ✅ Checklist de Implementação

### Foundation
- [ ] Criar migration 009_notion_features.sql
- [ ] Criar migration 010_storage_buckets.sql
- [ ] Aplicar migrations no Supabase
- [ ] Gerar novos tipos TypeScript
- [ ] Instalar dependências (jszip, jspdf, etc.)

### Fase 1: Importação
- [ ] Implementar notion-parser.ts
- [ ] Implementar markdown-to-blocknote.ts
- [ ] Criar action import-notion.ts
- [ ] Criar API route /api/upload/notion
- [ ] Implementar NotionImportDialog.tsx
- [ ] Implementar ImportProgress.tsx
- [ ] Integrar no workspace page
- [ ] Testar import end-to-end

### Fase 2: Navegação
- [ ] Implementar PageTree.tsx (drag-and-drop)
- [ ] Implementar PageTreeNode.tsx
- [ ] Implementar PagesSidebar.tsx
- [ ] Criar action move-page.ts
- [ ] Implementar Breadcrumbs.tsx
- [ ] Integrar sidebar no layout
- [ ] Testar hierarquia e movimentação

### Fase 3: Links
- [ ] Criar page-link-block-schema.tsx
- [ ] Implementar PageLinkBlock.tsx
- [ ] Criar plugin de menção
- [ ] Implementar BacklinksPanel.tsx
- [ ] Integrar extraction de links no save
- [ ] Testar autocomplete e backlinks

### Fase 4: Exportação
- [ ] Implementar blocknote-to-markdown.ts
- [ ] Implementar pdf-generator.ts
- [ ] Criar action export-page.ts
- [ ] Criar API route /api/pages/[pageId]/export
- [ ] Implementar ExportMenu.tsx
- [ ] Testar exportação MD e PDF

### Fase 5: Melhorias
- [ ] Implementar sistema de templates
- [ ] Implementar PageIconPicker.tsx
- [ ] Implementar upload de capas
- [ ] Implementar duplicação de páginas
- [ ] Implementar versionamento UI
- [ ] Testar todas as features

### QA Final
- [ ] Testar importação de ZIP grande (50+ páginas)
- [ ] Testar hierarquia profunda (10+ níveis)
- [ ] Testar circular reference detection
- [ ] Testar performance com 1000+ páginas
- [ ] Testar exportação com subpáginas
- [ ] Validar responsividade mobile
- [ ] Accessibility audit
- [ ] Cross-browser testing

---

## 🎯 Critérios de Sucesso

### Funcional
- ✅ Importar ZIP do Notion preservando hierarquia e links
- ✅ Navegar em árvore de páginas com profundidade ilimitada
- ✅ Mover páginas por drag-and-drop sem criar ciclos
- ✅ Mencionar páginas com [[autocomplete]]
- ✅ Ver backlinks de uma página
- ✅ Exportar para MD e PDF
- ✅ Criar templates e páginas a partir deles
- ✅ Personalizar ícones e capas

### Performance
- ✅ Sidebar carrega < 1s com 500 páginas
- ✅ Importação processa 100 páginas em < 30s
- ✅ Exportação PDF gera em < 5s
- ✅ Autosave sem lag perceptível

### UX
- ✅ Navegação intuitiva (igual ao Notion)
- ✅ Feedback claro de progresso em operações longas
- ✅ Drag-and-drop suave
- ✅ Mensagens de erro claras

---

## ⚠️ Riscos e Mitigações

### Risco: Import de ZIP muito grande (>100MB)
**Mitigação:**
- Validar tamanho antes de processar
- Implementar chunked upload
- Processar em background com job queue
- Mostrar progresso detalhado

### Risco: Referências circulares na hierarquia
**Mitigação:**
- Validação no frontend antes de drop
- Validação no backend antes de salvar
- Função SQL `detectCycle()` eficiente
- Mensagens de erro claras

### Risco: Performance com 1000+ páginas
**Mitigação:**
- Virtualização da árvore (react-window)
- Lazy loading de children
- Indexação adequada no DB
- Paginação se necessário

### Risco: Perda de formatação na conversão MD
**Mitigação:**
- Testes extensivos com exemplos reais do Notion
- Suporte a todos os tipos de blocos do BlockNote
- Fallback para blocos desconhecidos
- Documentação de limitações

---

## 📝 Próximos Passos Imediatos

1. ✅ **Aprovar este plano**
2. Criar branch `feature/notion-pages`
3. Aplicar migrations no Supabase
4. Instalar dependências
5. Começar Sprint 1.1 (Foundation)
6. Implementar em iterações curtas com testes

---

**Estimativa Total:** 30-40 dias de desenvolvimento
**Complexidade:** Alta
**Impacto:** Muito Alto - Transforma Pages em sistema completo estilo Notion
**Prioridade:** Alta (solicitado pelo usuário)
