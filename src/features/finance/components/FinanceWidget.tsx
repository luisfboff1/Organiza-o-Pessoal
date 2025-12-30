'use client';

import { useMemo } from 'react';
import { formatCurrency } from '../lib/currency-formatter';
import { TrendingUp, TrendingDown, DollarSign, PiggyBank, Wallet, CreditCard, ShoppingCart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FinanceWidgetProps {
  widget: {
    id: string;
    title: string;
    type: 'income' | 'expense' | 'investment' | 'balance';
    filters: {
      category?: string;
      company?: string;
      description?: string;
    };
  };
  entries: any[];
  startDate?: string;
  endDate?: string;
  onDelete?: (widgetId: string) => void;
}

const WIDGET_ICONS = {
  income: TrendingUp,
  expense: TrendingDown,
  investment: PiggyBank,
  balance: Wallet,
};

const WIDGET_COLORS = {
  income: {
    bg: 'bg-green-50 dark:bg-green-950',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-700 dark:text-green-400',
  },
  expense: {
    bg: 'bg-red-50 dark:bg-red-950',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-700 dark:text-red-400',
  },
  investment: {
    bg: 'bg-blue-50 dark:bg-blue-950',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-400',
  },
  balance: {
    bg: 'bg-purple-50 dark:bg-purple-950',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-700 dark:text-purple-400',
  },
};

export function FinanceWidget({ widget, entries, startDate, endDate, onDelete }: FinanceWidgetProps) {
  const Icon = WIDGET_ICONS[widget.type];
  const colors = WIDGET_COLORS[widget.type];

  const value = useMemo(() => {
    let filtered = entries.filter(e => e.type === widget.type);

    // Filter by date range if provided
    if (startDate && endDate) {
      filtered = filtered.filter(e => {
        const entryDate = new Date(e.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return entryDate >= start && entryDate <= end;
      });
    }

    if (widget.filters.category) {
      filtered = filtered.filter(e =>
        e.category?.toLowerCase().includes(widget.filters.category!.toLowerCase())
      );
    }

    if (widget.filters.company) {
      filtered = filtered.filter(e =>
        e.company?.toLowerCase().includes(widget.filters.company!.toLowerCase())
      );
    }

    if (widget.filters.description) {
      filtered = filtered.filter(e =>
        e.description?.toLowerCase().includes(widget.filters.description!.toLowerCase())
      );
    }

    return filtered.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  }, [entries, widget, startDate, endDate]);

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-lg p-4 relative group`}>
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
          onClick={() => onDelete(widget.id)}
        >
          <X className="w-4 h-4" />
        </Button>
      )}
      <div className={`flex items-center gap-2 ${colors.text} mb-2`}>
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{widget.title}</span>
      </div>
      <p className={`text-2xl font-bold ${colors.text}`}>
        {formatCurrency(value)}
      </p>
      {(widget.filters.category || widget.filters.company || widget.filters.description) && (
        <div className="mt-2 text-xs text-muted-foreground">
          {widget.filters.category && <div>Categoria: {widget.filters.category}</div>}
          {widget.filters.company && <div>Empresa: {widget.filters.company}</div>}
          {widget.filters.description && <div>Descrição: {widget.filters.description}</div>}
        </div>
      )}
    </div>
  );
}
