-- Personal OS - Row Level Security (RLS) Policies
-- This migration enables RLS and creates security policies for all tables

-- =====================================================
-- HABILITAR RLS EM TODAS AS TABELAS
-- =====================================================

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função helper para verificar acesso ao workspace
CREATE OR REPLACE FUNCTION user_has_workspace_access(workspace_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM workspaces
        WHERE id = workspace_uuid
        AND owner_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- POLICIES PARA WORKSPACES
-- =====================================================

CREATE POLICY "Users can view their own workspaces"
    ON workspaces FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own workspaces"
    ON workspaces FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own workspaces"
    ON workspaces FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own workspaces"
    ON workspaces FOR DELETE
    USING (auth.uid() = owner_id);

-- =====================================================
-- POLICIES PARA PAGES
-- =====================================================

CREATE POLICY "Users can view pages in their workspaces"
    ON pages FOR SELECT
    USING (user_has_workspace_access(workspace_id));

CREATE POLICY "Users can insert pages in their workspaces"
    ON pages FOR INSERT
    WITH CHECK (user_has_workspace_access(workspace_id));

CREATE POLICY "Users can update pages in their workspaces"
    ON pages FOR UPDATE
    USING (user_has_workspace_access(workspace_id));

CREATE POLICY "Users can delete pages in their workspaces"
    ON pages FOR DELETE
    USING (user_has_workspace_access(workspace_id));

-- =====================================================
-- POLICIES PARA PROJECTS
-- =====================================================

CREATE POLICY "Users can view projects in their workspaces"
    ON projects FOR SELECT
    USING (user_has_workspace_access(workspace_id));

CREATE POLICY "Users can insert projects in their workspaces"
    ON projects FOR INSERT
    WITH CHECK (user_has_workspace_access(workspace_id));

CREATE POLICY "Users can update projects in their workspaces"
    ON projects FOR UPDATE
    USING (user_has_workspace_access(workspace_id));

CREATE POLICY "Users can delete projects in their workspaces"
    ON projects FOR DELETE
    USING (user_has_workspace_access(workspace_id));

-- =====================================================
-- POLICIES PARA PROJECT_PAGES
-- =====================================================

CREATE POLICY "Users can view project_pages in their workspaces"
    ON project_pages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE id = project_id
            AND user_has_workspace_access(workspace_id)
        )
    );

CREATE POLICY "Users can insert project_pages in their workspaces"
    ON project_pages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE id = project_id
            AND user_has_workspace_access(workspace_id)
        )
    );

CREATE POLICY "Users can delete project_pages in their workspaces"
    ON project_pages FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE id = project_id
            AND user_has_workspace_access(workspace_id)
        )
    );

-- =====================================================
-- POLICIES PARA TASKS
-- =====================================================

CREATE POLICY "Users can view tasks in their workspaces"
    ON tasks FOR SELECT
    USING (user_has_workspace_access(workspace_id));

CREATE POLICY "Users can insert tasks in their workspaces"
    ON tasks FOR INSERT
    WITH CHECK (user_has_workspace_access(workspace_id));

CREATE POLICY "Users can update tasks in their workspaces"
    ON tasks FOR UPDATE
    USING (user_has_workspace_access(workspace_id));

CREATE POLICY "Users can delete tasks in their workspaces"
    ON tasks FOR DELETE
    USING (user_has_workspace_access(workspace_id));

-- =====================================================
-- POLICIES PARA FINANCE_ENTRIES
-- =====================================================

CREATE POLICY "Users can view finance_entries in their workspaces"
    ON finance_entries FOR SELECT
    USING (user_has_workspace_access(workspace_id));

CREATE POLICY "Users can insert finance_entries in their workspaces"
    ON finance_entries FOR INSERT
    WITH CHECK (user_has_workspace_access(workspace_id));

CREATE POLICY "Users can update finance_entries in their workspaces"
    ON finance_entries FOR UPDATE
    USING (user_has_workspace_access(workspace_id));

CREATE POLICY "Users can delete finance_entries in their workspaces"
    ON finance_entries FOR DELETE
    USING (user_has_workspace_access(workspace_id));

-- =====================================================
-- POLICIES PARA EMBEDDINGS
-- =====================================================

CREATE POLICY "Users can view embeddings in their workspaces"
    ON embeddings FOR SELECT
    USING (user_has_workspace_access(workspace_id));

CREATE POLICY "Users can insert embeddings in their workspaces"
    ON embeddings FOR INSERT
    WITH CHECK (user_has_workspace_access(workspace_id));

CREATE POLICY "Users can update embeddings in their workspaces"
    ON embeddings FOR UPDATE
    USING (user_has_workspace_access(workspace_id));

CREATE POLICY "Users can delete embeddings in their workspaces"
    ON embeddings FOR DELETE
    USING (user_has_workspace_access(workspace_id));

-- =====================================================
-- POLICIES PARA DASHBOARD_WIDGETS
-- =====================================================

CREATE POLICY "Users can view dashboard_widgets in their workspaces"
    ON dashboard_widgets FOR SELECT
    USING (user_has_workspace_access(workspace_id));

CREATE POLICY "Users can insert dashboard_widgets in their workspaces"
    ON dashboard_widgets FOR INSERT
    WITH CHECK (user_has_workspace_access(workspace_id));

CREATE POLICY "Users can update dashboard_widgets in their workspaces"
    ON dashboard_widgets FOR UPDATE
    USING (user_has_workspace_access(workspace_id));

CREATE POLICY "Users can delete dashboard_widgets in their workspaces"
    ON dashboard_widgets FOR DELETE
    USING (user_has_workspace_access(workspace_id));

-- =====================================================
-- POLICIES PARA IMPORT_JOBS
-- =====================================================

CREATE POLICY "Users can view import_jobs in their workspaces"
    ON import_jobs FOR SELECT
    USING (user_has_workspace_access(workspace_id));

CREATE POLICY "Users can insert import_jobs in their workspaces"
    ON import_jobs FOR INSERT
    WITH CHECK (user_has_workspace_access(workspace_id));

CREATE POLICY "Users can update import_jobs in their workspaces"
    ON import_jobs FOR UPDATE
    USING (user_has_workspace_access(workspace_id));

CREATE POLICY "Users can delete import_jobs in their workspaces"
    ON import_jobs FOR DELETE
    USING (user_has_workspace_access(workspace_id));
