'use client';

import { use, useState } from 'react';
import { useTasks } from '@/features/tasks/hooks/useTasks';
import { TaskList } from '@/features/tasks/components/TaskList';
import { TaskFilters } from '@/features/tasks/components/TaskFilters';
import { CreateTaskDialog } from '@/features/tasks/components/CreateTaskDialog';

export default function TasksPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = use(params);
  const [statusFilter, setStatusFilter] = useState('all');

  const { tasks, isLoading, createTask, updateTask, deleteTask } = useTasks({
    workspaceId,
    status: statusFilter === 'all' ? undefined : (statusFilter as any),
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">Carregando tasks...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b p-3 md:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-xl md:text-2xl font-bold">Tasks</h1>
        <CreateTaskDialog workspaceId={workspaceId} onCreateTask={createTask} />
      </div>

      <div className="p-4 md:p-6">
        <div className="mb-6">
          <TaskFilters status={statusFilter} onStatusChange={setStatusFilter} />
        </div>

        <TaskList
          tasks={tasks}
          workspaceId={workspaceId}
          onUpdateTask={updateTask}
          onDeleteTask={(taskId) => deleteTask({ taskId, workspaceId })}
        />
      </div>
    </div>
  );
}
