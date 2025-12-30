-- Criar tabela de regras de recorrência
CREATE TABLE IF NOT EXISTS finance_recurring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'investment')),
  category TEXT NOT NULL,
  company TEXT,
  description TEXT,
  note TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE, -- null = sem data final (infinito)
  day_of_month INTEGER, -- 1-31 para mensal (ex: todo dia 5)
  day_of_week INTEGER, -- 0-6 para semanal (0=domingo)
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Adicionar coluna recurring_rule_id na tabela finance_entries
ALTER TABLE finance_entries
ADD COLUMN IF NOT EXISTS recurring_rule_id UUID REFERENCES finance_recurring_rules(id) ON DELETE SET NULL;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_finance_recurring_rules_workspace ON finance_recurring_rules(workspace_id);
CREATE INDEX IF NOT EXISTS idx_finance_recurring_rules_user ON finance_recurring_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_recurring_rules_active ON finance_recurring_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_finance_entries_recurring_rule ON finance_entries(recurring_rule_id);

-- Adicionar RLS policies
ALTER TABLE finance_recurring_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view recurring rules in their workspace"
  ON finance_recurring_rules
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create recurring rules in their workspace"
  ON finance_recurring_rules
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own recurring rules"
  ON finance_recurring_rules
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own recurring rules"
  ON finance_recurring_rules
  FOR DELETE
  USING (user_id = auth.uid());

-- Trigger para atualizar updated_at
CREATE TRIGGER update_finance_recurring_rules_updated_at
  BEFORE UPDATE ON finance_recurring_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE finance_recurring_rules IS 'Regras de recorrência para lançamentos financeiros que geram entradas automaticamente';
COMMENT ON COLUMN finance_recurring_rules.frequency IS 'Frequência: daily (diária), weekly (semanal), monthly (mensal), yearly (anual)';
COMMENT ON COLUMN finance_recurring_rules.day_of_month IS 'Dia do mês (1-31) para recorrências mensais/anuais';
COMMENT ON COLUMN finance_recurring_rules.day_of_week IS 'Dia da semana (0-6, 0=domingo) para recorrências semanais';
COMMENT ON COLUMN finance_recurring_rules.end_date IS 'Data final da recorrência. NULL = sem data final (infinito)';
COMMENT ON COLUMN finance_entries.recurring_rule_id IS 'ID da regra de recorrência que gerou esta entrada (se aplicável)';
