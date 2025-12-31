'use client';

import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  LabelList,
} from 'recharts';
import { formatCurrency } from '../lib/currency-formatter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings2 } from 'lucide-react';
import { FinanceCalendar } from './FinanceCalendar';
import { useResponsiveChartConfig } from '../hooks/useResponsiveChartConfig';
import { useMobileDetect } from '@/hooks/useMobileDetect';
import { cn } from '@/lib/utils';

interface CashFlowChartDailyProps {
  entries: any[];
  allEntries?: any[]; // Todas as entradas sem filtro
}

export function CashFlowChartDaily({ entries, allEntries }: CashFlowChartDailyProps) {
  const [dateFilter, setDateFilter] = useState<string>('3-months');
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [showSettings, setShowSettings] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Responsive chart configuration
  const chartConfig = useResponsiveChartConfig();
  const { isMobile } = useMobileDetect();

  // No mobile, sempre usar gráfico de linha
  const effectiveChartType = isMobile ? 'line' : chartType;

  // Usar allEntries se disponível, senão usar entries
  const dataSource = allEntries || entries;

  const getDateRange = () => {
    const today = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (dateFilter) {
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'next-month':
        startDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
        break;
      case '3-months':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 3, 0);
        break;
      case 'next-3-months':
        startDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 4, 0);
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear(), 11, 31);
        break;
      case 'all':
        startDate = new Date(0); // Início dos tempos
        endDate = new Date(today.getFullYear() + 1, 11, 31); // Um ano no futuro
        break;
    }

    return { startDate, endDate };
  };

  const chartData = useMemo(() => {
    if (!dataSource || dataSource.length === 0) return { daily: [] };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Encontrar o último dia com movimentação antes de hoje
    const entriesBeforeToday = dataSource
      .filter(entry => entry.date < todayStr)
      .sort((a, b) => b.date.localeCompare(a.date));

    const lastEntryBeforeToday = entriesBeforeToday.length > 0 ? entriesBeforeToday[0] : null;

    // Definir data inicial como o último dia com movimentação antes de hoje
    // Mas limitar a no máximo 7 dias antes para evitar que "Hoje" fique cortado
    let startDate = today;
    if (lastEntryBeforeToday) {
      const lastDate = new Date(lastEntryBeforeToday.date);
      const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff <= 7) {
        // Se a última movimentação foi nos últimos 7 dias, usar ela
        startDate = lastDate;
      } else {
        // Se foi há mais de 7 dias, começar de 7 dias atrás
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
      }
    } else {
      // Se não houver movimentação anterior, começar de 7 dias atrás
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
    }
    startDate.setHours(0, 0, 0, 0);

    // Definir data final como hoje + 3 meses
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 3);
    endDate.setHours(23, 59, 59, 999);

    // Calcular saldo acumulado ANTES do período selecionado
    const entriesBeforePeriod = dataSource.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate < startDate;
    });

    let initialBalance = 0;
    entriesBeforePeriod.forEach(entry => {
      if (entry.type === 'income' || entry.type === 'balance') {
        initialBalance += entry.amount;
      } else if (entry.type === 'expense') {
        initialBalance -= entry.amount;
      } else if (entry.type === 'investment') {
        initialBalance -= entry.amount;
      }
    });

    // Filtrar entradas do período
    const filteredEntries = dataSource.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate <= endDate;
    });

    // Agrupar por dia
    const dailyData = new Map<string, {
      income: number;
      expense: number;
      investment: number;
      entries: any[];
    }>();

    filteredEntries.forEach(entry => {
      const dateKey = entry.date; // Já está no formato YYYY-MM-DD

      if (!dailyData.has(dateKey)) {
        dailyData.set(dateKey, { income: 0, expense: 0, investment: 0, entries: [] });
      }

      const day = dailyData.get(dateKey)!;
      day.entries.push(entry);

      if (entry.type === 'income' || entry.type === 'balance') {
        day.income += entry.amount;
      } else if (entry.type === 'expense') {
        day.expense += entry.amount;
      } else if (entry.type === 'investment') {
        day.investment += entry.amount;
      }
    });

    // Converter para array apenas os dias com movimentação, começando com saldo inicial
    let cumulativeBalance = initialBalance;
    const dailyArray = Array.from(dailyData.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, values]) => {
        const netFlow = values.income - values.expense - values.investment;
        cumulativeBalance += netFlow;

        return {
          date,
          dateFormatted: new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
          }),
          Receita: values.income,
          Despesa: -values.expense, // Negativo para aparecer abaixo do eixo
          Investimento: -values.investment, // Negativo para aparecer abaixo do eixo
          'Saldo Acumulado': cumulativeBalance,
          entries: values.entries,
        };
      });

    // Adicionar hoje ao gráfico se estiver no período mas não tiver movimentação
    if (todayStr >= startDate.toISOString().split('T')[0] &&
        todayStr <= endDate.toISOString().split('T')[0] &&
        !dailyData.has(todayStr)) {
      const todayFormatted = new Date(todayStr + 'T12:00:00').toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
      });

      // Encontrar posição correta para inserir
      const insertIndex = dailyArray.findIndex(item => item.date > todayStr);

      // Encontrar o saldo acumulado correto para hoje
      // (saldo da última data antes de hoje)
      const lastBalanceBeforeToday = insertIndex === 0
        ? initialBalance
        : (insertIndex === -1
          ? dailyArray[dailyArray.length - 1]['Saldo Acumulado']
          : dailyArray[insertIndex - 1]['Saldo Acumulado']);

      // Inserir hoje na posição correta
      const todayEntry = {
        date: todayStr,
        dateFormatted: todayFormatted,
        Receita: 0,
        Despesa: 0,
        Investimento: 0,
        'Saldo Acumulado': lastBalanceBeforeToday,
        entries: [],
      };

      if (insertIndex === -1) {
        dailyArray.push(todayEntry);
      } else {
        dailyArray.splice(insertIndex, 0, todayEntry);
      }
    }

    return { daily: dailyArray };
  }, [dataSource]);

  // Pré-calcular quais datas devem mostrar o label mês/ano no eixo X
  const monthYearLabels = useMemo(() => {
    const labels = new Map<string, string>();
    let lastMonthYear = '';

    chartData.daily.forEach((dataPoint: any, index: number) => {
      const fullDate = new Date(dataPoint.date + 'T12:00:00');
      const monthYear = fullDate.toLocaleDateString('pt-BR', {
        month: 'short',
        year: '2-digit',
      }).replace(/\./g, '/');

      // Sempre adicionar o primeiro label, depois só quando muda
      if (index === 0 || monthYear !== lastMonthYear) {
        labels.set(dataPoint.dateFormatted, monthYear);
        lastMonthYear = monthYear;
      }
    });

    return labels;
  }, [chartData.daily]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const entries = data.entries || [];

      // Separar por tipo
      const incomes = entries.filter((e: any) => e.type === 'income' || e.type === 'balance');
      const expenses = entries.filter((e: any) => e.type === 'expense');
      const investments = entries.filter((e: any) => e.type === 'investment');

      return (
        <div className={cn(
          "bg-card border rounded-lg shadow-lg",
          isMobile ? "p-2 max-w-[200px]" : "p-3 max-w-xs"
        )}>
          <p className={cn("font-semibold text-card-foreground mb-2", isMobile ? "text-xs" : "text-sm")}>{data.dateFormatted}</p>

          {incomes.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-semibold" style={{ color: '#10b981' }}>Receitas:</p>
              {incomes.map((entry: any, idx: number) => (
                <p key={idx} className="text-xs ml-2" style={{ color: '#10b981' }}>
                  • {entry.description || entry.company || 'Sem descrição'}: {formatCurrency(entry.amount)}
                </p>
              ))}
            </div>
          )}

          {expenses.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-semibold" style={{ color: '#ef4444' }}>Despesas:</p>
              {expenses.map((entry: any, idx: number) => (
                <p key={idx} className="text-xs ml-2" style={{ color: '#ef4444' }}>
                  • {entry.description || entry.company || 'Sem descrição'}: {formatCurrency(entry.amount)}
                </p>
              ))}
            </div>
          )}

          {investments.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-semibold" style={{ color: '#3b82f6' }}>Investimentos:</p>
              {investments.map((entry: any, idx: number) => (
                <p key={idx} className="text-xs ml-2" style={{ color: '#3b82f6' }}>
                  • {entry.description || entry.company || 'Sem descrição'}: {formatCurrency(entry.amount)}
                </p>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-muted">
            <p className="text-xs font-semibold" style={{ color: '#8b5cf6' }}>
              Saldo Acumulado: {formatCurrency(data['Saldo Acumulado'])}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderCustomBarLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    if (!value || value === 0) return <></>;

    const isNegative = value < 0;
    const displayValue = formatCurrency(Math.abs(value));

    return (
      <text
        x={x + width / 2}
        y={isNegative ? y + height + 15 : y - 5}
        fill="hsl(var(--foreground))"
        textAnchor="middle"
        fontSize={isMobile ? "11" : "12"}
        fontWeight="500"
      >
        {displayValue}
      </text>
    );
  };

  const renderChart = () => {
    const commonProps = {
      data: chartData.daily,
    };

    // Data de hoje formatada para comparação
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    const todayFormatted = new Date(todayStr + 'T12:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });

    // Formatter customizado para eixo X: mostra mês/ano apenas quando muda
    const xAxisTickFormatter = (value: string) => {
      return monthYearLabels.get(value) || '';
    };

    if (effectiveChartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={chartConfig.height}>
          <BarChart
            {...commonProps}
            margin={isMobile
              ? { top: 20, right: 10, left: -20, bottom: 5 }
              : { top: 20, right: 30, left: 0, bottom: 5 }
            }
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="dateFormatted"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              tickFormatter={xAxisTickFormatter}
            />
            {!isMobile && <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />}
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <ReferenceLine y={0} stroke="#666" />
            <ReferenceLine
              x={todayFormatted}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{
                value: 'Hoje',
                position: isMobile ? 'insideTopLeft' : 'top',
                fill: '#ef4444',
                fontSize: isMobile ? 10 : 12
              }}
            />
            {showDetails ? (
              <>
                <Bar dataKey="Receita" fill="#10b981" stackId="a">
                  {!isMobile && <LabelList content={renderCustomBarLabel} />}
                </Bar>
                <Bar dataKey="Despesa" fill="#ef4444" stackId="a">
                  {!isMobile && <LabelList content={renderCustomBarLabel} />}
                </Bar>
                <Bar dataKey="Investimento" fill="#3b82f6" stackId="a">
                  {!isMobile && <LabelList content={renderCustomBarLabel} />}
                </Bar>
              </>
            ) : (
              <Bar dataKey="Saldo Acumulado" fill="#8b5cf6">
                {!isMobile && <LabelList content={renderCustomBarLabel} />}
              </Bar>
            )}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={chartConfig.height}>
        <LineChart
          {...commonProps}
          margin={isMobile
            ? { top: 20, right: 10, left: -20, bottom: 5 }
            : { top: 20, right: 30, left: 0, bottom: 5 }
          }
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="dateFormatted"
            className="text-xs"
            tick={{ fill: 'currentColor' }}
            tickFormatter={xAxisTickFormatter}
          />
          {!isMobile && <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />}
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <ReferenceLine y={0} stroke="#666" />
          <ReferenceLine
            x={todayFormatted}
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="5 5"
            label={{
              value: 'Hoje',
              position: isMobile ? 'insideTopLeft' : 'top',
              fill: '#ef4444',
              fontSize: isMobile ? 10 : 12
            }}
          />
          {showDetails ? (
            <>
              <Line type="monotone" dataKey="Receita" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="Despesa" stroke="#ef4444" strokeWidth={2} />
              <Line type="monotone" dataKey="Investimento" stroke="#3b82f6" strokeWidth={2} />
            </>
          ) : null}
          <Line
            type="monotone"
            dataKey="Saldo Acumulado"
            stroke="#8b5cf6"
            strokeWidth={3}
            strokeDasharray={showDetails ? "5 5" : "0"}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Fluxo de Caixa Diário</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Exibindo desde a última movimentação até 3 meses a partir de hoje
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings2 className="w-4 h-4" />
              {!isMobile && <span className="ml-2">Configurar</span>}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-4 p-3 sm:p-6">
          {showSettings && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
              <div className="space-y-2">
                <Label>Período do Calendário</Label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Este Mês</SelectItem>
                    <SelectItem value="next-month">Próximo Mês</SelectItem>
                    <SelectItem value="3-months">Próximos 3 Meses</SelectItem>
                    <SelectItem value="next-3-months">3 Meses à Frente</SelectItem>
                    <SelectItem value="year">Este Ano</SelectItem>
                    <SelectItem value="all">Todo Tempo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Gráfico</Label>
                <Select value={chartType} onValueChange={(v: any) => setChartType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">Barras</SelectItem>
                    <SelectItem value="line">Linhas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Exibição</Label>
                <div className="flex items-center space-x-2 h-10">
                  <input
                    type="checkbox"
                    id="show-details"
                    checked={showDetails}
                    onChange={(e) => setShowDetails(e.target.checked)}
                    className="w-4 h-4 rounded border-input"
                  />
                  <label htmlFor="show-details" className="text-sm cursor-pointer">
                    Mostrar Receitas/Despesas/Investimentos
                  </label>
                </div>
              </div>
            </div>
          )}

          {chartData.daily.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground border rounded-lg">
              Sem dados para exibir no período selecionado
            </div>
          ) : (
            renderChart()
          )}

          <div className="text-sm text-muted-foreground">
            {chartData.daily.length} dia(s) com movimentação
          </div>
        </CardContent>
      </Card>

      <FinanceCalendar
        entries={dataSource}
        startDate={getDateRange().startDate}
        endDate={getDateRange().endDate}
      />
    </div>
  );
}
