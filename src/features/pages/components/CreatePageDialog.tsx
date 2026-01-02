'use client';

/**
 * Dialog para criar nova página (raiz ou subpágina)
 */

import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
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
import { createPage } from '../actions/create-page';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface CreatePageDialogProps {
  workspaceId: string;
  parentId?: string; // Se fornecido, cria como subpágina
  parentTitle?: string; // Título da página pai para exibir
  trigger?: React.ReactNode;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function CreatePageDialog({
  workspaceId,
  parentId,
  parentTitle,
  trigger,
  variant = 'default',
  size = 'default',
  className,
}: CreatePageDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Digite um título para a página');
      return;
    }

    setLoading(true);

    try {
      const page = await createPage({
        workspaceId,
        title: title.trim(),
        parentId,
      });

      toast.success(parentId ? 'Subpágina criada!' : 'Página criada!');
      setTitle('');
      setOpen(false);

      // Redirecionar para a nova página
      router.push(`/${workspaceId}/pages/${page.id}`);
      router.refresh();
    } catch (error: any) {
      console.error('Erro ao criar página:', error);
      toast.error(error.message || 'Erro ao criar página');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant={variant}
            size={size}
            className={className}
          >
            <Plus className="w-4 h-4 mr-2" />
            {parentId ? 'Nova Subpágina' : 'Nova Página'}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <form onSubmit={handleCreate}>
          <DialogHeader>
            <DialogTitle>
              {parentId ? 'Criar Subpágina' : 'Criar Nova Página'}
            </DialogTitle>
            <DialogDescription>
              {parentId ? (
                <>
                  Criar uma nova página dentro de{' '}
                  <span className="font-medium">{parentTitle || 'página pai'}</span>
                </>
              ) : (
                'Criar uma nova página na raiz'
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="title">Título da página</Label>
            <Input
              id="title"
              placeholder="Ex: Documentação do Projeto"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              disabled={loading}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
