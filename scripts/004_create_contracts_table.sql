-- Create the new 'contracts' table for job assignments

CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE NOT NULL,
    employer_id UUID REFERENCES parties(id) ON DELETE SET NULL, -- Party acting as Employer
    client_id UUID REFERENCES parties(id) ON DELETE SET NULL,   -- Party acting as Client
    contract_valid_until DATE,
    job_title TEXT,
    work_location TEXT,
    notify_days_before_contract_expiry INTEGER DEFAULT 30,
    is_current BOOLEAN DEFAULT TRUE, -- To identify the primary/current contract for a promoter
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_contracts_promoter_id ON contracts(promoter_id);
CREATE INDEX IF NOT EXISTS idx_contracts_employer_id ON contracts(employer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_is_current ON contracts(promoter_id, is_current DESC); -- For finding current contract

-- Trigger to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_contracts_updated_at ON contracts; -- Drop if exists
CREATE TRIGGER set_contracts_updated_at
BEFORE UPDATE ON contracts
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

COMMENT ON TABLE contracts IS 'Stores job assignments and contract details for promoters.';
COMMENT ON COLUMN contracts.promoter_id IS 'Foreign key to the promoter involved in this contract.';
COMMENT ON COLUMN contracts.employer_id IS 'Foreign key to the party acting as the employer for this contract.';
COMMENT ON COLUMN contracts.client_id IS 'Foreign key to the party this promoter is outsourced to (the client).';
COMMENT ON COLUMN contracts.contract_valid_until IS 'Date until which this specific contract assignment is valid.';
COMMENT ON COLUMN contracts.job_title IS 'Job title for this specific contract assignment.';
COMMENT ON COLUMN contracts.work_location IS 'Work location for this specific contract assignment.';
COMMENT ON COLUMN contracts.notify_days_before_contract_expiry IS 'Number of days before this contract expires to send a notification. Default 30.';
COMMENT ON COLUMN contracts.is_current IS 'Indicates if this is the primary/current contract for the promoter. Default true.';
