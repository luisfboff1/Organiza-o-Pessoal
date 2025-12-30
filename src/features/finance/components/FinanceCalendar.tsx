'use client';

import { useMemo, useState } from 'react';
import { formatCurrency } from '../lib/currency-formatter';
import { TrendingUp, TrendingDown, PiggyBank, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface FinanceCalendarProps {
  entries: any[];
  startDate?: Date;
  endDate?: Date;
}

export function FinanceCalendar({ entries, startDate, endDate }: FinanceCalendarProps) {
  // Estado para controlar qual semana está sendo exibida (0 = semana atual)
  const [weekOffset, setWeekOffset] = useState(0);
  const currentWeekData = useMemo(() => {
    // Encontrar o domingo da semana atual (ou do offset)
    const today = new Date();
    const todayDay = today.getDay(); // 0 = domingo, 1 = segunda, etc.

    // Encontrar o domingo da semana atual
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - todayDay);

    // Aplicar o offset de semanas
    currentWeekStart.setDate(currentWeekStart.getDate() + (weekOffset * 7));

    // Agrupar entradas por dia
    const entriesByDate = new Map<string, any[]>();
    entries.forEach(entry => {
      const dateKey = entry.date;
      if (!entriesByDate.has(dateKey)) {
        entriesByDate.set(dateKey, []);
      }
      entriesByDate.get(dateKey)!.push(entry);
    });

    // Criar array com os 7 dias da semana
    const weekDays = [];
    const todayStr = new Date().toISOString().split('T')[0];

    for (let i = 0; i < 7; i++) {
      const current = new Date(currentWeekStart);
      current.setDate(currentWeekStart.getDate() + i);

      const dateStr = current.toISOString().split('T')[0];
      const dayEntries = entriesByDate.get(dateStr) || [];

      weekDays.push({
        date: new Date(current),
        dateStr,
        entries: dayEntries,
        dayOfWeek: current.getDay(),
        dayOfMonth: current.getDate(),
        month: current.toLocaleDateString('pt-BR', { month: 'short' }),
        isToday: dateStr === todayStr,
      });
    }

    return weekDays;
  }, [entries, weekOffset]);

  const getStatusBackground = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-white dark:bg-slate-800/70 border-gray-200 dark:border-slate-600';
      case 'pending':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700';
      default:
        return 'bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-600';
    }
  };

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
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getEntryIcon = (type: string) => {
    switch (type) {
      case 'income':
      case 'balance':
        return <TrendingUp className="w-3 h-3" />;
      case 'expense':
        return <TrendingDown className="w-3 h-3" />;
      case 'investment':
        return <PiggyBank className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Formatar período da semana exibida
  const weekPeriod = currentWeekData.length > 0
    ? `${currentWeekData[0].date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${currentWeekData[6].date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`
    : '';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Calendário de Movimentações</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{weekPeriod}</span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setWeekOffset(weekOffset - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => setWeekOffset(0)}
                disabled={weekOffset === 0}
              >
                Hoje
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setWeekOffset(weekOffset + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Header com dias da semana */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day, idx) => (
            <div key={idx} className="text-center text-xs font-semibold text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Grid de dias */}
        <div className="grid grid-cols-7 gap-2">
          {currentWeekData.map((day, idx) => (
            <div
              key={idx}
              className={`min-h-[120px] border rounded-lg p-2 ${
                day.isToday
                  ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                  : 'border-border bg-card'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-semibold ${day.isToday ? 'text-red-600' : 'text-muted-foreground'}`}>
                  {day.dayOfMonth}
                </span>
                {day.dayOfMonth === 1 && (
                  <span className="text-[10px] text-muted-foreground">{day.month}</span>
                )}
              </div>

              <div className="space-y-1">
                {day.entries.map((entry: any, entryIdx: number) => (
                  <div
                    key={entryIdx}
                    className={`text-[10px] px-1.5 py-1 rounded border ${getStatusBackground(entry.status || 'paid')}`}
                    title={`${entry.description || entry.company} - ${formatCurrency(entry.amount)} - ${entry.status === 'paid' ? 'Pago' : 'Pendente'}`}
                  >
                    <div className="flex items-center gap-1 justify-between">
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        {getEntryIcon(entry.type)}
                        <span className="truncate text-foreground">
                          {entry.description || entry.company || 'Sem descrição'}
                        </span>
                      </div>
                      <span className={`text-[9px] px-1 rounded ${
                        entry.status === 'paid'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                      }`}>
                        {entry.status === 'paid' ? '✓' : '○'}
                      </span>
                    </div>
                    <div className={`font-semibold mt-0.5 ${getAmountColor(entry.type)}`}>
                      {formatCurrency(entry.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
