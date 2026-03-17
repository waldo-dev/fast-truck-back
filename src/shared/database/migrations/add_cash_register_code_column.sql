ALTER TABLE cash_registers
ADD COLUMN code INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_cash_registers_business_id_code
ON cash_registers (business_id, code DESC);
