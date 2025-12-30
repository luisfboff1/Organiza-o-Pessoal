'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ProjectCard } from './ProjectCard';

interface ProjectColumnProps {
  id: string;
  title: string;
  projects: any[];
  workspaceId: string;
}

export function ProjectColumn({ id, title, projects, workspaceId }: ProjectColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="flex-shrink-0 w-72 md:w-80">
      <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 md:p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">
            {title}
            <span className="ml-2 text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">
              {projects.length}
            </span>
          </h3>
        </div>

        <SortableContext items={projects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <div ref={setNodeRef} className="space-y-3 min-h-[200px]">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} workspaceId={workspaceId} />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
