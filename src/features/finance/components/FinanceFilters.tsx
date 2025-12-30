'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar, CalendarClock, CalendarRange, Clock } from 'lucide-react';

interface FinanceFiltersProps {
  startDate: string;
  endDate: string;
  type: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onTypeChange: (type: string) => void;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

type FilterMode = 'month' | 'year' | 'all' | 'specific-month' | 'custom';

export function FinanceFilters({
  startDate,
  endDate,
  type,
  onStartDateChange,
  onEndDateChange,
  onTypeChange,
}: FinanceFiltersProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showSpecificMonth, setShowSpecificMonth] = useState(false);
  const [showCustom, setShowCustom] = useState(false);

  // Gerar anos (5 anos para trás e 2 para frente)
  const years = Array.from({ length: 8 }, (_, i) => currentYear - 5 + i);

  // Detectar qual filtro está ativo baseado nas datas atuais
  const getActiveFilter = (): FilterMode => {
    if (!startDate || !endDate) return 'month';

    const today = new Date();
    const start = new Date(startDate + 'T12:00:00');
    const end = new Date(endDate + 'T12:00:00');

    // Este Mês
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    if (start.toISOString().split('T')[0] === thisMonthStart.toISOString().split('T')[0] &&
        end.toISOString().split('T')[0] === thisMonthEnd.toISOString().split('T')[0]) {
      return 'month';
    }

    // Este Ano
    const thisYearStart = new Date(today.getFullYear(), 0, 1);
    const thisYearEnd = new Date(today.getFullYear(), 11, 31);
    if (start.toISOString().split('T')[0] === thisYearStart.toISOString().split('T')[0] &&
        end.toISOString().split('T')[0] === thisYearEnd.toISOString().split('T')[0]) {
      return 'year';
    }

    // Verificar se é um mês específico (antes de "Todo Tempo" para ter prioridade)
    const monthStart = new Date(start.getFullYear(), start.getMonth(), 1);
    const monthEnd = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    if (start.toISOString().split('T')[0] === monthStart.toISOString().split('T')[0] &&
        end.toISOString().split('T')[0] === monthEnd.toISOString().split('T')[0]) {
      return 'specific-month';
    }

    // Todo Tempo - verificar se começa em 2020 e vai até hoje ou próximo de hoje
    const allTimeStart = new Date(2020, 0, 1);
    const startDateStr = start.toISOString().split('T')[0];
    const endDateStr = end.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    const allTimeStartStr = allTimeStart.toISOString().split('T')[0];

    if (startDateStr === allTimeStartStr && endDateStr === todayStr) {
      return 'all';
    }

    return 'custom';
  };

  const activeFilter = getActiveFilter();

  const applyFilter = (mode: FilterMode) => {
    const today = new Date();

    switch (mode) {
      case 'month':
        {
          setShowSpecificMonth(false);
          setShowCustom(false);
          const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
          const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          onStartDateChange(firstDay.toISOString().split('T')[0]);
          onEndDateChange(lastDay.toISOString().split('T')[0]);
        }
        break;
      case 'year':
        {
          setShowSpecificMonth(false);
          setShowCustom(false);
          const firstDay = new Date(today.getFullYear(), 0, 1);
          const lastDay = new Date(today.getFullYear(), 11, 31);
          onStartDateChange(firstDay.toISOString().split('T')[0]);
          onEndDateChange(lastDay.toISOString().split('T')[0]);
        }
        break;
      case 'all':
        {
          setShowSpecificMonth(false);
          setShowCustom(false);
          const start = new Date(2020, 0, 1);
          onStartDateChange(start.toISOString().split('T')[0]);
          onEndDateChange(today.toISOString().split('T')[0]);
        }
        break;
      case 'specific-month':
        setShowSpecificMonth(true);
        setShowCustom(false);
        // Aplicar o mês já selecionado
        applySpecificMonth(selectedMonth, selectedYear);
        break;
      case 'custom':
        setShowSpecificMonth(false);
        setShowCustom(true);
        // Manter as datas atuais
        break;
    }
  };

  const applySpecificMonth = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    onStartDateChange(firstDay.toISOString().split('T')[0]);
    onEndDateChange(lastDay.toISOString().split('T')[0]);
  };

  const getFilterLabel = () => {
    switch (activeFilter) {
      case 'month':
        return 'Este Mês';
      case 'year':
        return 'Este Ano';
      case 'all':
        return 'Todo Tempo';
      case 'specific-month':
        return `${MONTHS[selectedMonth]} ${selectedYear}`;
      case 'custom':
        return 'Período Personalizado';
      default:
        return '';
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filtros</h3>
        <span className="text-sm text-muted-foreground">{getFilterLabel()}</span>
      </div>

      {/* Cards de filtro rápido */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeFilter === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => applyFilter('month')}
        >
          <Calendar className="w-4 h-4 mr-2" />
          Este Mês
        </Button>
        <Button
          variant={activeFilter === 'year' ? 'default' : 'outline'}
          size="sm"
          onClick={() => applyFilter('year')}
        >
          <CalendarRange className="w-4 h-4 mr-2" />
          Este Ano
        </Button>
        <Button
          variant={activeFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => applyFilter('all')}
        >
          <Clock className="w-4 h-4 mr-2" />
          Todo Tempo
        </Button>
        <Button
          variant={activeFilter === 'specific-month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => applyFilter('specific-month')}
        >
          <CalendarClock className="w-4 h-4 mr-2" />
          Mês Específico
        </Button>
        <Button
          variant={activeFilter === 'custom' ? 'default' : 'outline'}
          size="sm"
          onClick={() => applyFilter('custom')}
        >
          <CalendarRange className="w-4 h-4 mr-2" />
          Tempo Personalizado
        </Button>
      </div>

      {/* Seleção de mês específico */}
      {showSpecificMonth && (
        <div className="pt-2">
          <div className="space-y-2">
            <Label htmlFor="month-year-select">Selecione o Mês e Ano</Label>
            <Input
              id="month-year-select"
              type="month"
              value={`${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`}
              onChange={(e) => {
                const [year, month] = e.target.value.split('-');
                applySpecificMonth(parseInt(month) - 1, parseInt(year));
              }}
              className="max-w-xs"
            />
          </div>
        </div>
      )}

      {/* Seleção de período personalizado */}
      {showCustom && (
        <div className="pt-2">
          <Label className="mb-2 block">Selecione o Período</Label>
          <div className="flex items-center gap-3 max-w-md">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="flex-1"
            />
            <span className="text-muted-foreground">até</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
      )}
    </div>
  );
}
