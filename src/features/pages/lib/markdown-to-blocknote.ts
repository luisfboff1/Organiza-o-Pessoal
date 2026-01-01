/**
 * Conversor de Markdown (do Notion) para BlockNote JSON
 *
 * Transforma o conteúdo exportado do Notion em blocos do BlockNote
 */

import MarkdownIt from 'markdown-it';
import { Block, InlineContent } from '../types';
import { NotionPage, ConversionConfig, BlockConversionResult } from '../types/notion';

// =====================================================
// MAIN CONVERSION FUNCTION
// =====================================================

/**
 * Converte uma página do Notion (Markdown) para blocos do BlockNote
 */
export async function convertNotionPageToBlocks(
  page: NotionPage,
  config: Partial<ConversionConfig> = {}
): Promise<Block[]> {
  const fullConfig: ConversionConfig = {
    preserveFormatting: true,
    convertSpecialBlocks: true,
    uploadAssets: false,
    convertInternalLinks: true,
    ...config,
  };

  // 1. Converter Markdown para tokens
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: false,
  });

  const tokens = md.parse(page.content, {});

  // 2. Converter tokens para blocos do BlockNote
  const blocks: Block[] = [];
  let i = 0;

  while (i < tokens.length) {
    const result = convertToken(tokens, i, fullConfig, page);
    if (result.block) {
      blocks.push(result.block);
    }
    i = result.nextIndex;
  }

  // 3. Filtrar blocos vazios
  return blocks.filter(block => {
    if (block.type === 'paragraph') {
      const hasContent = block.content && Array.isArray(block.content) && block.content.length > 0;
      if (!hasContent) return false;

      // Verificar se tem apenas texto vazio
      const firstItem = block.content?.[0] as any;
      if (typeof firstItem === 'string' && firstItem.trim() === '') {
        return (block.content?.length || 0) > 1;
      }
    }
    return true;
  });
}

// =====================================================
// TOKEN CONVERSION
// =====================================================

interface ConversionResult {
  block: Block | null;
  nextIndex: number;
}

/**
 * Converte um token do markdown-it para bloco do BlockNote
 */
function convertToken(
  tokens: any[],
  index: number,
  config: ConversionConfig,
  page: NotionPage
): ConversionResult {
  const token = tokens[index];

  switch (token.type) {
    case 'heading_open':
      return convertHeading(tokens, index);

    case 'paragraph_open':
      return convertParagraph(tokens, index, config);

    case 'bullet_list_open':
      return convertBulletList(tokens, index, config);

    case 'ordered_list_open':
      return convertOrderedList(tokens, index, config);

    case 'blockquote_open':
      return convertBlockquote(tokens, index, config);

    case 'code_block':
    case 'fence':
      return convertCodeBlock(token);

    case 'hr':
      return {
        block: { type: 'paragraph', content: [{ type: 'text', text: '---' }] as any },
        nextIndex: index + 1,
      };

    default:
      // Pular tokens que não criam blocos
      return { block: null, nextIndex: index + 1 };
  }
}

/**
 * Converte heading (#, ##, ###)
 */
function convertHeading(tokens: any[], index: number): ConversionResult {
  const openToken = tokens[index];
  const inlineToken = tokens[index + 1];
  const level = parseInt(openToken.tag.slice(1)); // h1 → 1, h2 → 2, etc.

  const content = inlineToken ? parseInlineContent(inlineToken) : [];

  return {
    block: {
      type: 'heading',
      props: { level: Math.min(level, 3) }, // BlockNote suporta h1-h3
      content,
    },
    nextIndex: index + 3, // heading_open, inline, heading_close
  };
}

/**
 * Converte parágrafo
 */
function convertParagraph(
  tokens: any[],
  index: number,
  config: ConversionConfig
): ConversionResult {
  const inlineToken = tokens[index + 1];

  if (!inlineToken || inlineToken.type !== 'inline') {
    return { block: null, nextIndex: index + 3 };
  }

  const content = parseInlineContent(inlineToken, config);

  return {
    block: {
      type: 'paragraph',
      content,
    },
    nextIndex: index + 3, // paragraph_open, inline, paragraph_close
  };
}

/**
 * Converte lista não-ordenada
 */
function convertBulletList(
  tokens: any[],
  index: number,
  config: ConversionConfig
): ConversionResult {
  const blocks: Block[] = [];
  let i = index + 1; // Pular bullet_list_open

  while (i < tokens.length && tokens[i].type !== 'bullet_list_close') {
    if (tokens[i].type === 'list_item_open') {
      const inlineToken = tokens[i + 2]; // list_item_open, paragraph_open, inline

      if (inlineToken && inlineToken.type === 'inline') {
        const content = parseInlineContent(inlineToken, config);

        // Verificar se é checkbox (Notion usa - [ ] ou - [x])
        const firstItem = content[0] as any;
        if (typeof firstItem === 'string') {
          const checkboxMatch = firstItem.match(/^\[([ x])\]\s*/);
          if (checkboxMatch) {
            blocks.push({
              type: 'checkListItem',
              props: { checked: checkboxMatch[1] === 'x' },
              content: [firstItem.slice(checkboxMatch[0].length), ...content.slice(1)] as any,
            });
            i = findClosingToken(tokens, i, 'list_item_open', 'list_item_close') + 1;
            continue;
          }
        }

        blocks.push({
          type: 'bulletListItem',
          content,
        });
      }

      i = findClosingToken(tokens, i, 'list_item_open', 'list_item_close') + 1;
    } else {
      i++;
    }
  }

  return {
    block: blocks.length > 0 ? blocks[0] : null,
    nextIndex: i + 1,
  };
}

/**
 * Converte lista ordenada
 */
function convertOrderedList(
  tokens: any[],
  index: number,
  config: ConversionConfig
): ConversionResult {
  const blocks: Block[] = [];
  let i = index + 1;

  while (i < tokens.length && tokens[i].type !== 'ordered_list_close') {
    if (tokens[i].type === 'list_item_open') {
      const inlineToken = tokens[i + 2];

      if (inlineToken && inlineToken.type === 'inline') {
        const content = parseInlineContent(inlineToken, config);
        blocks.push({
          type: 'numberedListItem',
          content,
        });
      }

      i = findClosingToken(tokens, i, 'list_item_open', 'list_item_close') + 1;
    } else {
      i++;
    }
  }

  return {
    block: blocks.length > 0 ? blocks[0] : null,
    nextIndex: i + 1,
  };
}

/**
 * Converte blockquote (citação)
 */
function convertBlockquote(
  tokens: any[],
  index: number,
  config: ConversionConfig
): ConversionResult {
  // Blockquote no BlockNote é representado como parágrafo normal
  // ou pode ser convertido para um bloco customizado
  const i = index + 1;
  const content: InlineContent[] = [];

  let current = i;
  while (current < tokens.length && tokens[current].type !== 'blockquote_close') {
    if (tokens[current].type === 'inline') {
      content.push(...parseInlineContent(tokens[current], config));
    }
    current++;
  }

  return {
    block: {
      type: 'paragraph',
      content,
    },
    nextIndex: current + 1,
  };
}

/**
 * Converte code block
 */
function convertCodeBlock(token: any): ConversionResult {
  return {
    block: {
      type: 'codeBlock',
      props: {
        language: token.info || 'plaintext',
      },
      content: [{ type: 'text', text: token.content }],
    },
    nextIndex: -1, // Será incrementado externamente
  };
}

// =====================================================
// INLINE CONTENT PARSING
// =====================================================

/**
 * Parseia conteúdo inline (texto com formatação)
 */
function parseInlineContent(
  inlineToken: any,
  config?: ConversionConfig
): InlineContent[] {
  if (!inlineToken.children) {
    return [{ type: 'text', text: inlineToken.content || '' }];
  }

  const content: InlineContent[] = [];

  for (const child of inlineToken.children) {
    switch (child.type) {
      case 'text':
        content.push({ type: 'text', text: child.content });
        break;

      case 'strong_open':
      case 'em_open':
      case 'code_inline':
      case 's_open':
        // Processar formatação inline
        const formatted = processFormattedText(inlineToken.children, child);
        if (formatted) content.push(...formatted.content);
        break;

      case 'link_open':
        const link = processLink(inlineToken.children, child, config);
        if (link) content.push(link);
        break;

      case 'softbreak':
      case 'hardbreak':
        content.push({ type: 'text', text: '\n' });
        break;
    }
  }

  return content;
}

/**
 * Processa texto formatado (bold, italic, etc.)
 */
function processFormattedText(
  tokens: any[],
  openToken: any
): { content: InlineContent[]; skip: number } | null {
  const startIndex = tokens.indexOf(openToken);
  if (startIndex === -1) return null;

  const styles: InlineContent['styles'] = {};
  let text = '';
  let i = startIndex;

  while (i < tokens.length) {
    const token = tokens[i];

    if (token.type === 'text') {
      text += token.content;
    } else if (token.type === 'strong_open') {
      styles.bold = true;
    } else if (token.type === 'em_open') {
      styles.italic = true;
    } else if (token.type === 'code_inline') {
      styles.code = true;
      text += token.content;
    } else if (token.type === 's_open') {
      styles.strikethrough = true;
    } else if (
      token.type === 'strong_close' ||
      token.type === 'em_close' ||
      token.type === 's_close'
    ) {
      break;
    }

    i++;
  }

  return {
    content: [{ type: 'text', text, styles: Object.keys(styles).length > 0 ? styles : undefined }],
    skip: i - startIndex,
  };
}

/**
 * Processa link
 */
function processLink(
  tokens: any[],
  openToken: any,
  config?: ConversionConfig
): InlineContent | null {
  const startIndex = tokens.indexOf(openToken);
  if (startIndex === -1) return null;

  const href = openToken.attrGet('href');
  const textToken = tokens[startIndex + 1];
  const text = textToken?.content || href;

  // Verificar se é link interno [[Page Name]]
  if (config?.convertInternalLinks && href?.startsWith('#')) {
    // Pode ser convertido para page link depois
    return { type: 'text', text: `[[${text}]]` };
  }

  return {
    type: 'link',
    text,
    href,
  };
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Encontra token de fechamento correspondente
 */
function findClosingToken(
  tokens: any[],
  openIndex: number,
  openType: string,
  closeType: string
): number {
  let depth = 1;
  let i = openIndex + 1;

  while (i < tokens.length && depth > 0) {
    if (tokens[i].type === openType) {
      depth++;
    } else if (tokens[i].type === closeType) {
      depth--;
    }
    i++;
  }

  return i - 1;
}

/**
 * Converte texto simples para blocos
 */
export function textToBlocks(text: string): Block[] {
  const lines = text.split('\n');

  return lines
    .filter(line => line.trim().length > 0)
    .map(line => ({
      type: 'paragraph',
      content: [{ type: 'text', text: line }],
    }));
}

/**
 * Extrai texto plano de blocos (para indexação)
 */
export function blocksToPlainText(blocks: Block[]): string {
  return blocks.map(block => blockToPlainText(block)).join('\n\n');
}

function blockToPlainText(block: Block): string {
  if (!block.content || !Array.isArray(block.content)) {
    return '';
  }

  return block.content
    .map((item: any) => {
      if (typeof item === 'string') return item;
      if (item.type === 'text') return item.text || '';
      return '';
    })
    .join('');
}
