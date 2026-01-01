'use server';

/**
 * Server actions para arquivar e restaurar páginas
 */

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface ArchivePageInput {
  pageId: string;
  workspaceId: string;
}

export interface ArchivePageResult {
  success: boolean;
  error?: string;
}

/**
 * Arquiva uma página (soft delete)
 * Move a página e seus filhos para arquivado
 */
export async function archivePage(
  input: ArchivePageInput
): Promise<ArchivePageResult> {
  try {
    const { pageId, workspaceId } = input;

    const supabase = await createServerClient() as any;

    // 1. Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: 'Usuário não autenticado',
      };
    }

    // 2. Buscar página
    const { data: page, error: pageError } = await supabase
      .from('pages')
      .select('*')
      .eq('id', pageId)
      .eq('workspace_id', workspaceId)
      .single();

    if (pageError || !page) {
      return {
        success: false,
        error: 'Página não encontrada',
      };
    }

    // 3. Verificar se já está arquivada
    if ((page as any).archived_at) {
      return {
        success: false,
        error: 'Página já está arquivada',
      };
    }

    // 4. Arquivar página
    const { error: archiveError } = await supabase
      .from('pages')
      .update({
        archived_at: new Date().toISOString(),
        archived_by: user.id,
      })
      .eq('id', pageId);

    if (archiveError) {
      console.error('Error archiving page:', archiveError);
      return {
        success: false,
        error: 'Erro ao arquivar página',
      };
    }

    // 5. Arquivar páginas filhas recursivamente
    await archiveChildren(pageId, workspaceId, user.id);

    // 6. Revalidar cache
    revalidatePath(`/${workspaceId}/pages`);

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error archiving page:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao arquivar página',
    };
  }
}

/**
 * Restaura uma página arquivada
 * Restaura a página e seus filhos
 */
export async function restorePage(
  input: ArchivePageInput
): Promise<ArchivePageResult> {
  try {
    const { pageId, workspaceId } = input;

    const supabase = await createServerClient() as any;

    // 1. Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: 'Usuário não autenticado',
      };
    }

    // 2. Buscar página
    const { data: page, error: pageError } = await supabase
      .from('pages')
      .select('*')
      .eq('id', pageId)
      .eq('workspace_id', workspaceId)
      .single();

    if (pageError || !page) {
      return {
        success: false,
        error: 'Página não encontrada',
      };
    }

    // 3. Verificar se está arquivada
    if (!(page as any).archived_at) {
      return {
        success: false,
        error: 'Página não está arquivada',
      };
    }

    // 4. Restaurar página
    const { error: restoreError } = await supabase
      .from('pages')
      .update({
        archived_at: null,
        archived_by: null,
      })
      .eq('id', pageId);

    if (restoreError) {
      console.error('Error restoring page:', restoreError);
      return {
        success: false,
        error: 'Erro ao restaurar página',
      };
    }

    // 5. Restaurar páginas filhas recursivamente
    await restoreChildren(pageId, workspaceId);

    // 6. Revalidar cache
    revalidatePath(`/${workspaceId}/pages`);
    revalidatePath(`/${workspaceId}/pages/${pageId}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error restoring page:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao restaurar página',
    };
  }
}

/**
 * Deleta permanentemente uma página arquivada
 */
export async function deletePage(
  input: ArchivePageInput
): Promise<ArchivePageResult> {
  try {
    const { pageId, workspaceId } = input;

    const supabase = await createServerClient() as any;

    // 1. Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: 'Usuário não autenticado',
      };
    }

    // 2. Buscar página
    const { data: page, error: pageError } = await supabase
      .from('pages')
      .select('*')
      .eq('id', pageId)
      .eq('workspace_id', workspaceId)
      .single();

    if (pageError || !page) {
      return {
        success: false,
        error: 'Página não encontrada',
      };
    }

    // 3. Verificar se está arquivada
    if (!(page as any).archived_at) {
      return {
        success: false,
        error: 'Apenas páginas arquivadas podem ser deletadas permanentemente',
      };
    }

    // 4. Deletar página (CASCADE irá deletar filhos)
    const { error: deleteError } = await supabase
      .from('pages')
      .delete()
      .eq('id', pageId);

    if (deleteError) {
      console.error('Error deleting page:', deleteError);
      return {
        success: false,
        error: 'Erro ao deletar página',
      };
    }

    // 5. Revalidar cache
    revalidatePath(`/${workspaceId}/pages`);

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error deleting page:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao deletar página',
    };
  }
}

/**
 * Arquiva páginas filhas recursivamente
 */
async function archiveChildren(
  parentId: string,
  workspaceId: string,
  userId: string
): Promise<void> {
  const supabase = await createServerClient() as any;

  // Buscar filhos
  const { data: children, error } = await supabase
    .from('pages')
    .select('id')
    .eq('parent_id', parentId)
    .eq('workspace_id', workspaceId)
    .is('archived_at', null);

  if (error || !children || children.length === 0) {
    return;
  }

  // Arquivar cada filho
  for (const child of children) {
    await supabase
      .from('pages')
      .update({
        archived_at: new Date().toISOString(),
        archived_by: userId,
      })
      .eq('id', child.id);

    // Arquivar filhos deste filho recursivamente
    await archiveChildren(child.id, workspaceId, userId);
  }
}

/**
 * Restaura páginas filhas recursivamente
 */
async function restoreChildren(
  parentId: string,
  workspaceId: string
): Promise<void> {
  const supabase = await createServerClient() as any;

  // Buscar filhos arquivados
  const { data: children, error } = await supabase
    .from('pages')
    .select('id')
    .eq('parent_id', parentId)
    .eq('workspace_id', workspaceId)
    .not('archived_at', 'is', null);

  if (error || !children || children.length === 0) {
    return;
  }

  // Restaurar cada filho
  for (const child of children) {
    await supabase
      .from('pages')
      .update({
        archived_at: null,
        archived_by: null,
      })
      .eq('id', child.id);

    // Restaurar filhos deste filho recursivamente
    await restoreChildren(child.id, workspaceId);
  }
}
