'use server';

import { createServerClient } from '@/lib/supabase/server';

export async function getPages(workspaceId: string) {
  const supabase = await createServerClient();

  const { data: pages, error } = await supabase
    .from('pages')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('archived', false)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return pages;
}

export async function getPage(pageId: string) {
  const supabase = await createServerClient();

  const { data: page, error } = await supabase
    .from('pages')
    .select('*')
    .eq('id', pageId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return page;
}
