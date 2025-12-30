'use client';

import { useState } from 'react';
import { formatCurrency } from '../lib/currency-formatter';
import { TrendingUp, TrendingDown, DollarSign, PiggyBank, Wallet, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FinanceWidget } from './FinanceWidget';
import { FinanceWidgetDialog } from './FinanceWidgetDialog';
import { useCustomWidgets } from '../hooks/useCustomWidgets';

interface FinanceSummaryProps {
  workspaceId: string;
  summary: {
    income: number;
    expense: number;
    balance: number;
    investment?: number;
    totalBalance?: number;
  };
  entries?: any[];
  startDate?: string;
  endDate?: string;
}

export function FinanceSummary({ workspaceId, summary, entries = [], startDate, endDate }: FinanceSummaryProps) {
  const [widgetDialogOpen, setWidgetDialogOpen] = useState(false);
  const { widgets, deleteWidget } = useCustomWidgets(workspaceId);

  // Filtrar apenas widgets do tipo 'summary'
  const summaryWidgets = widgets.filter((w) => w.widget_type === 'summary');

  const handleDeleteWidget = (widgetId: string) => {
    deleteWidget(widgetId);
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-medium">Receitas</span>
        </div>
        <p className="text-2xl font-bold text-green-700 dark:text-green-400">{formatCurrency(summary.income)}</p>
      </div>

      <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-700 dark:text-red-400 mb-2">
          <TrendingDown className="w-4 h-4" />
          <span className="text-sm font-medium">Despesas</span>
        </div>
        <p className="text-2xl font-bold text-red-700 dark:text-red-400">{formatCurrency(summary.expense)}</p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 mb-2">
          <PiggyBank className="w-4 h-4" />
          <span className="text-sm font-medium">Investimentos</span>
        </div>
        <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
          {formatCurrency(summary.investment || 0)}
        </p>
      </div>

      <div
        className={`border rounded-lg p-4 ${
          summary.balance >= 0
            ? 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800'
            : 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800'
        }`}
      >
        <div
          className={`flex items-center gap-2 mb-2 ${
            summary.balance >= 0 ? 'text-purple-700 dark:text-purple-400' : 'text-orange-700 dark:text-orange-400'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span className="text-sm font-medium">Resultado do Período</span>
        </div>
        <p
          className={`text-2xl font-bold ${
            summary.balance >= 0 ? 'text-purple-700 dark:text-purple-400' : 'text-orange-700 dark:text-orange-400'
          }`}
        >
          {formatCurrency(summary.balance)}
        </p>
      </div>

      <div
        className={`border rounded-lg p-4 ${
          (summary.totalBalance || 0) >= 0
            ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800'
            : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
        }`}
      >
        <div
          className={`flex items-center gap-2 mb-2 ${
            (summary.totalBalance || 0) >= 0
              ? 'text-emerald-700 dark:text-emerald-400'
              : 'text-red-700 dark:text-red-400'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span className="text-sm font-medium">Saldo Hoje</span>
        </div>
        <p
          className={`text-2xl font-bold ${
            (summary.totalBalance || 0) >= 0
              ? 'text-emerald-700 dark:text-emerald-400'
              : 'text-red-700 dark:text-red-400'
          }`}
        >
          {formatCurrency(summary.totalBalance || 0)}
        </p>
      </div>
      </div>

      {/* Widgets Customizados */}
      {summaryWidgets.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Widgets Personalizados</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setWidgetDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar Widget
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {summaryWidgets.map((widget) => (
              <FinanceWidget
                key={widget.id}
                widget={{
                  id: widget.id,
                  title: widget.title,
                  type: widget.config.type,
                  filters: widget.config.filters || {},
                }}
                entries={entries}
                startDate={startDate}
                endDate={endDate}
                onDelete={handleDeleteWidget}
              />
            ))}
          </div>
        </div>
      )}

      {/* Botão para adicionar primeiro widget */}
      {summaryWidgets.length === 0 && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setWidgetDialogOpen(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Criar Widget Personalizado
          </Button>
        </div>
      )}

      {/* Diálogo de criação de widget */}
      <FinanceWidgetDialog
        open={widgetDialogOpen}
        onOpenChange={setWidgetDialogOpen}
        workspaceId={workspaceId}
        entries={entries}
      />
    </div>
  );
}
