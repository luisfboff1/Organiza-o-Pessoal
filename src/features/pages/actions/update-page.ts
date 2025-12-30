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
  const supabase = await createServerClient();

  const updateData: Record<string, any> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.contentJson !== undefined) updateData.content_json = data.contentJson;
  if (data.contentText !== undefined) updateData.content_text = data.contentText;
  if (data.icon !== undefined) updateData.icon = data.icon;
  if (data.coverUrl !== undefined) updateData.cover_url = data.coverUrl;
  if (data.parentId !== undefined) updateData.parent_id = data.parentId;
  if (data.archived !== undefined) updateData.archived = data.archived;

  const { data: page, error } = await (supabase as any)
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
