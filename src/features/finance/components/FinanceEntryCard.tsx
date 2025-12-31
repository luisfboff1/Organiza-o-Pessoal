'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '../lib/currency-formatter';
import { ChevronDown, ChevronUp, Trash2, Pencil } from 'lucide-react';
import { FinanceEntry } from '../types';
import { cn } from '@/lib/utils';

interface FinanceEntryCardProps {
  entry: FinanceEntry;
  onDelete: (id: string) => void;
  onEdit?: (entry: FinanceEntry) => void;
}

const TYPE_LABELS = {
  income: 'Receita',
  expense: 'Despesa',
  investment: 'Investimento',
  balance: 'Saldo',
};

const TYPE_COLORS = {
  income: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 border-green-200',
  expense: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 border-red-200',
  investment: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border-blue-200',
  balance: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400 border-purple-200',
};

export function FinanceEntryCard({ entry, onDelete, onEdit }: FinanceEntryCardProps) {
  const [expanded, setExpanded] = useState(false);

  const formattedDate = new Date(entry.date + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const getAmountColor = (type: string) => {
    switch (type) {
      case 'income':
      case 'balance':
        return 'text-green-600 dark:text-green-400';
      case 'expense':
        return 'text-red-600 dark:text-red-400';
      case 'investment':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-foreground';
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        {/* Main Info - Always Visible */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline" className={cn("text-xs", TYPE_COLORS[entry.type])}>
                {TYPE_LABELS[entry.type]}
              </Badge>
              {entry.status === 'pending' && (
                <Badge variant="secondary" className="text-xs">
                  Pendente
                </Badge>
              )}
              {entry.recurrence && entry.recurrence !== 'none' && (
                <Badge variant="outline" className="text-xs">
                  {entry.recurrence === 'monthly' ? '📅 Mensal' :
                   entry.recurrence === 'weekly' ? '📅 Semanal' :
                   entry.recurrence === 'yearly' ? '📅 Anual' : '📅 Recorrente'}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{formattedDate}</p>
          </div>
          <div className="text-right">
            <p className={cn("text-xl sm:text-2xl font-bold whitespace-nowrap", getAmountColor(entry.type))}>
              {formatCurrency(entry.amount)}
            </p>
          </div>
        </div>

        {/* Category & Description */}
        <div className="space-y-1 mb-3">
          {entry.category && (
            <p className="text-sm font-medium line-clamp-1">{entry.category}</p>
          )}
          {entry.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {entry.description}
            </p>
          )}
        </div>

        {/* Expandable Details */}
        {expanded && (
          <div className="border-t pt-3 mt-3 space-y-2 text-sm">
            {entry.company && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Empresa:</span>
                <span className="font-medium line-clamp-1 text-right">{entry.company}</span>
              </div>
            )}
            {entry.note && (
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">Nota:</span>
                <span className="font-medium text-sm">{entry.note}</span>
              </div>
            )}
            {entry.running_balance !== undefined && entry.running_balance !== null && (
              <div className="flex justify-between pt-2 border-t">
                <span className="text-muted-foreground">Saldo Acumulado:</span>
                <span className="font-semibold">{formatCurrency(entry.running_balance)}</span>
              </div>
            )}
            {entry.projects && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Projeto:</span>
                <span className="font-medium">{entry.projects.title}</span>
              </div>
            )}
            {entry.pages && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Página:</span>
                <span className="font-medium">{entry.pages.title}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="flex-1 h-9"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Menos detalhes
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Mais detalhes
              </>
            )}
          </Button>
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(entry)}
              className="h-9"
            >
              <Pencil className="w-4 h-4 text-blue-500" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm('Tem certeza que deseja deletar este lançamento?')) {
                onDelete(entry.id);
              }
            }}
            className="h-9"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
