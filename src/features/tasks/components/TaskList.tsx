'use client';

import { TaskItem } from './TaskItem';
import { useState } from 'react';

interface TaskListProps {
  tasks: any[];
  workspaceId: string;
  onUpdateTask: (data: any) => void;
  onDeleteTask: (taskId: string) => void;
}

export function TaskList({ tasks, workspaceId, onUpdateTask, onDeleteTask }: TaskListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nenhuma task encontrada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          workspaceId={workspaceId}
          isEditing={editingId === task.id}
          onEdit={() => setEditingId(task.id)}
          onCancelEdit={() => setEditingId(null)}
          onUpdateTask={(updates) => {
            onUpdateTask({ taskId: task.id, workspaceId, ...updates });
            setEditingId(null);
          }}
          onDeleteTask={onDeleteTask}
        />
      ))}
    </div>
  );
}
