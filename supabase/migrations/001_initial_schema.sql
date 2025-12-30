-- Personal OS - Initial Database Schema
-- This migration creates all tables, indexes, and triggers

-- =====================================================
-- TABELAS
-- =====================================================

-- Tabela: workspaces
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela: pages
CREATE TABLE pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES pages(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    icon TEXT,
    cover_url TEXT,
    content_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    content_text TEXT NOT NULL DEFAULT '',
    source TEXT,
    source_id TEXT,
    archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela: projects
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'backlog' CHECK (status IN ('backlog', 'in_progress', 'done')),
    start_date DATE,
    end_date DATE,
    source TEXT,
    source_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela: project_pages (pivot)
CREATE TABLE project_pages (
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (project_id, page_id)
);

-- Tabela: tasks
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    page_id UUID REFERENCES pages(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'done')),
    priority INTEGER NOT NULL DEFAULT 2,
    due_date DATE,
    source TEXT,
    source_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela: finance_entries
CREATE TABLE finance_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    page_id UUID REFERENCES pages(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    date DATE NOT NULL,
    note TEXT,
    source TEXT,
    source_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela: embeddings (pgvector)
CREATE TABLE embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    finance_entry_id UUID REFERENCES finance_entries(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    embedding vector(1536) NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    source TEXT,
    source_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela: dashboard_widgets
CREATE TABLE dashboard_widgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    widget_type TEXT NOT NULL DEFAULT 'chart',
    chart_type TEXT NOT NULL CHECK (chart_type IN ('bar', 'line', 'area', 'pie', 'donut')),
    data_source TEXT NOT NULL CHECK (data_source IN ('finance', 'tasks', 'projects', 'pages')),
    query_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    layout JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela: import_jobs
CREATE TABLE import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('projects', 'tasks', 'finance', 'pages')),
    mapping JSONB NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('insert', 'upsert')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'failed')),
    stats JSONB NOT NULL DEFAULT '{}'::jsonb,
    error_log JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES
-- =====================================================

-- Índices para workspaces
CREATE INDEX idx_workspaces_owner ON workspaces(owner_id);

-- Índices para pages
CREATE INDEX idx_pages_workspace ON pages(workspace_id);
CREATE INDEX idx_pages_parent ON pages(parent_id);
CREATE INDEX idx_pages_archived ON pages(archived);
-- Full-text search index
CREATE INDEX idx_pages_fts ON pages USING GIN (to_tsvector('english', content_text || ' ' || title));

-- Índices para projects
CREATE INDEX idx_projects_workspace ON projects(workspace_id);
CREATE INDEX idx_projects_status ON projects(status);

-- Índices para tasks
CREATE INDEX idx_tasks_workspace ON tasks(workspace_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Índices para finance_entries
CREATE INDEX idx_finance_workspace ON finance_entries(workspace_id);
CREATE INDEX idx_finance_project ON finance_entries(project_id);
CREATE INDEX idx_finance_type ON finance_entries(type);
CREATE INDEX idx_finance_category ON finance_entries(category);
CREATE INDEX idx_finance_date ON finance_entries(date);

-- Índices para embeddings
CREATE INDEX idx_embeddings_workspace ON embeddings(workspace_id);
CREATE INDEX idx_embeddings_page ON embeddings(page_id);
CREATE INDEX idx_embeddings_project ON embeddings(project_id);
-- Vector similarity search index (HNSW é mais rápido que IVFFlat)
CREATE INDEX idx_embeddings_vector ON embeddings USING hnsw (embedding vector_cosine_ops);

-- Índices para dashboard_widgets
CREATE INDEX idx_dashboard_workspace ON dashboard_widgets(workspace_id);
CREATE INDEX idx_dashboard_project ON dashboard_widgets(project_id);

-- Índices para import_jobs
CREATE INDEX idx_import_workspace ON import_jobs(workspace_id);
CREATE INDEX idx_import_status ON import_jobs(status);

-- =====================================================
-- FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_workspaces_updated_at
    BEFORE UPDATE ON workspaces
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pages_updated_at
    BEFORE UPDATE ON pages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_finance_updated_at
    BEFORE UPDATE ON finance_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_updated_at
    BEFORE UPDATE ON dashboard_widgets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_import_updated_at
    BEFORE UPDATE ON import_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Função para criar workspace padrão ao criar usuário
CREATE OR REPLACE FUNCTION create_default_workspace()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO workspaces (owner_id, name)
    VALUES (NEW.id, 'My Workspace');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar workspace ao criar usuário
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_workspace();
