/**
 * Types para o sistema de páginas estilo Notion
 */

import { Database } from '@/types/database.types';

// =====================================================
// DATABASE TYPES (extraídos de Database)
// =====================================================

export type Page = Database['public']['Tables']['pages']['Row'];
export type PageInsert = Database['public']['Tables']['pages']['Insert'];
export type PageUpdate = Database['public']['Tables']['pages']['Update'];

export type PageLink = Database['public']['Tables']['page_links']['Row'];
export type PageLinkInsert = Database['public']['Tables']['page_links']['Insert'];

export type PageTemplate = Database['public']['Tables']['page_templates']['Row'];
export type PageTemplateInsert = Database['public']['Tables']['page_templates']['Insert'];
export type PageTemplateUpdate = Database['public']['Tables']['page_templates']['Update'];

export type PageVersion = Database['public']['Tables']['page_versions']['Row'];
export type PageVersionInsert = Database['public']['Tables']['page_versions']['Insert'];

// =====================================================
// BLOCKNOTE TYPES
// =====================================================

/**
 * Bloco do BlockNote (estrutura simplificada)
 * Ref: https://www.blocknotejs.org/
 */
export interface Block {
  id?: string;
  type: string;
  props?: Record<string, any>;
  content?: InlineContent[] | Block[];
  children?: Block[];
}

export interface InlineContent {
  type: 'text' | 'link';
  text?: string;
  href?: string;
  styles?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    code?: boolean;
  };
}

// =====================================================
// PAGE TREE TYPES (para hierarquia e navegação)
// =====================================================

/**
 * Nó da árvore de páginas (com filhos carregados)
 */
export interface PageNode extends Page {
  children?: PageNode[];
  level?: number;
  path?: string[];
}

/**
 * Item simplificado para menus/seletores
 */
export interface PageItem {
  id: string;
  title: string;
  icon: string | null;
  is_folder: boolean;
  parent_id: string | null;
}

/**
 * Breadcrumb item
 */
export interface BreadcrumbItem {
  id: string;
  title: string;
  icon: string | null;
}

// =====================================================
// IMPORT/EXPORT TYPES
// =====================================================

/**
 * Resultado da importação do Notion
 */
export interface ImportResult {
  success: boolean;
  totalPages: number;
  importedPages: number;
  skippedPages: number;
  errors: ImportError[];
  pageMapping: Record<string, string>; // originalId → newId
  duration: number; // ms
}

export interface ImportError {
  filePath: string;
  error: string;
  type: 'parse' | 'validation' | 'database' | 'unknown';
}

/**
 * Progresso da importação (para UI)
 */
export interface ImportProgress {
  status: 'idle' | 'uploading' | 'parsing' | 'importing' | 'completed' | 'error';
  currentStep: string;
  totalPages: number;
  processedPages: number;
  currentPage: string | null;
  errors: ImportError[];
}

/**
 * Formato de exportação
 */
export type ExportFormat = 'markdown' | 'pdf' | 'html';

/**
 * Opções de exportação
 */
export interface ExportOptions {
  format: ExportFormat;
  includeSubpages: boolean;
  includeMetadata: boolean;
  preserveFormatting: boolean;
}

// =====================================================
// PAGE LINK TYPES (para backlinks)
// =====================================================

/**
 * Página que menciona a atual (para painel de backlinks)
 */
export interface BacklinkPage {
  id: string;
  title: string;
  icon: string | null;
  updated_at: string;
  excerpt?: string; // Trecho onde a página é mencionada
}

/**
 * Tipo de link entre páginas
 */
export type LinkType = 'mention' | 'embed' | 'reference';

// =====================================================
// TEMPLATE TYPES
// =====================================================

/**
 * Template com preview
 */
export interface TemplateWithPreview extends PageTemplate {
  previewImage?: string;
  usageCount?: number;
}

/**
 * Categoria de templates
 */
export type TemplateCategory =
  | 'blank'
  | 'note'
  | 'task'
  | 'meeting'
  | 'project'
  | 'wiki'
  | 'custom';

// =====================================================
// VERSION HISTORY TYPES
// =====================================================

/**
 * Versão com informações do usuário
 */
export interface VersionWithUser extends PageVersion {
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
}

/**
 * Diferença entre duas versões
 */
export interface VersionDiff {
  titleChanged: boolean;
  contentChanges: ContentChange[];
  metadata: {
    from: {
      version: number;
      date: string;
      author: string | null;
    };
    to: {
      version: number;
      date: string;
      author: string | null;
    };
  };
}

export interface ContentChange {
  type: 'added' | 'removed' | 'modified';
  blockId: string;
  blockType: string;
  before?: string;
  after?: string;
  position: number;
}

// =====================================================
// FOLDER TYPES
// =====================================================

/**
 * Estatísticas de uma pasta
 */
export interface FolderStats {
  totalPages: number;
  totalFolders: number;
  depth: number;
  lastModified: string;
}

// =====================================================
// DRAG AND DROP TYPES
// =====================================================

/**
 * Item sendo arrastado
 */
export interface DraggedPage {
  id: string;
  title: string;
  is_folder: boolean;
  parent_id: string | null;
}

/**
 * Drop target
 */
export interface DropTarget {
  id: string;
  type: 'page' | 'folder' | 'root';
  position: 'before' | 'after' | 'inside';
}

// =====================================================
// SEARCH TYPES
// =====================================================

/**
 * Resultado de busca de página
 */
export interface PageSearchResult {
  id: string;
  title: string;
  icon: string | null;
  excerpt: string;
  path: BreadcrumbItem[];
  score: number;
  highlights: string[];
}

/**
 * Filtros de busca
 */
export interface PageSearchFilters {
  query: string;
  workspaceId: string;
  parentId?: string | null;
  isFolders?: boolean;
  includeArchived?: boolean;
  limit?: number;
}

// =====================================================
// ACTION RESULT TYPES
// =====================================================

/**
 * Resultado de uma ação do servidor
 */
export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Resultado de movimentação de página
 */
export interface MovePageResult {
  success: boolean;
  updatedPages: string[]; // IDs das páginas atualizadas
  error?: string;
}
