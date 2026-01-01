'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Json } from '@/types/database.types';

export async function updatePage(data: {
  pageId: string;
  workspaceId: string;
  title?: string;
  contentJson?: Json;
  contentText?: string;
  icon?: string;
  coverUrl?: string;
  parentId?: string;
  archived?: boolean;
}) {
  const supabase = await createServerClient() as any;

  // Se está atualizando conteúdo, criar versão antes
  if (data.contentJson !== undefined || data.contentText !== undefined) {
    await createPageVersion(data.pageId, supabase);
  }

  const updateData: Record<string, any> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.contentJson !== undefined) updateData.content_json = data.contentJson;
  if (data.contentText !== undefined) updateData.content_text = data.contentText;
  if (data.icon !== undefined) updateData.icon = data.icon;
  if (data.coverUrl !== undefined) updateData.cover_url = data.coverUrl;
  if (data.parentId !== undefined) updateData.parent_id = data.parentId;
  if (data.archived !== undefined) updateData.archived = data.archived;

  const { data: page, error } = await supabase
    .from('pages')
    .update(updateData)
    .eq('id', data.pageId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/${data.workspaceId}`);
  revalidatePath(`/${data.workspaceId}/pages/${data.pageId}`);
  return page;
}

/**
 * Cria uma versão da página antes de atualizar
 */
async function createPageVersion(pageId: string, supabase: any) {
  try {
    // Buscar versão atual da página
    const { data: currentPage, error: pageError } = await supabase
      .from('pages')
      .select('content_json, content_text')
      .eq('id', pageId)
      .single();

    if (pageError || !currentPage) {
      console.error('Error fetching current page for versioning:', pageError);
      return;
    }

    // Obter usuário atual
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    // Criar versão no banco de dados
    // @ts-ignore - page_versions table exists but types not yet regenerated
    const { error: versionError } = await supabase.from('page_versions').insert({
      page_id: pageId,
      content_json: currentPage.content_json,
      content_text: currentPage.content_text,
      created_by: user.id,
    });

    if (versionError) {
      console.error('Error creating page version:', versionError);
    }
  } catch (error) {
    console.error('Error in createPageVersion:', error);
    // Não falhar a atualização se criar versão falhar
  }
}
