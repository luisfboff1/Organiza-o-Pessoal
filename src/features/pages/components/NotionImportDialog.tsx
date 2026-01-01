'use client';

/**
 * Dialog para importação de arquivo ZIP do Notion
 */

import { useState, useCallback } from 'react';
import { FileUp, Upload, X, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNotionImport } from '../hooks/useNotionImport';
import { ImportProgress } from './ImportProgress';

interface NotionImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  parentId?: string | null;
}

export function NotionImportDialog({
  open,
  onOpenChange,
  workspaceId,
  parentId,
}: NotionImportDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { mutate: importNotion, isPending } = useNotionImport();

  // Validar arquivo
  const validateFile = useCallback((file: File): string | null => {
    // Verificar extensão
    if (!file.name.endsWith('.zip')) {
      return 'O arquivo deve ser um ZIP exportado do Notion';
    }

    // Verificar tamanho (máximo 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return `Arquivo muito grande. Máximo: ${maxSize / 1024 / 1024}MB`;
    }

    return null;
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback(
    (file: File) => {
      const error = validateFile(file);
      if (error) {
        setValidationError(error);
        setSelectedFile(null);
        return;
      }

      setValidationError(null);
      setSelectedFile(file);
    },
    [validateFile]
  );

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    },
    [handleFileSelect]
  );

  // Handle file input change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (e.target.files && e.target.files[0]) {
        handleFileSelect(e.target.files[0]);
      }
    },
    [handleFileSelect]
  );

  // Handle import
  const handleImport = useCallback(() => {
    if (!selectedFile) return;

    importNotion(
      {
        workspaceId,
        zipFile: selectedFile,
        parentId,
      },
      {
        onSuccess: () => {
          setSelectedFile(null);
          onOpenChange(false);
        },
      }
    );
  }, [selectedFile, workspaceId, parentId, importNotion, onOpenChange]);

  // Reset state when dialog closes
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen && !isPending) {
        setSelectedFile(null);
        setValidationError(null);
      }
      onOpenChange(newOpen);
    },
    [isPending, onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar do Notion</DialogTitle>
          <DialogDescription>
            Faça upload do arquivo ZIP exportado do Notion para importar suas páginas.
          </DialogDescription>
        </DialogHeader>

        {isPending ? (
          <ImportProgress />
        ) : (
          <>
            {/* Drop Zone */}
            <div
              className={`
                relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
                ${dragActive ? 'border-primary bg-primary/5' : 'border-border'}
                ${selectedFile ? 'bg-muted/50' : ''}
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="notion-zip-input"
                accept=".zip"
                onChange={handleChange}
                className="hidden"
                disabled={isPending}
              />

              {selectedFile ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-3">
                    <FileUp className="w-8 h-8 text-primary" />
                    <div className="flex-1 text-left">
                      <p className="font-medium text-sm">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedFile(null);
                        setValidationError(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <label htmlFor="notion-zip-input" className="cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">
                    Clique para selecionar ou arraste o arquivo aqui
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Arquivo ZIP (máximo 100MB)
                  </p>
                </label>
              )}
            </div>

            {/* Validation Error */}
            {validationError && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}

            {/* Instructions */}
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription className="text-xs">
                <strong>Como exportar do Notion:</strong>
                <ol className="mt-2 ml-4 list-decimal space-y-1">
                  <li>Abra o Notion e vá em Settings & Members</li>
                  <li>Clique em Settings → Export all workspace content</li>
                  <li>Escolha "Markdown & CSV" como formato</li>
                  <li>Clique em Export e aguarde o download</li>
                </ol>
              </AlertDescription>
            </Alert>
          </>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={!selectedFile || isPending}
          >
            {isPending ? 'Importando...' : 'Importar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
