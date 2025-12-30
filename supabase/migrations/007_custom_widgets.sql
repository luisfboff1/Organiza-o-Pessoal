-- Create custom widgets table for finance
CREATE TABLE IF NOT EXISTS finance_custom_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  widget_type TEXT NOT NULL CHECK (widget_type IN ('summary', 'chart')),
  title TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  width INTEGER DEFAULT 1,
  height INTEGER DEFAULT 1,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE finance_custom_widgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view custom widgets in their workspace"
  ON finance_custom_widgets
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create custom widgets in their workspace"
  ON finance_custom_widgets
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own custom widgets"
  ON finance_custom_widgets
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own custom widgets"
  ON finance_custom_widgets
  FOR DELETE
  USING (user_id = auth.uid());

-- Add index for faster queries
CREATE INDEX idx_finance_custom_widgets_workspace ON finance_custom_widgets(workspace_id);
CREATE INDEX idx_finance_custom_widgets_user ON finance_custom_widgets(user_id);

-- Add trigger to update updated_at
CREATE TRIGGER update_finance_custom_widgets_updated_at
  BEFORE UPDATE ON finance_custom_widgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
