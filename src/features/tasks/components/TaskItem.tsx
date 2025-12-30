'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Save, X, Calendar } from 'lucide-react';

interface TaskItemProps {
  task: any;
  workspaceId: string;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdateTask: (updates: any) => void;
  onDeleteTask: (taskId: string) => void;
}

export function TaskItem({
  task,
  workspaceId,
  isEditing,
  onEdit,
  onCancelEdit,
  onUpdateTask,
  onDeleteTask,
}: TaskItemProps) {
  const [title, setTitle] = useState(task.title);
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(task.due_date || '');

  const handleSave = () => {
    onUpdateTask({ title, status, priority, dueDate: dueDate || undefined });
  };

  const handleToggleStatus = () => {
    const nextStatus = task.status === 'done' ? 'todo' : task.status === 'todo' ? 'doing' : 'done';
    onUpdateTask({ status: nextStatus });
  };

  const priorityColors = {
    1: 'text-red-600',
    2: 'text-orange-600',
    3: 'text-yellow-600',
    4: 'text-blue-600',
    5: 'text-gray-600',
  };

  const statusColors = {
    todo: 'bg-slate-100 dark:bg-slate-800',
    doing: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
    done: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
  };

  if (isEditing) {
    return (
      <div className="border rounded-lg p-4 space-y-3 bg-white dark:bg-slate-900">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título da task" />

        <div className="grid grid-cols-3 gap-3">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">A Fazer</SelectItem>
              <SelectItem value="doing">Fazendo</SelectItem>
              <SelectItem value="done">Feito</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priority.toString()} onValueChange={(v) => setPriority(parseInt(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">P1 - Urgente</SelectItem>
              <SelectItem value="2">P2 - Alta</SelectItem>
              <SelectItem value="3">P3 - Média</SelectItem>
              <SelectItem value="4">P4 - Baixa</SelectItem>
              <SelectItem value="5">P5 - Muito Baixa</SelectItem>
            </SelectContent>
          </Select>

          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancelEdit}>
            <X className="w-4 h-4 mr-1" />
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="w-4 h-4 mr-1" />
            Salvar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`border rounded-lg p-4 transition-colors cursor-pointer ${statusColors[task.status as keyof typeof statusColors]}`}
      onClick={onEdit}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={task.status === 'done'}
              onChange={(e) => {
                e.stopPropagation();
                handleToggleStatus();
              }}
              className="w-4 h-4 cursor-pointer"
            />
            <h4 className={`font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
              {task.title}
            </h4>
            <span className={`text-xs font-semibold ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
              P{task.priority}
            </span>
          </div>

          <div className="flex items-center gap-4 mt-2 ml-7 text-xs text-muted-foreground">
            {task.projects && (
              <span className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">{task.projects.title}</span>
            )}
            {task.pages && <span>📄 {task.pages.title}</span>}
            {task.due_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(task.due_date).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Tem certeza que deseja deletar esta task?')) {
              onDeleteTask(task.id);
            }
          }}
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
}
