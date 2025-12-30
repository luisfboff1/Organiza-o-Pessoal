/**
 * Converte blocos do BlockNote para texto plano
 * Usado para indexação e busca
 */

type Block = {
  type?: string;
  content?: Array<{ text?: string; type?: string }>;
  children?: Block[];
  [key: string]: any;
};

export function blocksToPlainText(blocks: any): string {
  if (!blocks || !Array.isArray(blocks)) {
    return '';
  }

  const extractText = (block: Block): string => {
    let text = '';

    // Extrair texto do conteúdo
    if (block.content && Array.isArray(block.content)) {
      text += block.content
        .map((c) => {
          if (typeof c === 'string') return c;
          if (c.text) return c.text;
          return '';
        })
        .join('');
    }

    // Processar filhos recursivamente
    if (block.children && Array.isArray(block.children)) {
      text += '\n' + block.children.map(extractText).join('\n');
    }

    return text;
  };

  return blocks
    .map(extractText)
    .filter(Boolean)
    .join('\n')
    .trim();
}
