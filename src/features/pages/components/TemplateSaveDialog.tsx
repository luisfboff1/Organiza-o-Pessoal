'use client';

/**
 * Dialog para salvar página como template
 */

import { useState } from 'react';
import { Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSaveAsTemplate } from '../hooks/useTemplates';

interface TemplateSaveDialogProps {
  pageId: string;
  workspaceId: string;
  defaultTitle?: string;
}

export function TemplateSaveDialog({
  pageId,
  workspaceId,
  defaultTitle,
}: TemplateSaveDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const saveAsTemplate = useSaveAsTemplate();

  const handleSave = async () => {
    if (!title.trim()) {
      return;
    }

    const result = await saveAsTemplate.mutateAsync({
      pageId,
      workspaceId,
      templateTitle: title,
      templateDescription: description || undefined,
    });

    if (result.success) {
      setOpen(false);
      setTitle('');
      setDescription('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Save className="w-4 h-4" />
          Salvar como template
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Salvar como template</DialogTitle>
          <DialogDescription>
            Salve esta página como um template reutilizável
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="template-title">Título do template *</Label>
            <Input
              id="template-title"
              placeholder={defaultTitle ? `Template: ${defaultTitle}` : 'Nome do template'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="template-description">Descrição (opcional)</Label>
            <Textarea
              id="template-description"
              placeholder="Descreva quando e como usar este template..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={saveAsTemplate.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || saveAsTemplate.isPending}
          >
            {saveAsTemplate.isPending ? 'Salvando...' : 'Salvar template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
