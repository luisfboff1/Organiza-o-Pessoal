'use server';

/**
 * Server action para duplicar páginas
 */

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface DuplicatePageInput {
  pageId: string;
  workspaceId: string;
  /** Se true, duplica também as páginas filhas recursivamente */
  includeChildren?: boolean;
  /** ID do novo parent (opcional, mantém o mesmo parent se não fornecido) */
  newParentId?: string | null;
}

export interface DuplicatePageResult {
  success: boolean;
  pageId?: string;
  error?: string;
}

/**
 * Duplica uma página
 */
export async function duplicatePage(
  input: DuplicatePageInput
): Promise<DuplicatePageResult> {
  try {
    const { pageId, workspaceId, includeChildren = false, newParentId } = input;

    const supabase = await createServerClient() as any;

    // 1. Buscar página original
    const { data: originalPage, error: pageError } = await supabase
      .from('pages')
      .select('*')
      .eq('id', pageId)
      .eq('workspace_id', workspaceId)
      .single();

    if (pageError || !originalPage) {
      return {
        success: false,
        error: 'Página não encontrada',
      };
    }

    // 2. Verificar permissões
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: 'Usuário não autenticado',
      };
    }

    // 3. Buscar posição máxima para o novo parent
    const parentId = newParentId !== undefined ? newParentId : (originalPage as any).parent_id;

    const { data: siblings } = await supabase
      .from('pages')
      .select('position')
      .eq('workspace_id', workspaceId)
      .eq('parent_id', parentId)
      .order('position', { ascending: false })
      .limit(1);

    const maxPosition = siblings && siblings.length > 0 ? siblings[0].position : 0;

    // 4. Criar cópia da página
    const { data: newPage, error: createError } = await supabase
      .from('pages')
      .insert({
        workspace_id: workspaceId,
        title: `${(originalPage as any).title} (Cópia)`,
        content_json: (originalPage as any).content_json,
        content_text: (originalPage as any).content_text,
        icon: (originalPage as any).icon,
        cover: (originalPage as any).cover,
        parent_id: parentId,
        position: maxPosition + 1,
        is_folder: (originalPage as any).is_folder,
        created_by: user.id,
      })
      .select()
      .single();

    if (createError || !newPage) {
      console.error('Error creating duplicate:', createError);
      return {
        success: false,
        error: 'Erro ao duplicar página',
      };
    }

    // 5. Se incluir filhos, duplicar recursivamente
    if (includeChildren) {
      await duplicateChildren(
        (originalPage as any).id,
        newPage.id,
        workspaceId,
        user.id
      );
    }

    // 6. Revalidar cache
    revalidatePath(`/${workspaceId}/pages`);
    revalidatePath(`/${workspaceId}/pages/${newPage.id}`);

    return {
      success: true,
      pageId: newPage.id,
    };
  } catch (error) {
    console.error('Error duplicating page:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao duplicar página',
    };
  }
}

/**
 * Duplica páginas filhas recursivamente
 */
async function duplicateChildren(
  originalParentId: string,
  newParentId: string,
  workspaceId: string,
  userId: string
): Promise<void> {
  const supabase = await createServerClient() as any;

  // Buscar filhos do original
  const { data: children, error } = await supabase
    .from('pages')
    .select('*')
    .eq('parent_id', originalParentId)
    .eq('workspace_id', workspaceId)
    .order('position', { ascending: true });

  if (error || !children || children.length === 0) {
    return;
  }

  // Duplicar cada filho
  for (const child of children) {
    const { data: newChild, error: createError } = await supabase
      .from('pages')
      .insert({
        workspace_id: workspaceId,
        title: child.title,
        content_json: child.content_json,
        content_text: child.content_text,
        icon: child.icon,
        cover: child.cover,
        parent_id: newParentId,
        position: child.position,
        is_folder: child.is_folder,
        created_by: userId,
      })
      .select()
      .single();

    if (createError || !newChild) {
      console.error('Error duplicating child:', createError);
      continue;
    }

    // Duplicar filhos deste filho recursivamente
    await duplicateChildren(child.id, newChild.id, workspaceId, userId);
  }
}
