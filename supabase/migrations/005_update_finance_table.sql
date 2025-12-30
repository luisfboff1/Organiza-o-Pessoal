-- Adicionar colunas faltantes na tabela finance_entries
ALTER TABLE finance_entries
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('paid', 'pending')),
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS running_balance NUMERIC(12,2);

-- Modificar a constraint do tipo para incluir 'investment' e 'balance'
ALTER TABLE finance_entries
DROP CONSTRAINT IF EXISTS finance_entries_type_check;

ALTER TABLE finance_entries
ADD CONSTRAINT finance_entries_type_check
CHECK (type IN ('income', 'expense', 'investment', 'balance'));

-- Criar índice para performance nas consultas por data
CREATE INDEX IF NOT EXISTS idx_finance_entries_date ON finance_entries(date DESC);
CREATE INDEX IF NOT EXISTS idx_finance_entries_workspace_date ON finance_entries(workspace_id, date DESC);

-- Função para calcular saldo acumulado automaticamente
CREATE OR REPLACE FUNCTION calculate_running_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular o saldo acumulado baseado nas entradas anteriores
    WITH ordered_entries AS (
        SELECT
            id,
            CASE
                WHEN type = 'income' OR type = 'balance' THEN amount
                WHEN type = 'expense' OR type = 'investment' THEN -amount
                ELSE 0
            END as signed_amount
        FROM finance_entries
        WHERE workspace_id = NEW.workspace_id
        AND date <= NEW.date
        ORDER BY date ASC, created_at ASC
    )
    SELECT COALESCE(SUM(signed_amount), 0)
    INTO NEW.running_balance
    FROM ordered_entries;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar o saldo acumulado
DROP TRIGGER IF EXISTS trigger_calculate_running_balance ON finance_entries;
CREATE TRIGGER trigger_calculate_running_balance
    BEFORE INSERT OR UPDATE ON finance_entries
    FOR EACH ROW
    EXECUTE FUNCTION calculate_running_balance();

-- Função para recalcular todos os saldos após uma atualização
CREATE OR REPLACE FUNCTION recalculate_all_balances(workspace_uuid UUID)
RETURNS void AS $$
BEGIN
    WITH ordered_entries AS (
        SELECT
            id,
            date,
            created_at,
            CASE
                WHEN type = 'income' OR type = 'balance' THEN amount
                WHEN type = 'expense' OR type = 'investment' THEN -amount
                ELSE 0
            END as signed_amount
        FROM finance_entries
        WHERE workspace_id = workspace_uuid
        ORDER BY date ASC, created_at ASC
    ),
    cumulative AS (
        SELECT
            id,
            SUM(signed_amount) OVER (ORDER BY date ASC, created_at ASC) as balance
        FROM ordered_entries
    )
    UPDATE finance_entries fe
    SET running_balance = c.balance
    FROM cumulative c
    WHERE fe.id = c.id;
END;
$$ LANGUAGE plpgsql;
