import { createServerClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { createPage } from '@/features/pages/actions/create-page';
import { formatDate } from '@/lib/utils';
import type { Database } from '@/types/database.types';

type Page = Database['public']['Tables']['pages']['Row'];

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const supabase = await createServerClient();

  const { data: pages } = await supabase
    .from('pages')
    .select<'*', Page>('*')
    .eq('workspace_id', workspaceId)
    .eq('archived', false)
    .is('parent_id', null)
    .order('created_at', { ascending: false });

  async function handleCreatePage() {
    'use server';
    const params_await = await params;
    await createPage({
      workspaceId: params_await.workspaceId,
      title: 'Nova Página',
    });
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Páginas</h1>
          <form action={handleCreatePage}>
            <Button type="submit">+ Nova Página</Button>
          </form>
        </div>

        {pages && pages.length > 0 ? (
          <div className="grid gap-4">
            {pages.map((page) => (
              <Link
                key={page.id}
                href={`/${workspaceId}/pages/${page.id}`}
                className="block p-4 border rounded-lg hover:bg-accent transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{page.icon} {page.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {page.content_text.substring(0, 150)}
                      {page.content_text.length > 150 && '...'}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(page.created_at)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Nenhuma página criada ainda
            </p>
            <form action={handleCreatePage}>
              <Button type="submit">Criar primeira página</Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
