import { z } from 'zod';

export const createPageSchema = z.object({
  workspaceId: z.string().uuid(),
  title: z.string(),
  parentId: z.string().uuid().optional(),
  content: z.string().optional(),
});

export const createProjectSchema = z.object({
  workspaceId: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(['backlog', 'in_progress', 'done']),
});

export const createTaskSchema = z.object({
  workspaceId: z.string().uuid(),
  title: z.string(),
  status: z.enum(['todo', 'doing', 'done']).default('todo'),
  priority: z.number().min(1).max(5).default(2),
  dueDate: z.string().optional(),
  projectId: z.string().uuid().optional(),
  pageId: z.string().uuid().optional(),
});

export const addFinanceEntrySchema = z.object({
  workspaceId: z.string().uuid(),
  type: z.enum(['income', 'expense']),
  amount: z.number(),
  category: z.string(),
  date: z.string(),
  note: z.string().optional(),
  projectId: z.string().uuid().optional(),
});

export const searchWorkspaceSchema = z.object({
  workspaceId: z.string().uuid(),
  query: z.string(),
  limit: z.number().default(10),
});
