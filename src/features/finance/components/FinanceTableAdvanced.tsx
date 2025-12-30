'use client';

import { useState, useMemo, Fragment } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Trash2,
  Plus,
  Search,
  Settings2,
  Eye,
  EyeOff,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { formatCurrency } from '../lib/currency-formatter';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FinanceEntryDialog } from './FinanceEntryDialog';

interface FinanceEntry {
  id: string;
  date: string;
  description: string;
  type: 'income' | 'expense' | 'investment' | 'balance';
  category: string;
  amount: number;
  running_balance: number;
  status: 'paid' | 'pending';
  company: string;
  note: string;
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
}

interface FinanceTableAdvancedProps {
  entries: FinanceEntry[];
  workspaceId: string;
  onUpdateEntry: (data: any) => void;
  onDeleteEntry: (entryId: string) => void;
  onCreateEntry: (data: any) => void;
}

// Traduções dos nomes das colunas
const COLUMN_LABELS: Record<string, string> = {
  date: 'Data',
  description: 'Descrição',
  type: 'Tipo',
  category: 'Categoria',
  amount: 'Valor',
  running_balance: 'Saldo',
  status: 'Status',
  company: 'Empresa',
  note: 'Nota',
  recurrence: 'Recorrência',
  actions: 'Ações',
};

const columnHelper = createColumnHelper<FinanceEntry>();

export function FinanceTableAdvanced({
  entries,
  workspaceId,
  onUpdateEntry,
  onDeleteEntry,
  onCreateEntry,
}: FinanceTableAdvancedProps) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'income' | 'expense' | 'investment' | 'balance'>('income');

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

  const columns = useMemo(
    () => [
      columnHelper.accessor('date', {
        header: 'Data',
        size: 120,
        cell: ({ row, getValue }) => (
          <input
            type="date"
            value={getValue()}
            onChange={(e) =>
              onUpdateEntry({
                entryId: row.original.id,
                workspaceId,
                date: e.target.value,
              })
            }
            className="w-full bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-ring rounded px-2 py-1 text-foreground text-sm"
          />
        ),
      }),
      columnHelper.accessor('description', {
        header: 'Descrição',
        size: 200,
        cell: ({ row, getValue }) => (
          <input
            type="text"
            value={getValue() || ''}
            onChange={(e) =>
              onUpdateEntry({
                entryId: row.original.id,
                workspaceId,
                description: e.target.value,
              })
            }
            placeholder="Descrição"
            className="w-full bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-ring rounded px-2 py-1 text-foreground placeholder:text-muted-foreground"
          />
        ),
        filterFn: 'includesString',
      }),
      columnHelper.accessor('type', {
        header: 'Tipo',
        size: 130,
        cell: ({ row, getValue }) => (
          <select
            value={getValue()}
            onChange={(e) =>
              onUpdateEntry({
                entryId: row.original.id,
                workspaceId,
                type: e.target.value as any,
              })
            }
            className={`w-full bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-ring rounded px-2 py-1 text-sm font-medium ${getTypeColor(
              getValue()
            )}`}
          >
            <option value="income">Receita</option>
            <option value="expense">Despesa</option>
            <option value="investment">Investimento</option>
            <option value="balance">Saldo</option>
          </select>
        ),
        filterFn: 'equals',
      }),
      columnHelper.accessor('category', {
        header: 'Categoria',
        size: 150,
        cell: ({ row, getValue }) => (
          <input
            type="text"
            value={getValue()}
            onChange={(e) =>
              onUpdateEntry({
                entryId: row.original.id,
                workspaceId,
                category: e.target.value,
              })
            }
            placeholder="Categoria"
            className="w-full bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-ring rounded px-2 py-1 text-foreground placeholder:text-muted-foreground"
          />
        ),
        filterFn: 'includesString',
      }),
      columnHelper.accessor('amount', {
        header: 'Valor',
        size: 130,
        cell: ({ row, getValue }) => (
          <input
            type="number"
            step="0.01"
            value={getValue()}
            onChange={(e) =>
              onUpdateEntry({
                entryId: row.original.id,
                workspaceId,
                amount: parseFloat(e.target.value),
              })
            }
            className={`w-full bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-ring rounded px-2 py-1 text-right font-medium ${getTypeColor(
              row.original.type
            )}`}
          />
        ),
      }),
      columnHelper.accessor('running_balance', {
        header: 'Saldo',
        size: 130,
        cell: ({ getValue }) => (
          <span className="text-sm font-semibold text-foreground">
            {formatCurrency(getValue() || 0)}
          </span>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        size: 110,
        cell: ({ row, getValue }) => (
          <select
            value={getValue() || 'paid'}
            onChange={(e) =>
              onUpdateEntry({
                entryId: row.original.id,
                workspaceId,
                status: e.target.value,
              })
            }
            className="w-full bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-ring rounded px-2 py-1 text-sm"
          >
            <option value="paid">Pago</option>
            <option value="pending">Pendente</option>
          </select>
        ),
        filterFn: 'equals',
      }),
      columnHelper.accessor('company', {
        header: 'Empresa',
        size: 150,
        cell: ({ row, getValue }) => (
          <input
            type="text"
            value={getValue() || ''}
            onChange={(e) =>
              onUpdateEntry({
                entryId: row.original.id,
                workspaceId,
                company: e.target.value,
              })
            }
            placeholder="Empresa"
            className="w-full bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-ring rounded px-2 py-1 text-foreground placeholder:text-muted-foreground"
          />
        ),
        filterFn: 'includesString',
      }),
      columnHelper.accessor('note', {
        header: 'Nota',
        size: 200,
        cell: ({ row, getValue }) => (
          <input
            type="text"
            value={getValue() || ''}
            onChange={(e) =>
              onUpdateEntry({
                entryId: row.original.id,
                workspaceId,
                note: e.target.value,
              })
            }
            placeholder="Nota"
            className="w-full bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-ring rounded px-2 py-1 text-foreground placeholder:text-muted-foreground"
          />
        ),
      }),
      columnHelper.accessor('recurrence', {
        header: 'Recorrência',
        size: 130,
        cell: ({ row, getValue }) => (
          <select
            value={getValue() || 'none'}
            onChange={(e) =>
              onUpdateEntry({
                entryId: row.original.id,
                workspaceId,
                recurrence: e.target.value,
              })
            }
            className="w-full bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-ring rounded px-2 py-1 text-sm"
          >
            <option value="none">-</option>
            <option value="daily">Diária</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensal</option>
            <option value="yearly">Anual</option>
          </select>
        ),
        filterFn: 'equals',
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        size: 60,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm('Tem certeza que deseja deletar este lançamento?')) {
                onDeleteEntry(row.original.id);
              }
            }}
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        ),
      }),
    ],
    [workspaceId, onUpdateEntry, onDeleteEntry]
  );

  const table = useReactTable({
    data: entries,
    columns,
    state: {
      globalFilter,
      columnFilters,
      sorting,
      columnVisibility,
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
  });

  const handleOpenDialog = (type: 'income' | 'expense' | 'investment' | 'balance') => {
    setDialogType(type);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Botões de adicionar */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => handleOpenDialog('income')} size="sm" variant="outline" className="gap-2">
          <Plus className="w-4 h-4" />
          Adicionar Receita
        </Button>
        <Button onClick={() => handleOpenDialog('expense')} size="sm" variant="outline" className="gap-2">
          <Plus className="w-4 h-4" />
          Adicionar Despesa
        </Button>
        <Button onClick={() => handleOpenDialog('investment')} size="sm" variant="outline" className="gap-2">
          <Plus className="w-4 h-4" />
          Adicionar Investimento
        </Button>
        <Button onClick={() => handleOpenDialog('balance')} size="sm" variant="outline" className="gap-2">
          <Plus className="w-4 h-4" />
          Adicionar Saldo
        </Button>
      </div>

      {/* Barra de controles */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        {/* Pesquisa global */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar em todas as colunas..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Controle de visibilidade de colunas */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings2 className="w-4 h-4" />
              Colunas
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {COLUMN_LABELS[column.id] || column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tabela com scroll horizontal responsivo */}
      <div className="border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <Fragment key={headerGroup.id}>
                <TableRow key={`${headerGroup.id}-header`}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className="relative group"
                    >
                      <div className="flex items-center gap-2">
                        {header.isPlaceholder ? null : (
                          <>
                            <div
                              className={
                                header.column.getCanSort()
                                  ? 'cursor-pointer select-none flex items-center gap-2'
                                  : ''
                              }
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {{
                                asc: <ArrowUp className="w-3 h-3" />,
                                desc: <ArrowDown className="w-3 h-3" />,
                              }[header.column.getIsSorted() as string] ?? (
                                header.column.getCanSort() ? (
                                  <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                                ) : null
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      {/* Resize handle */}
                      {header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none bg-border opacity-0 group-hover:opacity-100 hover:!opacity-100 hover:bg-primary ${
                            header.column.getIsResizing() ? 'opacity-100 bg-primary' : ''
                          }`}
                        />
                      )}
                    </TableHead>
                  ))}
                </TableRow>
                <TableRow key={`${headerGroup.id}-filters`}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={`${header.id}-filter`} style={{ width: header.getSize() }}>
                      {header.column.getCanFilter() ? (
                        <div>
                          {header.column.id === 'type' || header.column.id === 'status' || header.column.id === 'recurrence' ? (
                            <select
                              value={(header.column.getFilterValue() ?? '') as string}
                              onChange={(e) => header.column.setFilterValue(e.target.value || undefined)}
                              className="w-full text-xs bg-background border rounded px-2 py-1"
                            >
                              <option value="">Todos</option>
                              {header.column.id === 'type' && (
                                <>
                                  <option value="income">Receita</option>
                                  <option value="expense">Despesa</option>
                                  <option value="investment">Investimento</option>
                                  <option value="balance">Saldo</option>
                                </>
                              )}
                              {header.column.id === 'status' && (
                                <>
                                  <option value="paid">Pago</option>
                                  <option value="pending">Pendente</option>
                                </>
                              )}
                              {header.column.id === 'recurrence' && (
                                <>
                                  <option value="none">-</option>
                                  <option value="daily">Diária</option>
                                  <option value="weekly">Semanal</option>
                                  <option value="monthly">Mensal</option>
                                  <option value="yearly">Anual</option>
                                </>
                              )}
                            </select>
                          ) : (
                            <Input
                              type="text"
                              value={(header.column.getFilterValue() ?? '') as string}
                              onChange={(e) => header.column.setFilterValue(e.target.value || undefined)}
                              placeholder={`Filtrar...`}
                              className="w-full text-xs h-7"
                            />
                          )}
                        </div>
                      ) : null}
                    </TableHead>
                  ))}
                </TableRow>
              </Fragment>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-accent">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                      className={
                        cell.column.id === 'running_balance' || cell.column.id === 'amount'
                          ? 'text-right'
                          : ''
                      }
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Info de resultados */}
      <div className="text-sm text-muted-foreground">
        {table.getFilteredRowModel().rows.length} de {entries.length} lançamento(s)
      </div>

      {/* Modal de adicionar entrada */}
      <FinanceEntryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        type={dialogType}
        workspaceId={workspaceId}
        onCreateEntry={onCreateEntry}
      />
    </div>
  );
}
