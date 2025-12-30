'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SmartDateFilter } from './SmartDateFilter';

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

  const [filterMode, setFilterMode] = useState<'month' | 'custom'>('month');

  // Calcular mês/ano selecionado a partir do startDate
  const getMonthYearFromStartDate = () => {
    if (!startDate) return `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    // Parse manual para evitar problemas de timezone
    const [year, month, day] = startDate.split('-').map(Number);
    return `${year}-${String(month - 1).padStart(2, '0')}`; // month - 1 porque o índice começa em 0
  };

  const selectedMonth = getMonthYearFromStartDate();

  // Gerar anos (5 anos para trás e 2 para frente)
  const years = Array.from({ length: 8 }, (_, i) => currentYear - 5 + i);

  const handleMonthChange = (monthYear: string) => {
    const [year, month] = monthYear.split('-').map(Number);

    // Primeiro dia do mês
    const firstDay = new Date(year, month, 1);
    const startDateStr = firstDay.toISOString().split('T')[0];

    // Último dia do mês
    const lastDay = new Date(year, month + 1, 0);
    const endDateStr = lastDay.toISOString().split('T')[0];

    onStartDateChange(startDateStr);
    onEndDateChange(endDateStr);
  };

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <h3 className="font-semibold">Filtros da Tabela</h3>

      <div className="space-y-2">
        <Label>Modo de Filtro</Label>
        <Select value={filterMode} onValueChange={(v: any) => setFilterMode(v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Mês Específico</SelectItem>
            <SelectItem value="custom">Período Personalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filterMode === 'month' ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="month-filter">Mês</Label>
            <Select
              value={selectedMonth.split('-')[1]}
              onValueChange={(month) => {
                const year = selectedMonth.split('-')[0];
                handleMonthChange(`${year}-${month}`);
              }}
            >
              <SelectTrigger id="month-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month, index) => (
                  <SelectItem key={index} value={String(index).padStart(2, '0')}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="year-filter">Ano</Label>
            <Select
              value={selectedMonth.split('-')[0]}
              onValueChange={(year) => {
                const month = selectedMonth.split('-')[1];
                handleMonthChange(`${year}-${month}`);
              }}
            >
              <SelectTrigger id="year-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : (
        <SmartDateFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={onStartDateChange}
          onEndDateChange={onEndDateChange}
        />
      )}

      <div className="space-y-2">
        <Label htmlFor="type-filter">Tipo</Label>
        <Select value={type} onValueChange={onTypeChange}>
          <SelectTrigger id="type-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="income">Receitas</SelectItem>
            <SelectItem value="expense">Despesas</SelectItem>
            <SelectItem value="investment">Investimentos</SelectItem>
            <SelectItem value="balance">Saldo</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
