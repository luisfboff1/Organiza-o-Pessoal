/**
 * Server Action para mover páginas na hierarquia
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';

interface MovePageParams {
  pageId: string;
  newParentId: string | null;
  workspaceId: string;
  newPosition?: number;
}

/**
 * Move uma página para um novo parent
 */
export async function movePage(params: MovePageParams) {
  try {
    const supabase = await createServerClient() as any;

    // 1. Verificar se criaria um ciclo
    if (params.newParentId) {
      const wouldCycle = await checkWouldCreateCycle(
        params.pageId,
        params.newParentId
      );

      if (wouldCycle) {
        return {
          success: false,
          error: 'Não é possível mover: criaria uma referência circular',
        };
      }
    }

    // 2. Atualizar parent_id e position
    const { error } = await supabase
      .from('pages')
      .update({
        parent_id: params.newParentId,
        position: params.newPosition ?? 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.pageId);

    if (error) {
      console.error('Erro ao mover página:', error);
      return { success: false, error: error.message };
    }

    // 3. Revalidar cache
    revalidatePath(`/${params.workspaceId}/pages`);

    return { success: true };
  } catch (error) {
    console.error('Erro ao mover página:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Verifica se mover uma página criaria um ciclo
 */
async function checkWouldCreateCycle(
  pageId: string,
  newParentId: string
): Promise<boolean> {
  const supabase = await createServerClient() as any;

  // Se pageId === newParentId, é ciclo direto
  if (pageId === newParentId) return true;

  // Verificar usando a função SQL
  const { data, error } = await supabase.rpc('would_create_cycle', {
    p_page_id: pageId,
    p_new_parent_id: newParentId,
  });

  if (error) {
    console.error('Erro ao verificar ciclo:', error);
    return false;
  }

  return data === true;
}

/**
 * Reordena páginas dentro do mesmo parent
 */
export async function reorderPages(params: {
  pageIds: string[];
  workspaceId: string;
}) {
  try {
    const supabase = await createServerClient() as any;

    // Atualizar position de cada página
    const updates = params.pageIds.map((pageId, index) =>
      supabase
        .from('pages')
        .update({ position: index })
        .eq('id', pageId)
    );

    await Promise.all(updates);

    revalidatePath(`/${params.workspaceId}/pages`);

    return { success: true };
  } catch (error) {
    console.error('Erro ao reordenar páginas:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}
