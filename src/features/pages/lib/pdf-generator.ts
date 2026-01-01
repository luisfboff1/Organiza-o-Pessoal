/**
 * Gera PDFs a partir de blocos BlockNote
 */

import jsPDF from 'jspdf';
import type { Block } from '@blocknote/core';

export interface PDFExportOptions {
  /** Título do documento */
  title?: string;
  /** Ícone da página */
  icon?: string | null;
  /** Incluir metadados no cabeçalho */
  includeMetadata?: boolean;
  /** Data de criação */
  createdAt?: string;
  /** Data de atualização */
  updatedAt?: string;
  /** Tamanho da página */
  pageSize?: 'a4' | 'letter';
  /** Orientação */
  orientation?: 'portrait' | 'landscape';
}

interface PDFContext {
  doc: jsPDF;
  currentY: number;
  pageHeight: number;
  pageWidth: number;
  margin: number;
  fontSize: {
    h1: number;
    h2: number;
    h3: number;
    normal: number;
    small: number;
  };
  lineHeight: number;
  listLevel: number;
}

/**
 * Exporta blocos BlockNote para PDF
 */
export async function exportBlockNoteToPDF(
  blocks: Block[],
  options: PDFExportOptions = {}
): Promise<Blob> {
  const {
    title,
    icon,
    includeMetadata = true,
    createdAt,
    updatedAt,
    pageSize = 'a4',
    orientation = 'portrait',
  } = options;

  // Criar documento PDF
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: pageSize,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  const context: PDFContext = {
    doc,
    currentY: margin,
    pageHeight,
    pageWidth,
    margin,
    fontSize: {
      h1: 24,
      h2: 20,
      h3: 16,
      normal: 12,
      small: 10,
    },
    lineHeight: 1.5,
    listLevel: 0,
  };

  // Adicionar cabeçalho com título e metadados
  if (includeMetadata && title) {
    addPageHeader(context, title, icon, createdAt, updatedAt);
  }

  // Converter cada bloco
  for (const block of blocks) {
    await convertBlockToPDF(block, context);
  }

  // Adicionar números de página
  addPageNumbers(doc);

  // Retornar como Blob
  return doc.output('blob');
}

/**
 * Adiciona cabeçalho da página
 */
function addPageHeader(
  ctx: PDFContext,
  title: string,
  icon?: string | null,
  createdAt?: string,
  updatedAt?: string
) {
  const { doc, margin, pageWidth, fontSize } = ctx;

  // Título
  doc.setFontSize(fontSize.h1);
  doc.setFont('helvetica', 'bold');

  const titleText = icon ? `${icon} ${title}` : title;
  doc.text(titleText, margin, ctx.currentY);
  ctx.currentY += fontSize.h1 * 0.5;

  // Linha separadora
  doc.setLineWidth(0.5);
  doc.line(margin, ctx.currentY, pageWidth - margin, ctx.currentY);
  ctx.currentY += 5;

  // Metadados
  if (createdAt || updatedAt) {
    doc.setFontSize(fontSize.small);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);

    if (createdAt) {
      const date = new Date(createdAt).toLocaleDateString('pt-BR');
      doc.text(`Criado em: ${date}`, margin, ctx.currentY);
      ctx.currentY += fontSize.small * 0.5;
    }

    if (updatedAt) {
      const date = new Date(updatedAt).toLocaleDateString('pt-BR');
      doc.text(`Atualizado em: ${date}`, margin, ctx.currentY);
      ctx.currentY += fontSize.small * 0.5;
    }

    doc.setTextColor(0);
    ctx.currentY += 5;
  }
}

/**
 * Converte um bloco para PDF
 */
async function convertBlockToPDF(block: Block, ctx: PDFContext): Promise<void> {
  checkPageBreak(ctx, 20); // Verificar se precisa de nova página

  switch ((block as any).type) {
    case 'paragraph':
      addParagraph(ctx, block);
      break;

    case 'heading':
      addHeading(ctx, block);
      break;

    case 'bulletListItem':
      addBulletListItem(ctx, block);
      break;

    case 'numberedListItem':
      addNumberedListItem(ctx, block);
      break;

    case 'checkListItem':
      addCheckListItem(ctx, block);
      break;

    case 'codeBlock':
      addCodeBlock(ctx, block);
      break;

    case 'quote':
      addQuote(ctx, block);
      break;

    case 'table':
      addTable(ctx, block);
      break;

    case 'spreadsheet':
      addSpreadsheet(ctx, block);
      break;

    case 'pageLink':
      addPageLink(ctx, block);
      break;

    default:
      addGenericBlock(ctx, block);
  }

  // Processar blocos filhos
  if ((block as any).children && (block as any).children.length > 0) {
    ctx.listLevel++;
    for (const child of (block as any).children) {
      await convertBlockToPDF(child, ctx);
    }
    ctx.listLevel--;
  }
}

/**
 * Extrai texto de conteúdo inline
 */
function extractText(content: any): string {
  if (!content) return '';
  if (typeof content === 'string') return content;

  if (Array.isArray(content)) {
    return content.map((item) => {
      if (typeof item === 'string') return item;
      return item.text || '';
    }).join('');
  }

  return String(content);
}

/**
 * Verifica se precisa de quebra de página
 */
function checkPageBreak(ctx: PDFContext, requiredSpace: number) {
  if (ctx.currentY + requiredSpace > ctx.pageHeight - ctx.margin) {
    ctx.doc.addPage();
    ctx.currentY = ctx.margin;
  }
}

/**
 * Adiciona texto com quebra de linha automática
 */
function addText(
  ctx: PDFContext,
  text: string,
  fontSize: number,
  fontStyle: 'normal' | 'bold' | 'italic' = 'normal',
  indent: number = 0
) {
  const { doc, margin, pageWidth } = ctx;
  const maxWidth = pageWidth - 2 * margin - indent;

  doc.setFontSize(fontSize);
  doc.setFont('helvetica', fontStyle);

  const lines = doc.splitTextToSize(text, maxWidth);

  lines.forEach((line: string) => {
    checkPageBreak(ctx, fontSize * ctx.lineHeight * 0.5);
    doc.text(line, margin + indent, ctx.currentY);
    ctx.currentY += fontSize * ctx.lineHeight * 0.35;
  });

  ctx.currentY += 2; // Espaço após o texto
}

// Conversores por tipo de bloco

function addParagraph(ctx: PDFContext, block: Block) {
  const text = extractText((block as any).content);
  if (text.trim()) {
    addText(ctx, text, ctx.fontSize.normal);
  }
}

function addHeading(ctx: PDFContext, block: Block) {
  const level = ((block as any).props?.level as number) || 1;
  const text = extractText((block as any).content);

  let fontSize: number;
  switch (level) {
    case 1:
      fontSize = ctx.fontSize.h1;
      break;
    case 2:
      fontSize = ctx.fontSize.h2;
      break;
    default:
      fontSize = ctx.fontSize.h3;
  }

  ctx.currentY += 3; // Espaço antes do título
  addText(ctx, text, fontSize, 'bold');
  ctx.currentY += 2; // Espaço após o título
}

function addBulletListItem(ctx: PDFContext, block: Block) {
  const text = extractText((block as any).content);
  const indent = ctx.listLevel * 10;

  ctx.doc.setFontSize(ctx.fontSize.normal);
  ctx.doc.text('•', ctx.margin + indent, ctx.currentY);

  addText(ctx, text, ctx.fontSize.normal, 'normal', indent + 5);
}

function addNumberedListItem(ctx: PDFContext, block: Block) {
  const text = extractText((block as any).content);
  const indent = ctx.listLevel * 10;

  ctx.doc.setFontSize(ctx.fontSize.normal);
  ctx.doc.text('1.', ctx.margin + indent, ctx.currentY);

  addText(ctx, text, ctx.fontSize.normal, 'normal', indent + 8);
}

function addCheckListItem(ctx: PDFContext, block: Block) {
  const text = extractText((block as any).content);
  const checked = (block as any).props?.checked || false;
  const indent = ctx.listLevel * 10;

  ctx.doc.setFontSize(ctx.fontSize.normal);
  const checkbox = checked ? '☑' : '☐';
  ctx.doc.text(checkbox, ctx.margin + indent, ctx.currentY);

  addText(ctx, text, ctx.fontSize.normal, 'normal', indent + 8);
}

function addCodeBlock(ctx: PDFContext, block: Block) {
  const code = extractText((block as any).content);
  const language = (block as any).props?.language || '';

  ctx.currentY += 2;

  // Fundo cinza para código
  const { doc, margin, pageWidth } = ctx;
  const codeLines = code.split('\n');
  const boxHeight = codeLines.length * ctx.fontSize.small * ctx.lineHeight * 0.35 + 4;

  checkPageBreak(ctx, boxHeight);

  doc.setFillColor(240, 240, 240);
  doc.rect(margin, ctx.currentY - 2, pageWidth - 2 * margin, boxHeight, 'F');

  // Título da linguagem
  if (language) {
    doc.setFontSize(ctx.fontSize.small);
    doc.setTextColor(100);
    doc.text(language, margin + 2, ctx.currentY + 2);
    ctx.currentY += 5;
  }

  // Código
  doc.setFontSize(ctx.fontSize.small);
  doc.setTextColor(0);
  doc.setFont('courier', 'normal');

  codeLines.forEach((line) => {
    checkPageBreak(ctx, ctx.fontSize.small * ctx.lineHeight * 0.5);
    doc.text(line, margin + 2, ctx.currentY);
    ctx.currentY += ctx.fontSize.small * ctx.lineHeight * 0.35;
  });

  doc.setFont('helvetica', 'normal');
  ctx.currentY += 4;
}

function addQuote(ctx: PDFContext, block: Block) {
  const text = extractText((block as any).content);
  const { doc, margin } = ctx;

  ctx.currentY += 2;

  // Linha vertical à esquerda
  doc.setLineWidth(2);
  doc.setDrawColor(200);
  const startY = ctx.currentY;

  // Texto em itálico
  doc.setFontSize(ctx.fontSize.normal);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(80);

  const maxWidth = ctx.pageWidth - 2 * margin - 10;
  const lines = doc.splitTextToSize(text, maxWidth);

  lines.forEach((line: string) => {
    checkPageBreak(ctx, ctx.fontSize.normal * ctx.lineHeight * 0.5);
    doc.text(line, margin + 10, ctx.currentY);
    ctx.currentY += ctx.fontSize.normal * ctx.lineHeight * 0.35;
  });

  // Desenhar linha vertical
  doc.line(margin + 3, startY, margin + 3, ctx.currentY - 2);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  ctx.currentY += 2;
}

function addTable(ctx: PDFContext, block: Block) {
  const rows = ((block as any).content as any)?.rows || [];
  if (rows.length === 0) return;

  // Simplificado: renderizar como texto
  rows.forEach((row: any, index: number) => {
    const cells = row.cells || [];
    const rowText = cells.map((cell: any) => extractText(cell)).join(' | ');
    addText(ctx, rowText, ctx.fontSize.small, index === 0 ? 'bold' : 'normal');
  });
}

function addSpreadsheet(ctx: PDFContext, block: Block) {
  try {
    const dataJson = (block as any).props?.dataJson as string;
    if (!dataJson) return;

    const data = JSON.parse(dataJson);
    if (!Array.isArray(data) || data.length === 0) return;

    data.forEach((row, index) => {
      const rowText = row.join(' | ');
      addText(ctx, rowText, ctx.fontSize.small, index === 0 ? 'bold' : 'normal');
    });
  } catch (error) {
    console.error('Error adding spreadsheet to PDF:', error);
  }
}

function addPageLink(ctx: PDFContext, block: Block) {
  const pageTitle = (block as any).props?.pageTitle || 'Unknown Page';

  ctx.doc.setFontSize(ctx.fontSize.normal);
  ctx.doc.setTextColor(0, 0, 255);
  ctx.doc.setFont('helvetica', 'normal');

  ctx.doc.text(`→ ${pageTitle}`, ctx.margin, ctx.currentY);

  ctx.doc.setTextColor(0);
  ctx.currentY += ctx.fontSize.normal * ctx.lineHeight * 0.35 + 2;
}

function addGenericBlock(ctx: PDFContext, block: Block) {
  const text = extractText((block as any).content);
  if (text.trim()) {
    addText(ctx, text, ctx.fontSize.normal);
  }
}

/**
 * Adiciona números de página
 */
function addPageNumbers(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }
}

/**
 * Exporta página completa para PDF
 */
export async function exportPageToPDF(page: {
  title: string;
  icon?: string | null;
  content: Block[];
  created_at?: string;
  updated_at?: string;
}): Promise<Blob> {
  return exportBlockNoteToPDF(page.content, {
    title: page.title,
    icon: page.icon,
    includeMetadata: true,
    createdAt: page.created_at,
    updatedAt: page.updated_at,
  });
}
