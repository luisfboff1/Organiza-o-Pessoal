'use client';

/**
 * Sidebar com árvore de páginas
 */

import { useState } from 'react';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PageTree } from './PageTree';
import { ImportNotionButton } from './ImportNotionButton';
import { CreatePageDialog } from './CreatePageDialog';
import { cn } from '@/lib/utils';

interface PagesSidebarProps {
  workspaceId: string;
  initialCollapsed?: boolean;
}

export function PagesSidebar({
  workspaceId,
  initialCollapsed = false,
}: PagesSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

  if (isCollapsed) {
    return (
      <div className="w-12 border-r bg-background flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          title="Expandir sidebar"
        >
          <PanelLeft className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-64 border-r bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-sm">Páginas</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(true)}
          title="Recolher sidebar"
        >
          <PanelLeftClose className="w-4 h-4" />
        </Button>
      </div>

      {/* Actions */}
      <div className="p-2 border-b space-y-2">
        <CreatePageDialog
          workspaceId={workspaceId}
          variant="ghost"
          size="sm"
          className="w-full justify-start"
        />
        <ImportNotionButton
          workspaceId={workspaceId}
          variant="ghost"
          size="sm"
        />
      </div>

      {/* Tree */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          <PageTree workspaceId={workspaceId} />
        </div>
      </ScrollArea>
    </div>
  );
}
