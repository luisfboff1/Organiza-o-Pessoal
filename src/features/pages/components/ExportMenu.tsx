'use client';

/**
 * Menu de exportação de páginas
 */

import { useState } from 'react';
import { Download, FileText, FileType } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { usePageExport } from '../hooks/usePageExport';

interface ExportMenuProps {
  pageId: string;
  /** Se true, mostra apenas o ícone (sem texto) */
  iconOnly?: boolean;
  /** Variante do botão */
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  /** Tamanho do botão */
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ExportMenu({
  pageId,
  iconOnly = false,
  variant = 'outline',
  size = 'default',
}: ExportMenuProps) {
  const { exportPage, isExporting } = usePageExport();
  const [includeChildren, setIncludeChildren] = useState(false);

  const handleExportMarkdown = async () => {
    await exportPage(pageId, {
      format: 'markdown',
      includeChildren,
    });
  };

  const handleExportPDF = async () => {
    await exportPage(pageId, {
      format: 'pdf',
      includeChildren,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={isExporting}
        >
          <Download className="w-4 h-4" />
          {!iconOnly && <span className="ml-2">Exportar</span>}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Exportar página</DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleExportMarkdown}
          disabled={isExporting}
        >
          <FileText className="w-4 h-4 mr-2" />
          <span>Exportar como Markdown</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleExportPDF}
          disabled={isExporting}
        >
          <FileType className="w-4 h-4 mr-2" />
          <span>Exportar como PDF</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuCheckboxItem
          checked={includeChildren}
          onCheckedChange={setIncludeChildren}
        >
          Incluir sub-páginas
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
