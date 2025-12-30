'use client';

import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, FileText, BarChart3, CheckSquare, DollarSign, LayoutDashboard, Bot } from 'lucide-react';
import { SearchDialog } from '@/features/search/components/SearchDialog';

interface MobileSidebarProps {
  workspaceId: string;
  workspaceName: string;
}

export function MobileSidebar({ workspaceId, workspaceName }: MobileSidebarProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-4">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">{workspaceName}</h2>
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
      </SheetContent>
    </Sheet>
  );
}
