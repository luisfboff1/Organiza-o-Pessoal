/**
 * Types específicos para importação do Notion
 */

import { Block } from './index';

// =====================================================
// NOTION EXPORT STRUCTURE
// =====================================================

/**
 * Estrutura de um arquivo ZIP exportado do Notion
 *
 * Estrutura típica:
 * root/
 * ├── Page 1.md
 * ├── Page 2.md
 * ├── Folder 1/
 * │   ├── Page 3.md
 * │   └── Page 4.md
 * └── images/
 *     ├── image1.png
 *     └── image2.jpg
 */

/**
 * Página extraída de um export do Notion
 */
export interface NotionPage {
  /**
   * Título da página (extraído do nome do arquivo ou primeiro heading)
   */
  title: string;

  /**
   * Caminho relativo do arquivo no ZIP
   * Ex: "Folder 1/Subfolder/Page.md"
   */
  filePath: string;

  /**
   * Conteúdo Markdown bruto
   */
  content: string;

  /**
   * Metadados extraídos do frontmatter ou conteúdo
   */
  metadata: NotionPageMetadata;

  /**
   * Links encontrados no conteúdo [[Page Name]]
   */
  links: NotionLink[];

  /**
   * Assets referenciados (imagens, arquivos)
   */
  assets: NotionAsset[];

  /**
   * Caminho da pasta pai (derivado do filePath)
   */
  parentPath: string | null;
}

/**
 * Metadados de uma página do Notion
 */
export interface NotionPageMetadata {
  /**
   * ID original da página no Notion (se disponível)
   */
  originalId?: string;

  /**
   * Data de criação (extraída do frontmatter)
   */
  createdAt?: string;

  /**
   * Data de última atualização (extraída do frontmatter)
   */
  updatedAt?: string;

  /**
   * Ícone/emoji da página
   */
  icon?: string;

  /**
   * URL da imagem de capa
   */
  cover?: string;

  /**
   * Tags ou labels
   */
  tags?: string[];

  /**
   * Propriedades customizadas do Notion
   */
  properties?: Record<string, any>;

  /**
   * Status (se era um database item)
   */
  status?: string;

  /**
   * Database ID (se era parte de um database)
   */
  databaseId?: string;
}

/**
 * Link entre páginas encontrado no conteúdo
 */
export interface NotionLink {
  /**
   * Texto do link (nome da página mencionada)
   */
  text: string;

  /**
   * Tipo de link
   */
  type: 'page' | 'heading' | 'block';

  /**
   * ID original (se disponível)
   */
  originalId?: string;

  /**
   * Posição no texto (para preservar durante conversão)
   */
  position: {
    start: number;
    end: number;
  };
}

/**
 * Asset (imagem, arquivo) referenciado
 */
export interface NotionAsset {
  /**
   * Tipo de asset
   */
  type: 'image' | 'file' | 'video' | 'audio';

  /**
   * Caminho original no export do Notion
   */
  originalPath: string;

  /**
   * Nome do arquivo
   */
  fileName: string;

  /**
   * Tipo MIME
   */
  mimeType: string;

  /**
   * Tamanho em bytes
   */
  size: number;

  /**
   * Dados do arquivo (blob)
   */
  data?: ArrayBuffer;

  /**
   * URL após upload (será preenchido depois)
   */
  uploadedUrl?: string;
}

// =====================================================
// NOTION IMPORT PROCESS
// =====================================================

/**
 * Resultado do parsing de um ZIP do Notion
 */
export interface NotionParseResult {
  /**
   * Páginas extraídas
   */
  pages: NotionPage[];

  /**
   * Hierarquia de pastas (baseado nos paths)
   */
  hierarchy: NotionHierarchy[];

  /**
   * Assets encontrados
   */
  assets: NotionAsset[];

  /**
   * Estatísticas do parsing
   */
  stats: {
    totalFiles: number;
    totalPages: number;
    totalAssets: number;
    totalLinks: number;
    depth: number; // Profundidade máxima da hierarquia
  };

  /**
   * Warnings durante o parsing
   */
  warnings: NotionParseWarning[];
}

/**
 * Nó da hierarquia extraída do Notion
 */
export interface NotionHierarchy {
  /**
   * Nome da pasta/página
   */
  name: string;

  /**
   * Caminho completo
   */
  path: string;

  /**
   * Se é pasta ou página
   */
  isFolder: boolean;

  /**
   * Filhos
   */
  children: NotionHierarchy[];

  /**
   * Referência à página (se não for pasta)
   */
  page?: NotionPage;
}

/**
 * Warning durante o parsing
 */
export interface NotionParseWarning {
  type: 'missing_asset' | 'broken_link' | 'invalid_markdown' | 'duplicate_name';
  message: string;
  filePath: string;
  severity: 'info' | 'warning' | 'error';
}

// =====================================================
// NOTION MARKDOWN PARSING
// =====================================================

/**
 * Bloco Markdown do Notion (antes de converter para BlockNote)
 */
export interface NotionMarkdownBlock {
  type: NotionBlockType;
  content: string;
  level?: number; // Para headings
  language?: string; // Para code blocks
  url?: string; // Para links e imagens
  items?: string[]; // Para listas
  checked?: boolean; // Para checkboxes
  metadata?: Record<string, any>;
}

/**
 * Tipos de blocos que o Notion exporta em Markdown
 */
export type NotionBlockType =
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'paragraph'
  | 'bulletList'
  | 'numberedList'
  | 'todoList'
  | 'quote'
  | 'code'
  | 'divider'
  | 'image'
  | 'file'
  | 'embed'
  | 'bookmark'
  | 'callout'
  | 'toggle'
  | 'table'
  | 'columnList'
  | 'unknown';

// =====================================================
// NOTION TO BLOCKNOTE CONVERSION
// =====================================================

/**
 * Configuração da conversão Notion → BlockNote
 */
export interface ConversionConfig {
  /**
   * Preservar formatação inline (bold, italic, etc.)
   */
  preserveFormatting: boolean;

  /**
   * Converter blocos especiais (callouts, toggles)
   */
  convertSpecialBlocks: boolean;

  /**
   * Fazer upload de assets automaticamente
   */
  uploadAssets: boolean;

  /**
   * Workspace ID para upload de assets
   */
  workspaceId?: string;

  /**
   * Converter links internos em page links
   */
  convertInternalLinks: boolean;

  /**
   * Mapeamento de IDs originais → novos IDs
   */
  pageMapping?: Record<string, string>;
}

/**
 * Resultado da conversão de um bloco
 */
export interface BlockConversionResult {
  /**
   * Bloco BlockNote resultante
   */
  block: Block;

  /**
   * Warnings durante a conversão
   */
  warnings: string[];

  /**
   * Assets que precisam ser processados
   */
  pendingAssets: NotionAsset[];
}

// =====================================================
// NOTION IMPORT JOB
// =====================================================

/**
 * Job de importação (para tracking de progresso)
 */
export interface NotionImportJob {
  /**
   * ID único do job
   */
  id: string;

  /**
   * ID do workspace de destino
   */
  workspaceId: string;

  /**
   * ID da página pai (opcional)
   */
  parentPageId?: string | null;

  /**
   * Caminho do arquivo ZIP no storage
   */
  zipFilePath: string;

  /**
   * Status do job
   */
  status: 'pending' | 'parsing' | 'importing' | 'uploading_assets' | 'completed' | 'failed';

  /**
   * Progresso (0-100)
   */
  progress: number;

  /**
   * Mensagem de status atual
   */
  currentStep: string;

  /**
   * Estatísticas
   */
  stats: {
    totalPages: number;
    processedPages: number;
    createdPages: number;
    skippedPages: number;
    uploadedAssets: number;
    errors: number;
  };

  /**
   * Erros ocorridos
   */
  errors: NotionImportError[];

  /**
   * Mapeamento de IDs (original → novo)
   */
  pageMapping: Record<string, string>;

  /**
   * Data de início
   */
  startedAt: string;

  /**
   * Data de conclusão
   */
  completedAt?: string;

  /**
   * Duração em ms
   */
  duration?: number;
}

/**
 * Erro durante importação
 */
export interface NotionImportError {
  type: 'parse' | 'validation' | 'database' | 'upload' | 'conversion' | 'unknown';
  message: string;
  filePath?: string;
  pageTitle?: string;
  details?: any;
  timestamp: string;
}

// =====================================================
// HELPER TYPES
// =====================================================

/**
 * Opções para extração de frontmatter
 */
export interface FrontmatterOptions {
  parseYaml: boolean;
  parseToml: boolean;
  strict: boolean;
}

/**
 * Resultado de extração de frontmatter
 */
export interface FrontmatterResult {
  data: Record<string, any>;
  content: string; // Conteúdo sem o frontmatter
  isEmpty: boolean;
}
