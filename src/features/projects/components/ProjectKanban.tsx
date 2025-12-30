'use client';

import { DndContext, DragOverlay, closestCorners, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useState } from 'react';
import { ProjectColumn } from './ProjectColumn';
import { ProjectCard } from './ProjectCard';

type ProjectStatus = 'backlog' | 'in_progress' | 'done';

interface ProjectKanbanProps {
  workspaceId: string;
  projects: any[];
  onMoveProject: (projectId: string, status: ProjectStatus) => void;
}

export function ProjectKanban({ workspaceId, projects, onMoveProject }: ProjectKanbanProps) {
  const [activeProject, setActiveProject] = useState<any>(null);

  const columns = [
    { id: 'backlog', title: 'Backlog', status: 'backlog' },
    { id: 'in_progress', title: 'Em Progresso', status: 'in_progress' },
    { id: 'done', title: 'Concluído', status: 'done' },
  ];

  const handleDragStart = (event: DragStartEvent) => {
    const project = projects.find((p) => p.id === event.active.id);
    setActiveProject(project);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveProject(null);
      return;
    }

    const projectId = active.id as string;
    const newStatus = over.id as ProjectStatus;

    const project = projects.find((p) => p.id === projectId);
    if (project && project.status !== newStatus) {
      onMoveProject(projectId, newStatus);
    }

    setActiveProject(null);
  };

  return (
    <DndContext collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 md:gap-6 h-full overflow-x-auto pb-4 touch-pan-x">
        {columns.map((column) => {
          const columnProjects = projects.filter((p) => p.status === column.status);
          return (
            <ProjectColumn
              key={column.id}
              id={column.id}
              title={column.title}
              projects={columnProjects}
              workspaceId={workspaceId}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeProject ? <ProjectCard project={activeProject} workspaceId={workspaceId} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
