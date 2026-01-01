import { createServerClient } from '@/lib/supabase/server';
import { PageEditor } from '@/features/pages/components/PageEditor';
import { PageTitle } from '@/features/pages/components/PageTitle';
import { ExportMenu } from '@/features/pages/components/ExportMenu';
import { notFound } from 'next/navigation';
import { updatePage } from '@/features/pages/actions/update-page';
import type { Database } from '@/types/database.types';

type Page = Database['public']['Tables']['pages']['Row'];

export default async function PageView({
  params,
}: {
  params: Promise<{ workspaceId: string; pageId: string }>;
}) {
  const { workspaceId, pageId } = await params;
  const supabase = await createServerClient();

  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('id', pageId)
    .eq('workspace_id', workspaceId)
    .single<Page>();

  if (!page) {
    notFound();
  }

  async function updateTitle(formData: FormData) {
    'use server';
    const title = formData.get('title') as string;
    const params_await = await params;

    await updatePage({
      pageId: params_await.pageId,
      workspaceId: params_await.workspaceId,
      title,
    });
  }

  async function updateIcon(icon: string | null) {
    'use server';
    const params_await = await params;

    await updatePage({
      pageId: params_await.pageId,
      workspaceId: params_await.workspaceId,
      icon: icon ?? undefined,
    });
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b px-8 py-4 flex items-center justify-between gap-4">
        <PageTitle
          defaultValue={page.title}
          icon={page.icon}
          pageId={page.id}
          onUpdate={updateTitle}
          onIconUpdate={updateIcon}
        />
        <ExportMenu pageId={page.id} variant="ghost" size="sm" />
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto px-8">
        <PageEditor
          pageId={page.id}
          workspaceId={workspaceId}
          initialContent={page.content_json as any}
        />
      </div>
    </div>
  );
}
