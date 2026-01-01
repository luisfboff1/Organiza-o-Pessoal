'use server';

/**
 * Server action para exportar páginas
 */

import { createServerClient } from '@/lib/supabase/server';
import { exportPageToMarkdown } from '../lib/blocknote-to-markdown';
import { exportPageToPDF } from '../lib/pdf-generator';
import type { Block } from '@blocknote/core';

export type ExportFormat = 'markdown' | 'pdf';

export interface ExportPageInput {
  pageId: string;
  format: ExportFormat;
  includeChildren?: boolean;
}

export interface ExportPageResult {
  success: boolean;
  data?: {
    content: string;
    filename: string;
    mimeType: string;
  };
  error?: string;
}

/**
 * Exporta uma página em Markdown ou PDF
 */
export async function exportPage(
  input: ExportPageInput
): Promise<ExportPageResult> {
  try {
    const { pageId, format, includeChildren = false } = input;

    const supabase = await createServerClient() as any;

    // 1. Buscar página
    const { data: page, error: pageError } = await supabase
      .from('pages')
      .select('*')
      .eq('id', pageId)
      .single();

    if (pageError || !page) {
      return {
        success: false,
        error: 'Página não encontrada',
      };
    }

    // 2. Verificar permissões (usuário deve ter acesso ao workspace)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: 'Usuário não autenticado',
      };
    }

    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', page.workspace_id)
      .single();

    if (!workspace) {
      return {
        success: false,
        error: 'Sem permissão para acessar esta página',
      };
    }

    // 3. Parsear conteúdo
    let content: Block[] = [];
    try {
      content = typeof page.content === 'string'
        ? JSON.parse(page.content)
        : page.content;
    } catch (error) {
      console.error('Error parsing page content:', error);
      content = [];
    }

    // 4. Se incluir filhos, buscar e adicionar
    if (includeChildren) {
      const children = await fetchPageChildren(page.workspace_id, pageId);

      if (children.length > 0) {
        // Adicionar separador
        (content as any).push({
          id: 'separator-children',
          type: 'paragraph',
          content: [],
          children: [],
          props: {},
        } as unknown as Block);

        // Adicionar título de seção
        (content as any).push({
          id: 'children-heading',
          type: 'heading',
          content: [{ type: 'text', text: 'Sub-páginas', styles: {} }],
          children: [],
          props: { level: 2 },
        } as unknown as Block);

        // Adicionar cada filho
        for (const child of children) {
          let childContent: Block[] = [];
          try {
            childContent = typeof child.content === 'string'
              ? JSON.parse(child.content)
              : child.content;
          } catch (error) {
            console.error('Error parsing child content:', error);
            childContent = [];
          }

          // Título do filho
          (content as any).push({
            id: `child-${child.id}`,
            type: 'heading',
            content: [{
              type: 'text',
              text: child.icon ? `${child.icon} ${child.title}` : child.title,
              styles: {}
            }],
            children: [],
            props: { level: 3 },
          } as unknown as Block);

          // Conteúdo do filho
          (content as any).push(...childContent);

          // Espaço entre filhos
          (content as any).push({
            id: `separator-${child.id}`,
            type: 'paragraph',
            content: [],
            children: [],
            props: {},
          } as unknown as Block);
        }
      }
    }

    // 5. Exportar no formato solicitado
    if (format === 'markdown') {
      const markdown = await exportPageToMarkdown({
        title: page.title,
        icon: page.icon,
        content,
        created_at: page.created_at,
        updated_at: page.updated_at,
      });

      const filename = sanitizeFilename(page.title) + '.md';

      return {
        success: true,
        data: {
          content: markdown,
          filename,
          mimeType: 'text/markdown',
        },
      };
    } else if (format === 'pdf') {
      const pdfBlob = await exportPageToPDF({
        title: page.title,
        icon: page.icon,
        content,
        created_at: page.created_at,
        updated_at: page.updated_at,
      });

      // Converter Blob para base64
      const buffer = await pdfBlob.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');

      const filename = sanitizeFilename(page.title) + '.pdf';

      return {
        success: true,
        data: {
          content: base64,
          filename,
          mimeType: 'application/pdf',
        },
      };
    }

    return {
      success: false,
      error: 'Formato de exportação inválido',
    };
  } catch (error) {
    console.error('Error exporting page:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao exportar página',
    };
  }
}

/**
 * Busca páginas filhas recursivamente
 */
async function fetchPageChildren(
  workspaceId: string,
  parentId: string
): Promise<any[]> {
  const supabase = await createServerClient() as any;

  const { data: children, error } = await supabase
    .from('pages')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('parent_id', parentId)
    .order('position', { ascending: true });

  if (error || !children) {
    return [];
  }

  return children;
}

/**
 * Sanitiza nome de arquivo
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9\s\-_]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .trim()
    .toLowerCase()
    .slice(0, 100); // Limita tamanho
}

/**
 * Exporta múltiplas páginas (pasta completa)
 */
export async function exportFolder(input: {
  folderId: string;
  format: ExportFormat;
}): Promise<ExportPageResult> {
  try {
    const { folderId, format } = input;

    const supabase = await createServerClient() as any;

    // Buscar pasta
    const { data: folder, error: folderError } = await supabase
      .from('pages')
      .select('*')
      .eq('id', folderId)
      .single();

    if (folderError || !folder) {
      return {
        success: false,
        error: 'Pasta não encontrada',
      };
    }

    // Verificar se é realmente uma pasta
    if (!folder.is_folder) {
      return {
        success: false,
        error: 'Esta página não é uma pasta',
      };
    }

    // Buscar todas as páginas da hierarquia
    const { data: descendants } = await supabase.rpc('get_page_hierarchy', {
      p_root_page_id: folderId,
      p_workspace_id: folder.workspace_id,
    });

    if (!descendants || descendants.length === 0) {
      return {
        success: false,
        error: 'Pasta vazia',
      };
    }

    // Criar conteúdo combinado
    let combinedContent: Block[] = [];

    // Título da pasta
    combinedContent.push({
      id: 'folder-title',
      type: 'heading',
      content: [{
        type: 'text',
        text: folder.icon ? `${folder.icon} ${folder.title}` : folder.title,
        styles: {}
      }],
      children: [],
      props: { level: 1 },
    } as unknown as Block);

    // Adicionar cada página
    for (const page of descendants) {
      let pageContent: Block[] = [];
      try {
        pageContent = typeof page.content === 'string'
          ? JSON.parse(page.content)
          : page.content;
      } catch (error) {
        console.error('Error parsing page content:', error);
        continue;
      }

      // Título da página (ajustar nível baseado na hierarquia)
      const headingLevel = Math.min((page.level || 1) + 1, 3);

      combinedContent.push({
        id: `page-${page.id}`,
        type: 'heading',
        content: [{
          type: 'text',
          text: page.icon ? `${page.icon} ${page.title}` : page.title,
          styles: {}
        }],
        children: [],
        props: { level: headingLevel },
      } as unknown as Block);

      // Conteúdo da página
      combinedContent.push(...pageContent);

      // Espaço entre páginas
      combinedContent.push({
        id: `separator-${page.id}`,
        type: 'paragraph',
        content: [],
        children: [],
        props: {},
      } as unknown as Block);
    }

    // Exportar
    if (format === 'markdown') {
      const markdown = await exportPageToMarkdown({
        title: folder.title,
        icon: folder.icon,
        content: combinedContent,
        created_at: folder.created_at,
        updated_at: folder.updated_at,
      });

      const filename = sanitizeFilename(folder.title) + '.md';

      return {
        success: true,
        data: {
          content: markdown,
          filename,
          mimeType: 'text/markdown',
        },
      };
    } else if (format === 'pdf') {
      const pdfBlob = await exportPageToPDF({
        title: folder.title,
        icon: folder.icon,
        content: combinedContent,
        created_at: folder.created_at,
        updated_at: folder.updated_at,
      });

      const buffer = await pdfBlob.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');

      const filename = sanitizeFilename(folder.title) + '.pdf';

      return {
        success: true,
        data: {
          content: base64,
          filename,
          mimeType: 'application/pdf',
        },
      };
    }

    return {
      success: false,
      error: 'Formato de exportação inválido',
    };
  } catch (error) {
    console.error('Error exporting folder:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao exportar pasta',
    };
  }
}
