'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2, Plus } from 'lucide-react';
import { formatCurrency } from '../lib/currency-formatter';

interface FinanceTableProps {
  entries: any[];
  workspaceId: string;
  onUpdateEntry: (data: any) => void;
  onDeleteEntry: (entryId: string) => void;
  onCreateEntry: (data: any) => void;
}

export function FinanceTable({ entries, workspaceId, onUpdateEntry, onDeleteEntry, onCreateEntry }: FinanceTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);

  const handleCellClick = (entryId: string, field: string) => {
    setEditingId(entryId);
    setEditingField(field);
  };

  const handleCellBlur = () => {
    setEditingId(null);
    setEditingField(null);
  };

  const handleAddRow = () => {
    const today = new Date().toISOString().split('T')[0];
    onCreateEntry({
      workspaceId,
      type: 'expense',
      category: 'Outros Gastos',
      amount: 1.0,
      date: today,
      note: '',
    });
  };

  return (
    <div className="border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24 min-w-[100px]">Tipo</TableHead>
            <TableHead className="w-32 min-w-[120px]">Data</TableHead>
            <TableHead className="min-w-[150px]">Categoria</TableHead>
            <TableHead className="w-32 min-w-[120px] text-right">Valor</TableHead>
            <TableHead className="min-w-[150px]">Nota</TableHead>
            <TableHead className="min-w-[120px]">Projeto</TableHead>
            <TableHead className="w-16"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id} className="hover:bg-accent">
              <TableCell>
                <select
                  value={entry.type}
                  onChange={(e) =>
                    onUpdateEntry({
                      entryId: entry.id,
                      workspaceId,
                      type: e.target.value as 'income' | 'expense',
                    })
                  }
                  className="w-full bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-ring rounded px-2 py-1 text-foreground"
                >
                  <option value="income">Receita</option>
                  <option value="expense">Despesa</option>
                </select>
              </TableCell>

              <TableCell>
                <input
                  type="date"
                  value={entry.date}
                  onChange={(e) =>
                    onUpdateEntry({
                      entryId: entry.id,
                      workspaceId,
                      date: e.target.value,
                    })
                  }
                  className="w-full bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-ring rounded px-2 py-1 text-foreground"
                />
              </TableCell>

              <TableCell>
                <input
                  type="text"
                  value={entry.category}
                  onChange={(e) =>
                    onUpdateEntry({
                      entryId: entry.id,
                      workspaceId,
                      category: e.target.value,
                    })
                  }
                  placeholder="Categoria"
                  className="w-full bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-ring rounded px-2 py-1 text-foreground placeholder:text-muted-foreground"
                />
              </TableCell>

              <TableCell className="text-right">
                <input
                  type="number"
                  step="0.01"
                  value={entry.amount}
                  onChange={(e) =>
                    onUpdateEntry({
                      entryId: entry.id,
                      workspaceId,
                      amount: parseFloat(e.target.value),
                    })
                  }
                  className={`w-full bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 text-right font-medium ${
                    entry.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}
                />
              </TableCell>

              <TableCell>
                <input
                  type="text"
                  value={entry.note || ''}
                  onChange={(e) =>
                    onUpdateEntry({
                      entryId: entry.id,
                      workspaceId,
                      note: e.target.value,
                    })
                  }
                  placeholder="Nota"
                  className="w-full bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-ring rounded px-2 py-1 text-foreground placeholder:text-muted-foreground"
                />
              </TableCell>

              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {entry.projects?.title || '-'}
                </span>
              </TableCell>

              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm('Tem certeza que deseja deletar este lançamento?')) {
                      onDeleteEntry(entry.id);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="border-t p-2">
        <Button variant="ghost" onClick={handleAddRow} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Linha
        </Button>
      </div>
    </div>
  );
}
