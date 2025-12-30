'use client';

import { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../lib/currency-formatter';

interface CashFlowChartProps {
  entries: any[];
  showProjection?: boolean;
}

export function CashFlowChart({ entries, showProjection = true }: CashFlowChartProps) {
  const chartData = useMemo(() => {
    if (!entries || entries.length === 0) return [];

    const formatMonthYear = (monthKey: string) => {
      const [year, month] = monthKey.split('-');
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return `${monthNames[parseInt(month) - 1]}/${year}`;
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Separar entradas passadas e futuras
    const pastEntries = entries.filter(e => new Date(e.date) <= today);
    const futureEntries = entries.filter(e => new Date(e.date) > today);

    // Agrupar entradas PASSADAS por mês (histórico real)
    const monthlyData = new Map<string, { income: number; expense: number; investment: number; balance: number; isFuture: boolean }>();

    pastEntries.forEach(entry => {
      const date = new Date(entry.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { income: 0, expense: 0, investment: 0, balance: 0, isFuture: false });
      }

      const month = monthlyData.get(monthKey)!;

      if (entry.type === 'income' || entry.type === 'balance') {
        month.income += entry.amount;
      } else if (entry.type === 'expense') {
        month.expense += entry.amount;
      } else if (entry.type === 'investment') {
        month.investment += entry.amount;
      }
    });

    // Agrupar entradas FUTURAS por mês (projeção baseada em dados reais)
    futureEntries.forEach(entry => {
      const date = new Date(entry.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { income: 0, expense: 0, investment: 0, balance: 0, isFuture: true });
      }

      const month = monthlyData.get(monthKey)!;
      month.isFuture = true;

      if (entry.type === 'income' || entry.type === 'balance') {
        month.income += entry.amount;
      } else if (entry.type === 'expense') {
        month.expense += entry.amount;
      } else if (entry.type === 'investment') {
        month.investment += entry.amount;
      }
    });

    // Converter para array e calcular saldo acumulado
    let cumulativeBalance = 0;
    const data = Array.from(monthlyData.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, values]) => {
        const netFlow = values.income - values.expense - values.investment;
        cumulativeBalance += netFlow;

        return {
          month: formatMonthYear(month) + (values.isFuture ? ' (Previsto)' : ''),
          monthKey: month,
          Receitas: values.income,
          Despesas: values.expense,
          Investimentos: values.investment,
          'Fluxo Líquido': netFlow,
          'Saldo Acumulado': cumulativeBalance,
          isFuture: values.isFuture,
        };
      });

    return data;
  }, [entries, showProjection]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-card-foreground mb-2">{payload[0].payload.month}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground border rounded-lg">
        Sem dados para exibir
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gráfico de Fluxo de Caixa (Receitas vs Despesas) */}
      <div className="bg-card border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4 text-card-foreground">Fluxo de Caixa Mensal</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" tick={{ fill: 'currentColor' }} />
            <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="Receitas" fill="#10b981" />
            <Bar dataKey="Despesas" fill="#ef4444" />
            <Bar dataKey="Investimentos" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de Saldo Acumulado */}
      <div className="bg-card border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4 text-card-foreground">Saldo Acumulado ao Longo do Tempo</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" tick={{ fill: 'currentColor' }} />
            <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="Saldo Acumulado"
              stroke="#8b5cf6"
              strokeWidth={3}
              dot={{ fill: '#8b5cf6', r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="Fluxo Líquido"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
