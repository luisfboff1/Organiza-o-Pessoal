'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { searchPages } from '../actions/search-pages';
import Link from 'next/link';
import { Search } from 'lucide-react';

interface SearchDialogProps {
  workspaceId: string;
}

export function SearchDialog({ workspaceId }: SearchDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Atalho Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Buscar quando query mudar
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const data = await searchPages(workspaceId, query);
      setResults(data);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, workspaceId]);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground border rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <Search className="w-4 h-4" />
        <span>Buscar...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-0">
          <div className="flex items-center border-b px-4">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar páginas..."
              className="border-0 focus-visible:ring-0"
              autoFocus
            />
          </div>

          <div className="max-h-96 overflow-y-auto p-2">
            {loading && (
              <div className="text-center py-8 text-muted-foreground">
                Buscando...
              </div>
            )}

            {!loading && results.length === 0 && query.trim().length >= 2 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum resultado encontrado
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="space-y-1">
                {results.map((result) => (
                  <Link
                    key={result.id}
                    href={`/${workspaceId}/pages/${result.id}`}
                    onClick={() => setOpen(false)}
                    className="block p-3 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <div className="font-medium">
                      {result.icon} {result.title}
                    </div>
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {result.content_text}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
