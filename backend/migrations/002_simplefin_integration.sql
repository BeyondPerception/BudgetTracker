-- Add SimpleFin integration fields to accounts table
ALTER TABLE accounts ADD COLUMN simplefin_id TEXT;
ALTER TABLE accounts ADD COLUMN available_balance REAL DEFAULT 0.0;
ALTER TABLE accounts ADD COLUMN is_credit_card BOOLEAN DEFAULT FALSE;

-- Add SimpleFin integration fields to transactions table
ALTER TABLE transactions ADD COLUMN simplefin_id TEXT;
ALTER TABLE transactions ADD COLUMN posted_date DATETIME;
ALTER TABLE transactions ADD COLUMN payee TEXT;
ALTER TABLE transactions ADD COLUMN memo TEXT;
ALTER TABLE transactions ADD COLUMN pending BOOLEAN DEFAULT FALSE;

-- Create unique indexes for SimpleFin IDs (acts as UNIQUE constraint)
CREATE UNIQUE INDEX idx_accounts_simplefin_id_unique ON accounts(simplefin_id) WHERE simplefin_id IS NOT NULL;
CREATE UNIQUE INDEX idx_transactions_simplefin_id_unique ON transactions(simplefin_id) WHERE simplefin_id IS NOT NULL;

-- Create regular indexes for performance
CREATE INDEX idx_accounts_simplefin_id ON accounts(simplefin_id);
CREATE INDEX idx_transactions_simplefin_id ON transactions(simplefin_id);
CREATE INDEX idx_transactions_pending ON transactions(pending);
CREATE INDEX idx_transactions_posted_date ON transactions(posted_date);