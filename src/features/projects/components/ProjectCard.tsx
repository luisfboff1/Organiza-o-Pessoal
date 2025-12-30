'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import { Calendar, CheckCircle, FileText } from 'lucide-react';

interface ProjectCardProps {
  project: any;
  workspaceId: string;
  isDragging?: boolean;
}

export function ProjectCard({ project, workspaceId, isDragging = false }: ProjectCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } = useSortable({
    id: project.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging || isDragging ? 0.5 : 1,
  };

  const taskProgress = project.taskCount > 0 ? Math.round((project.tasksDone / project.taskCount) * 100) : 0;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Link href={`/${workspaceId}/projects/${project.id}`}>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors cursor-pointer">
          <h4 className="font-medium mb-2">{project.title}</h4>

          {project.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{project.description}</p>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {project.taskCount > 0 && (
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                <span>
                  {project.tasksDone}/{project.taskCount} ({taskProgress}%)
                </span>
              </div>
            )}

            {project.pageCount > 0 && (
              <div className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                <span>{project.pageCount}</span>
              </div>
            )}

            {project.start_date && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{new Date(project.start_date).toLocaleDateString('pt-BR')}</span>
              </div>
            )}
          </div>

          {project.taskCount > 0 && (
            <div className="mt-3">
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${taskProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
