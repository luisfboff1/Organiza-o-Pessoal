'use client';

import { use } from 'react';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { ProjectKanban } from '@/features/projects/components/ProjectKanban';
import { CreateProjectDialog } from '@/features/projects/components/CreateProjectDialog';

export default function ProjectsPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = use(params);
  const { projects, isLoading, createProject, moveProject } = useProjects(workspaceId);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">Carregando projetos...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b p-3 md:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-xl md:text-2xl font-bold">Projetos</h1>
        <CreateProjectDialog workspaceId={workspaceId} onCreateProject={createProject} />
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        <ProjectKanban
          workspaceId={workspaceId}
          projects={projects}
          onMoveProject={(projectId, status) => moveProject({ projectId, workspaceId, status })}
        />
      </div>
    </div>
  );
}
