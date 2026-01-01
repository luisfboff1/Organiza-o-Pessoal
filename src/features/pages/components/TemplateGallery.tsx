'use client';

/**
 * Galeria de templates de páginas
 */

import { useState } from 'react';
import { FileText, Plus, Trash2, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTemplates, useCreateFromTemplate, useDeleteTemplate } from '../hooks/useTemplates';
import type { Template } from '../actions/manage-templates';

interface TemplateGalleryProps {
  workspaceId: string;
  /** ID do parent onde a nova página será criada (opcional) */
  parentId?: string | null;
  /** Callback chamado após criar página do template */
  onPageCreated?: (pageId: string) => void;
}

export function TemplateGallery({
  workspaceId,
  parentId,
  onPageCreated,
}: TemplateGalleryProps) {
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);

  const { data: templates, isLoading } = useTemplates(workspaceId);
  const createFromTemplate = useCreateFromTemplate();
  const deleteTemplate = useDeleteTemplate();

  const handleCreateFromTemplate = async (template: Template) => {
    const result = await createFromTemplate.mutateAsync({
      templateId: template.id,
      workspaceId,
      parentId,
      title: `Nova página - ${template.title}`,
    });

    if (result.success && result.pageId) {
      setOpen(false);
      onPageCreated?.(result.pageId);
    }
  };

  const handleDeleteTemplate = (template: Template) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!templateToDelete) return;

    await deleteTemplate.mutateAsync({
      templateId: templateToDelete.id,
      workspaceId,
    });

    setDeleteDialogOpen(false);
    setTemplateToDelete(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Templates
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Galeria de Templates</DialogTitle>
            <DialogDescription>
              Escolha um template para criar uma nova página
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[500px] pr-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-40" />
                ))}
              </div>
            ) : templates && templates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onUse={() => handleCreateFromTemplate(template)}
                    onDelete={() => handleDeleteTemplate(template)}
                    isCreating={createFromTemplate.isPending}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhum template disponível
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Salve uma página como template para começar
                </p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar template</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o template "{templateToDelete?.title}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/**
 * Card de template individual
 */
function TemplateCard({
  template,
  onUse,
  onDelete,
  isCreating,
}: {
  template: Template;
  onUse: () => void;
  onDelete: () => void;
  isCreating: boolean;
}) {
  return (
    <div className="border rounded-lg p-4 hover:border-primary transition-colors group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {template.icon ? (
            <span className="text-2xl">{template.icon}</span>
          ) : (
            <FileText className="w-5 h-5 text-muted-foreground" />
          )}
          <h3 className="font-semibold text-sm">{template.title}</h3>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>

      {/* Description */}
      {template.description && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {template.description}
        </p>
      )}

      {/* Category badge */}
      {template.category && (
        <span className="inline-block px-2 py-1 text-xs bg-muted rounded mb-3">
          {template.category}
        </span>
      )}

      {/* Action button */}
      <Button
        size="sm"
        variant="outline"
        className="w-full mt-2"
        onClick={onUse}
        disabled={isCreating}
      >
        <Plus className="w-3 h-3 mr-1" />
        Usar template
      </Button>
    </div>
  );
}
