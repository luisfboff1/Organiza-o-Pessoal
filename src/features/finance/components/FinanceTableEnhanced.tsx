'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Check, Clock } from 'lucide-react';
import { formatCurrency } from '../lib/currency-formatter';

interface FinanceTableEnhancedProps {
  entries: any[];
  workspaceId: string;
  onUpdateEntry: (data: any) => void;
  onDeleteEntry: (entryId: string) => void;
  onCreateEntry: (data: any) => void;
}

export function FinanceTableEnhanced({ entries, workspaceId, onUpdateEntry, onDeleteEntry, onCreateEntry }: FinanceTableEnhancedProps) {
  const handleAddRow = () => {
    const today = new Date().toISOString().split('T')[0];
    onCreateEntry({
      workspaceId,
      type: 'expense',
      category: 'Outros Gastos',
      amount: 1.0,
      date: today,
      description: '',
      note: '',
      status: 'paid',
      company: '',
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'text-green-600 dark:text-green-400';
      case 'expense':
        return 'text-red-600 dark:text-red-400';
      case 'investment':
        return 'text-blue-600 dark:text-blue-400';
      case 'balance':
        return 'text-purple-600 dark:text-purple-400';
      default:
        return 'text-foreground';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'income':
        return 'Receita';
      case 'expense':
        return 'Despesa';
      case 'investment':
        return 'Investimento';
      case 'balance':
        return 'Saldo';
      default:
        return type;
    }
  };

  return (
    <div className="border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24">Data</TableHead>
            <TableHead className="min-w-[150px]">Descrição</TableHead>
            <TableHead className="w-28">Tipo</TableHead>
            <TableHead className="min-w-[120px]">Categoria</TableHead>
            <TableHead className="w-32 text-right">Valor</TableHead>
            <TableHead className="w-32 text-right">Saldo</TableHead>
            <TableHead className="w-24">Status</TableHead>
            <TableHead className="min-w-[120px]">Empresa</TableHead>
            <TableHead className="min-w-[150px]">Nota</TableHead>
            <TableHead className="w-16"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id} className="hover:bg-accent">
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
                  className="w-full bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-ring rounded px-2 py-1 text-foreground text-sm"
                />
              </TableCell>

              <TableCell>
                <input
                  type="text"
                  value={entry.description || ''}
                  onChange={(e) =>
                    onUpdateEntry({
                      entryId: entry.id,
                      workspaceId,
                      description: e.target.value,
                    })
                  }
                  placeholder="Descrição"
                  className="w-full bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-ring rounded px-2 py-1 text-foreground placeholder:text-muted-foreground"
                />
              </TableCell>

              <TableCell>
                <select
                  value={entry.type}
                  onChange={(e) =>
                    onUpdateEntry({
                      entryId: entry.id,
                      workspaceId,
                      type: e.target.value as any,
                    })
                  }
                  className={`w-full bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-ring rounded px-2 py-1 text-sm font-medium ${getTypeColor(
                    entry.type
                  )}`}
                >
                  <option value="income">Receita</option>
                  <option value="expense">Despesa</option>
                  <option value="investment">Investimento</option>
                  <option value="balance">Saldo</option>
                </select>
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
                  className={`w-full bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-ring rounded px-2 py-1 text-right font-medium ${getTypeColor(
                    entry.type
                  )}`}
                />
              </TableCell>

              <TableCell className="text-right">
                <span className="text-sm font-semibold text-foreground">
                  {formatCurrency(entry.running_balance || 0)}
                </span>
              </TableCell>

              <TableCell>
                <select
                  value={entry.status || 'paid'}
                  onChange={(e) =>
                    onUpdateEntry({
                      entryId: entry.id,
                      workspaceId,
                      status: e.target.value,
                    })
                  }
                  className="w-full bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-ring rounded px-2 py-1 text-sm"
                >
                  <option value="paid">Pago</option>
                  <option value="pending">Pendente</option>
                </select>
              </TableCell>

              <TableCell>
                <input
                  type="text"
                  value={entry.company || ''}
                  onChange={(e) =>
                    onUpdateEntry({
                      entryId: entry.id,
                      workspaceId,
                      company: e.target.value,
                    })
                  }
                  placeholder="Empresa"
                  className="w-full bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-ring rounded px-2 py-1 text-foreground placeholder:text-muted-foreground"
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
