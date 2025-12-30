'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from 'lucide-react';

interface SmartDateFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export function SmartDateFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: SmartDateFilterProps) {
  const setQuickFilter = (type: 'month' | 'year' | 'all') => {
    const today = new Date();
    let start: Date;

    switch (type) {
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'year':
        start = new Date(today.getFullYear(), 0, 1);
        break;
      case 'all':
        start = new Date(2020, 0, 1); // Começar de 2020
        break;
    }

    onStartDateChange(start.toISOString().split('T')[0]);
    onEndDateChange(today.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setQuickFilter('month')}>
          <Calendar className="w-4 h-4 mr-2" />
          Este Mês
        </Button>
        <Button variant="outline" size="sm" onClick={() => setQuickFilter('year')}>
          <Calendar className="w-4 h-4 mr-2" />
          Este Ano
        </Button>
        <Button variant="outline" size="sm" onClick={() => setQuickFilter('all')}>
          <Calendar className="w-4 h-4 mr-2" />
          Todo Tempo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data Início</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Data Fim</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
