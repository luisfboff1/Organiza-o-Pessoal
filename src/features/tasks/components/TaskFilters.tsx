'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface TaskFiltersProps {
  status: string;
  onStatusChange: (status: string) => void;
}

export function TaskFilters({ status, onStatusChange }: TaskFiltersProps) {
  return (
    <div className="flex gap-4 items-end">
      <div className="w-48">
        <Label htmlFor="status-filter">Filtrar por status</Label>
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger id="status-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="todo">A Fazer</SelectItem>
            <SelectItem value="doing">Fazendo</SelectItem>
            <SelectItem value="done">Feito</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
