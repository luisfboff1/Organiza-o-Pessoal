-- Adicionar coluna de recorrência na tabela finance_entries
ALTER TABLE finance_entries
ADD COLUMN IF NOT EXISTS recurrence TEXT DEFAULT 'none' CHECK (recurrence IN ('none', 'daily', 'weekly', 'monthly', 'yearly'));

-- Adicionar comentários para documentação
COMMENT ON COLUMN finance_entries.recurrence IS 'Frequência de recorrência: none (não recorrente), daily (diária), weekly (semanal), monthly (mensal), yearly (anual)';
