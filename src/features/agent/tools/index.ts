import { tool } from 'ai';
import {
  createPageSchema,
  createProjectSchema,
  createTaskSchema,
  addFinanceEntrySchema,
  searchWorkspaceSchema,
} from '../schemas/tool-schemas';
import { createPage } from '@/features/pages/actions/create-page';
import { createServerClient } from '@/lib/supabase/server';
import { searchSimilar } from '@/features/embeddings/lib/vector-search';
import type { Database } from '@/types/database.types';

export const agentTools = {
  create_page: tool({
    description: 'Cria uma nova página no workspace',
    parameters: createPageSchema,
    execute: async ({ workspaceId, title, parentId, content }) => {
      const page = await createPage({ workspaceId, title, parentId });
      return { success: true, pageId: page.id, message: `Página "${title}" criada com sucesso` };
    },
  }),

  create_project: tool({
    description: 'Cria um novo projeto',
    parameters: createProjectSchema,
    execute: async ({ workspaceId, title, description, status }) => {
      const supabase = await createServerClient();

      type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
      const projectData: ProjectInsert = {
        workspace_id: workspaceId,
        title,
        description,
        status
      };

      type Project = Database['public']['Tables']['projects']['Row'];

      const { data, error } = await supabase
        .from('projects')
        .insert(projectData as any)
        .select()
        .single<Project>();

      if (error) throw error;
      return { success: true, projectId: data.id, message: `Projeto "${title}" criado` };
    },
  }),

  create_task: tool({
    description: 'Cria uma nova tarefa',
    parameters: createTaskSchema,
    execute: async ({ workspaceId, title, status, priority, dueDate, projectId, pageId }) => {
      const supabase = await createServerClient();

      type Task = Database['public']['Tables']['tasks']['Row'];

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          workspace_id: workspaceId,
          title,
          status,
          priority,
          due_date: dueDate,
          project_id: projectId,
          page_id: pageId,
        } as any)
        .select()
        .single<Task>();

      if (error) throw error;
      return { success: true, taskId: data.id, message: `Tarefa "${title}" criada` };
    },
  }),

  add_finance_entry: tool({
    description: 'Adiciona um lançamento financeiro',
    parameters: addFinanceEntrySchema,
    execute: async ({ workspaceId, type, amount, category, date, note, projectId }) => {
      const supabase = await createServerClient();

      type FinanceEntry = Database['public']['Tables']['finance_entries']['Row'];

      const { data, error } = await supabase
        .from('finance_entries')
        .insert({
          workspace_id: workspaceId,
          type,
          amount,
          category,
          date,
          note,
          project_id: projectId,
        } as any)
        .select()
        .single<FinanceEntry>();

      if (error) throw error;
      return { success: true, entryId: data.id, message: `Lançamento de ${type} adicionado` };
    },
  }),

  search_workspace: tool({
    description: 'Busca conteúdo no workspace usando busca semântica',
    parameters: searchWorkspaceSchema,
    execute: async ({ workspaceId, query, limit }) => {
      const results = await searchSimilar(workspaceId, query, limit);
      return {
        success: true,
        results,
        message: `Encontrados ${results.length} resultados para "${query}"`,
      };
    },
  }),
};
