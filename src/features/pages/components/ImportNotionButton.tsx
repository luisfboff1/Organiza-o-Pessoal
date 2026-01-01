'use client';

/**
 * Botão para abrir o dialog de importação do Notion
 */

import { useState } from 'react';
import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotionImportDialog } from './NotionImportDialog';

interface ImportNotionButtonProps {
  workspaceId: string;
  parentId?: string | null;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ImportNotionButton({
  workspaceId,
  parentId,
  variant = 'outline',
  size = 'default',
}: ImportNotionButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setDialogOpen(true)}
      >
        <FileDown className="w-4 h-4 mr-2" />
        Importar do Notion
      </Button>

      <NotionImportDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workspaceId={workspaceId}
        parentId={parentId}
      />
    </>
  );
}
