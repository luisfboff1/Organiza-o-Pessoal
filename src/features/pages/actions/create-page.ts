'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Database } from '@/types/database.types';

type Page = Database['public']['Tables']['pages']['Row'];

export async function createPage(data: {
  workspaceId: string;
  title: string;
  parentId?: string;
}): Promise<Page> {
  const supabase = await createServerClient();

  const { data: page, error } = await supabase
    .from('pages')
    .insert({
      workspace_id: data.workspaceId,
      title: data.title,
      parent_id: data.parentId || null,
      content_json: [],
      content_text: '',
    } as any)
    .select()
    .single<Page>();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/${data.workspaceId}`);
  return page;
}
