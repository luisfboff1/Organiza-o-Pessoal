/**
 * Converte blocos BlockNote para Markdown
 */

import type { Block } from '@blocknote/core';

export interface BlockNoteToMarkdownOptions {
  /** Incluir frontmatter YAML com metadados */
  includeFrontmatter?: boolean;
  /** Metadados para incluir no frontmatter */
  metadata?: {
    title?: string;
    icon?: string;
    created_at?: string;
    updated_at?: string;
    tags?: string[];
    [key: string]: any;
  };
  /** Preservar IDs dos blocos como comentários HTML */
  preserveBlockIds?: boolean;
}

/**
 * Converte array de blocos BlockNote para Markdown
 */
export function convertBlockNoteToMarkdown(
  blocks: Block[],
  options: BlockNoteToMarkdownOptions = {}
): string {
  const lines: string[] = [];

  // Adicionar frontmatter se solicitado
  if (options.includeFrontmatter && options.metadata) {
    lines.push('---');
    Object.entries(options.metadata).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          lines.push(`${key}:`);
          value.forEach((item) => lines.push(`  - ${item}`));
        } else if (typeof value === 'object') {
          lines.push(`${key}: ${JSON.stringify(value)}`);
        } else {
          lines.push(`${key}: ${value}`);
        }
      }
    });
    lines.push('---');
    lines.push('');
  }

  // Converter cada bloco
  blocks.forEach((block, index) => {
    const markdown = convertBlockToMarkdown(block, 0, options);
    if (markdown) {
      lines.push(markdown);
      // Adicionar linha em branco entre blocos (exceto último)
      if (index < blocks.length - 1) {
        lines.push('');
      }
    }
  });

  return lines.join('\n');
}

/**
 * Converte um único bloco para Markdown
 */
function convertBlockToMarkdown(
  block: Block,
  level: number,
  options: BlockNoteToMarkdownOptions
): string {
  const lines: string[] = [];

  // Adicionar ID do bloco como comentário se solicitado
  if (options.preserveBlockIds && (block as any).id) {
    lines.push(`<!-- block-id: ${(block as any).id} -->`);
  }

  // Converter baseado no tipo do bloco
  switch ((block as any).type) {
    case 'paragraph':
      lines.push(convertParagraph(block));
      break;

    case 'heading':
      lines.push(convertHeading(block));
      break;

    case 'bulletListItem':
      lines.push(convertBulletListItem(block, level));
      break;

    case 'numberedListItem':
      lines.push(convertNumberedListItem(block, level));
      break;

    case 'checkListItem':
      lines.push(convertCheckListItem(block, level));
      break;

    case 'codeBlock':
      lines.push(convertCodeBlock(block));
      break;

    case 'quote':
      lines.push(convertQuote(block));
      break;

    case 'table':
      lines.push(convertTable(block));
      break;

    case 'image':
      lines.push(convertImage(block));
      break;

    case 'video':
      lines.push(convertVideo(block));
      break;

    case 'audio':
      lines.push(convertAudio(block));
      break;

    case 'file':
      lines.push(convertFile(block));
      break;

    case 'spreadsheet':
      lines.push(convertSpreadsheet(block));
      break;

    case 'pageLink':
      lines.push(convertPageLink(block));
      break;

    default:
      // Bloco desconhecido - tentar converter conteúdo genérico
      lines.push(convertGenericBlock(block));
  }

  // Converter blocos filhos recursivamente
  if ((block as any).children && (block as any).children.length > 0) {
    (block as any).children.forEach((child: any) => {
      const childMarkdown = convertBlockToMarkdown(child, level + 1, options);
      if (childMarkdown) {
        lines.push(childMarkdown);
      }
    });
  }

  return lines.join('\n');
}

/**
 * Converte conteúdo inline (texto com formatação)
 */
function convertInlineContent(content: any): string {
  if (!content) return '';

  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content.map((item) => {
      if (typeof item === 'string') {
        return item;
      }

      let text = item.text || '';

      // Aplicar estilos inline
      if (item.styles) {
        if (item.styles.bold) text = `**${text}**`;
        if (item.styles.italic) text = `*${text}*`;
        if (item.styles.underline) text = `<u>${text}</u>`;
        if (item.styles.strike) text = `~~${text}~~`;
        if (item.styles.code) text = `\`${text}\``;
      }

      // Link
      if (item.type === 'link') {
        text = `[${text}](${item.href})`;
      }

      return text;
    }).join('');
  }

  return String(content);
}

// Conversores específicos por tipo de bloco

function convertParagraph(block: Block): string {
  return convertInlineContent((block as any).content);
}

function convertHeading(block: Block): string {
  const level = ((block as any).props?.level as number) || 1;
  const prefix = '#'.repeat(Math.min(level, 6));
  return `${prefix} ${convertInlineContent((block as any).content)}`;
}

function convertBulletListItem(block: Block, level: number): string {
  const indent = '  '.repeat(level);
  return `${indent}- ${convertInlineContent((block as any).content)}`;
}

function convertNumberedListItem(block: Block, level: number): string {
  const indent = '  '.repeat(level);
  return `${indent}1. ${convertInlineContent((block as any).content)}`;
}

function convertCheckListItem(block: Block, level: number): string {
  const indent = '  '.repeat(level);
  const checked = (block as any).props?.checked ? 'x' : ' ';
  return `${indent}- [${checked}] ${convertInlineContent((block as any).content)}`;
}

function convertCodeBlock(block: Block): string {
  const language = (block as any).props?.language || '';
  const code = convertInlineContent((block as any).content);
  return `\`\`\`${language}\n${code}\n\`\`\``;
}

function convertQuote(block: Block): string {
  const content = convertInlineContent((block as any).content);
  return content
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n');
}

function convertTable(block: Block): string {
  const rows = ((block as any).content as any)?.rows || [];
  if (rows.length === 0) return '';

  const lines: string[] = [];

  // Header
  const headers = rows[0]?.cells || [];
  lines.push(`| ${headers.map((cell: any) => convertInlineContent(cell)).join(' | ')} |`);

  // Separator
  lines.push(`| ${headers.map(() => '---').join(' | ')} |`);

  // Body rows
  rows.slice(1).forEach((row: any) => {
    const cells = row.cells || [];
    lines.push(`| ${cells.map((cell: any) => convertInlineContent(cell)).join(' | ')} |`);
  });

  return lines.join('\n');
}

function convertImage(block: Block): string {
  const url = (block as any).props?.url || '';
  const caption = (block as any).props?.caption || 'image';
  return `![${caption}](${url})`;
}

function convertVideo(block: Block): string {
  const url = (block as any).props?.url || '';
  const caption = (block as any).props?.caption || 'video';
  return `[${caption}](${url})`;
}

function convertAudio(block: Block): string {
  const url = (block as any).props?.url || '';
  const caption = (block as any).props?.caption || 'audio';
  return `[${caption}](${url})`;
}

function convertFile(block: Block): string {
  const url = (block as any).props?.url || '';
  const name = (block as any).props?.name || 'file';
  return `[${name}](${url})`;
}

function convertSpreadsheet(block: Block): string {
  try {
    const dataJson = (block as any).props?.dataJson as string;
    if (!dataJson) return '';

    const data = JSON.parse(dataJson);
    if (!Array.isArray(data) || data.length === 0) return '';

    const lines: string[] = [];

    // Primeira linha como header
    lines.push(`| ${data[0].join(' | ')} |`);
    lines.push(`| ${data[0].map(() => '---').join(' | ')} |`);

    // Demais linhas
    data.slice(1).forEach((row) => {
      lines.push(`| ${row.join(' | ')} |`);
    });

    return lines.join('\n');
  } catch (error) {
    console.error('Error converting spreadsheet:', error);
    return '';
  }
}

function convertPageLink(block: Block): string {
  const pageTitle = (block as any).props?.pageTitle || 'Unknown Page';
  const pageId = (block as any).props?.pageId || '';

  // Formato Notion-like: [[Page Title]]
  return `[[${pageTitle}]]`;
}

function convertGenericBlock(block: Block): string {
  // Fallback para blocos desconhecidos
  return convertInlineContent((block as any).content);
}

/**
 * Exporta página completa com metadados
 */
export async function exportPageToMarkdown(page: {
  title: string;
  icon?: string | null;
  content: Block[];
  created_at?: string;
  updated_at?: string;
}): Promise<string> {
  return convertBlockNoteToMarkdown(page.content, {
    includeFrontmatter: true,
    metadata: {
      title: page.title,
      icon: page.icon || undefined,
      created_at: page.created_at,
      updated_at: page.updated_at,
    },
  });
}
