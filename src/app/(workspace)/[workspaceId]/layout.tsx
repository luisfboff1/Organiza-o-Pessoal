import { type ReactNode } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SearchDialog } from '@/features/search/components/SearchDialog';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import type { Database } from '@/types/database.types';
import { FileText, BarChart3, CheckSquare, DollarSign, LayoutDashboard, Bot } from 'lucide-react';

type Workspace = Database['public']['Tables']['workspaces']['Row'];

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const supabase = await createServerClient();

  // Verificar autenticação
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Verificar acesso ao workspace
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', workspaceId)
    .eq('owner_id', user.id)
    .single<Workspace>();

  if (!workspace) {
    redirect('/');
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-slate-50 dark:bg-slate-900">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{workspace.name}</h1>
        <MobileSidebar workspaceId={workspaceId} workspaceName={workspace.name} />
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{workspace.name}</h2>
        </div>

        {/* Search */}
        <div className="mb-4">
          <SearchDialog workspaceId={workspaceId} />
        </div>

        <nav className="space-y-1">
          <a
            href={`/${workspaceId}`}
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <FileText className="w-4 h-4" />
            <span>Páginas</span>
          </a>
          <a
            href={`/${workspaceId}/projects`}
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Projetos</span>
          </a>
          <a
            href={`/${workspaceId}/tasks`}
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <CheckSquare className="w-4 h-4" />
            <span>Tasks</span>
          </a>
          <a
            href={`/${workspaceId}/finance`}
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <DollarSign className="w-4 h-4" />
            <span>Financeiro</span>
          </a>
          <a
            href={`/${workspaceId}/dashboard`}
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </a>
          <a
            href={`/${workspaceId}/chat`}
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <Bot className="w-4 h-4" />
            <span>Agente IA</span>
          </a>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
