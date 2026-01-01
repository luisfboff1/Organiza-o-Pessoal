/**
 * Parser para arquivos ZIP exportados do Notion
 *
 * Responsável por:
 * - Extrair arquivos .md do ZIP
 * - Parsear frontmatter e metadados
 * - Construir hierarquia de pastas
 * - Identificar assets e links
 */

import JSZip from 'jszip';
import {
  NotionPage,
  NotionPageMetadata,
  NotionLink,
  NotionAsset,
  NotionParseResult,
  NotionHierarchy,
  NotionParseWarning,
} from '../types/notion';

// =====================================================
// MAIN PARSER FUNCTION
// =====================================================

/**
 * Parseia um arquivo ZIP exportado do Notion
 */
export async function parseNotionZip(file: File): Promise<NotionParseResult> {
  const startTime = Date.now();
  const warnings: NotionParseWarning[] = [];

  try {
    // 1. Carregar ZIP
    const zip = await JSZip.loadAsync(file);

    // 2. Listar todos os arquivos
    const files = Object.keys(zip.files).filter(name => !zip.files[name].dir);

    // 3. Separar .md de assets
    const mdFiles = files.filter(f => f.endsWith('.md'));
    const assetFiles = files.filter(f => !f.endsWith('.md'));

    // 4. Parsear cada arquivo .md
    const pages: NotionPage[] = [];
    for (const filePath of mdFiles) {
      try {
        const content = await zip.files[filePath].async('text');
        const page = await parseNotionMarkdownFile(filePath, content, warnings);
        pages.push(page);
      } catch (error) {
        warnings.push({
          type: 'invalid_markdown',
          message: `Erro ao parsear ${filePath}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          filePath,
          severity: 'error',
        });
      }
    }

    // 5. Processar assets
    const assets: NotionAsset[] = [];
    for (const filePath of assetFiles) {
      try {
        const asset = await processAssetFile(zip, filePath);
        if (asset) assets.push(asset);
      } catch (error) {
        warnings.push({
          type: 'missing_asset',
          message: `Erro ao processar asset ${filePath}`,
          filePath,
          severity: 'warning',
        });
      }
    }

    // 6. Construir hierarquia
    const hierarchy = buildHierarchy(pages);

    // 7. Calcular estatísticas
    const stats = {
      totalFiles: files.length,
      totalPages: pages.length,
      totalAssets: assets.length,
      totalLinks: pages.reduce((sum, p) => sum + p.links.length, 0),
      depth: calculateMaxDepth(hierarchy),
    };

    const duration = Date.now() - startTime;

    console.log(`✅ Notion ZIP parseado em ${duration}ms:`, stats);

    return {
      pages,
      hierarchy,
      assets,
      stats,
      warnings,
    };
  } catch (error) {
    throw new Error(`Erro ao parsear ZIP do Notion: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

// =====================================================
// MARKDOWN FILE PARSING
// =====================================================

/**
 * Parseia um arquivo .md individual do Notion
 */
async function parseNotionMarkdownFile(
  filePath: string,
  content: string,
  warnings: NotionParseWarning[]
): Promise<NotionPage> {
  // 1. Extrair frontmatter (se existir)
  const { metadata, contentWithoutFrontmatter } = extractFrontmatter(content);

  // 2. Extrair título
  const title = extractTitle(filePath, contentWithoutFrontmatter);

  // 3. Extrair links [[Page Name]]
  const links = extractPageLinks(contentWithoutFrontmatter);

  // 4. Identificar assets referenciados
  const assets = identifyReferencedAssets(contentWithoutFrontmatter, filePath);

  // 5. Determinar path da pasta pai
  const parentPath = getParentPath(filePath);

  return {
    title,
    filePath,
    content: contentWithoutFrontmatter,
    metadata,
    links,
    assets,
    parentPath,
  };
}

/**
 * Extrai frontmatter YAML do início do arquivo
 */
function extractFrontmatter(content: string): {
  metadata: NotionPageMetadata;
  contentWithoutFrontmatter: string;
} {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return {
      metadata: {},
      contentWithoutFrontmatter: content,
    };
  }

  const yamlContent = match[1];
  const contentWithoutFrontmatter = content.slice(match[0].length);

  // Parser YAML simples (para casos básicos)
  const metadata: NotionPageMetadata = {};
  const lines = yamlContent.split('\n');

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();

    // Remove aspas
    const cleanValue = value.replace(/^["']|["']$/g, '');

    switch (key.toLowerCase()) {
      case 'id':
      case 'notion_id':
        metadata.originalId = cleanValue;
        break;
      case 'created':
      case 'created_at':
        metadata.createdAt = cleanValue;
        break;
      case 'updated':
      case 'updated_at':
        metadata.updatedAt = cleanValue;
        break;
      case 'icon':
        metadata.icon = cleanValue;
        break;
      case 'cover':
        metadata.cover = cleanValue;
        break;
      case 'status':
        metadata.status = cleanValue;
        break;
      case 'tags':
        metadata.tags = cleanValue.split(',').map(t => t.trim());
        break;
    }
  }

  return { metadata, contentWithoutFrontmatter };
}

/**
 * Extrai o título da página
 * Prioridade: 1) Primeiro # Heading, 2) Nome do arquivo
 */
function extractTitle(filePath: string, content: string): string {
  // Tentar extrair do primeiro heading
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch) {
    return headingMatch[1].trim();
  }

  // Fallback: usar nome do arquivo sem extensão
  const fileName = filePath.split('/').pop() || filePath;
  return fileName.replace(/\.md$/, '').trim();
}

/**
 * Extrai links para outras páginas [[Page Name]]
 */
function extractPageLinks(content: string): NotionLink[] {
  const linkRegex = /\[\[([^\]]+)\]\]/g;
  const links: NotionLink[] = [];
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    links.push({
      text: match[1],
      type: 'page',
      position: {
        start: match.index,
        end: match.index + match[0].length,
      },
    });
  }

  return links;
}

/**
 * Identifica assets referenciados no markdown (imagens, etc.)
 */
function identifyReferencedAssets(content: string, currentFilePath: string): NotionAsset[] {
  const assets: NotionAsset[] = [];

  // Padrão: ![alt](path) ou ![alt](path "title")
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;

  while ((match = imageRegex.exec(content)) !== null) {
    const assetPath = match[2].split(' ')[0]; // Remove título se houver

    // Resolver caminho relativo
    const resolvedPath = resolveAssetPath(assetPath, currentFilePath);

    assets.push({
      type: 'image',
      originalPath: resolvedPath,
      fileName: assetPath.split('/').pop() || assetPath,
      mimeType: getMimeTypeFromExtension(assetPath),
      size: 0, // Será preenchido depois
    });
  }

  return assets;
}

/**
 * Resolve caminho de asset relativo
 */
function resolveAssetPath(assetPath: string, markdownFilePath: string): string {
  // Se já é caminho absoluto no ZIP, retornar
  if (!assetPath.startsWith('.')) {
    return assetPath;
  }

  // Resolver caminho relativo
  const dirPath = markdownFilePath.split('/').slice(0, -1).join('/');
  const parts = assetPath.split('/');
  const resolvedParts = dirPath ? dirPath.split('/') : [];

  for (const part of parts) {
    if (part === '..') {
      resolvedParts.pop();
    } else if (part !== '.') {
      resolvedParts.push(part);
    }
  }

  return resolvedParts.join('/');
}

/**
 * Determina MIME type pela extensão
 */
function getMimeTypeFromExtension(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();

  const mimeTypes: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
  };

  return mimeTypes[ext || ''] || 'application/octet-stream';
}

/**
 * Extrai caminho da pasta pai
 */
function getParentPath(filePath: string): string | null {
  const parts = filePath.split('/');
  if (parts.length <= 1) return null;

  return parts.slice(0, -1).join('/');
}

// =====================================================
// ASSET PROCESSING
// =====================================================

/**
 * Processa um arquivo de asset do ZIP
 */
async function processAssetFile(zip: JSZip, filePath: string): Promise<NotionAsset | null> {
  const file = zip.files[filePath];
  if (!file || file.dir) return null;

  // Determinar tipo
  const fileName = filePath.split('/').pop() || filePath;
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  let type: NotionAsset['type'] = 'file';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
    type = 'image';
  } else if (['mp4', 'webm', 'mov'].includes(ext)) {
    type = 'video';
  } else if (['mp3', 'wav', 'ogg'].includes(ext)) {
    type = 'audio';
  }

  // Carregar dados
  const data = await file.async('arraybuffer');

  return {
    type,
    originalPath: filePath,
    fileName,
    mimeType: getMimeTypeFromExtension(fileName),
    size: data.byteLength,
    data,
  };
}

// =====================================================
// HIERARCHY BUILDING
// =====================================================

/**
 * Constrói hierarquia de pastas a partir das páginas
 */
function buildHierarchy(pages: NotionPage[]): NotionHierarchy[] {
  const rootNodes: NotionHierarchy[] = [];
  const nodesByPath = new Map<string, NotionHierarchy>();

  // 1. Criar todos os nós (pastas e páginas)
  const allPaths = new Set<string>();

  for (const page of pages) {
    // Adicionar todos os caminhos de pastas
    const parts = page.filePath.split('/');
    for (let i = 1; i < parts.length; i++) {
      const folderPath = parts.slice(0, i).join('/');
      allPaths.add(folderPath);
    }
  }

  // 2. Criar nós de pastas
  for (const path of Array.from(allPaths).sort()) {
    const parts = path.split('/');
    const name = parts[parts.length - 1];

    const node: NotionHierarchy = {
      name,
      path,
      isFolder: true,
      children: [],
    };

    nodesByPath.set(path, node);
  }

  // 3. Criar nós de páginas e anexar às pastas
  for (const page of pages) {
    const parts = page.filePath.split('/');
    const name = parts[parts.length - 1].replace(/\.md$/, '');
    const path = page.filePath;

    const node: NotionHierarchy = {
      name,
      path,
      isFolder: false,
      children: [],
      page,
    };

    // Anexar à pasta pai ou root
    if (page.parentPath) {
      const parent = nodesByPath.get(page.parentPath);
      if (parent) {
        parent.children.push(node);
      }
    } else {
      rootNodes.push(node);
    }
  }

  // 4. Construir hierarquia de pastas
  const rootFolders: NotionHierarchy[] = [];

  for (const [path, node] of nodesByPath.entries()) {
    const parentPath = getParentPath(path);
    if (parentPath && nodesByPath.has(parentPath)) {
      const parent = nodesByPath.get(parentPath)!;
      parent.children.push(node);
    } else {
      rootFolders.push(node);
    }
  }

  // 5. Combinar pastas root e páginas root
  return [...rootFolders, ...rootNodes].sort((a, b) => {
    // Pastas primeiro, depois páginas
    if (a.isFolder && !b.isFolder) return -1;
    if (!a.isFolder && b.isFolder) return 1;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Calcula profundidade máxima da hierarquia
 */
function calculateMaxDepth(nodes: NotionHierarchy[], currentDepth = 0): number {
  if (nodes.length === 0) return currentDepth;

  let maxDepth = currentDepth;

  for (const node of nodes) {
    const childDepth = calculateMaxDepth(node.children, currentDepth + 1);
    maxDepth = Math.max(maxDepth, childDepth);
  }

  return maxDepth;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Valida se um arquivo é um ZIP válido
 */
export function isValidNotionZip(file: File): boolean {
  return file.type === 'application/zip' || file.name.endsWith('.zip');
}

/**
 * Valida tamanho do arquivo (máximo 100MB)
 */
export function validateZipSize(file: File, maxSizeMB = 100): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxBytes;
}
