-- Update contracts table to support Make.com integration
-- Based on the provided blueprint

-- Add columns for document generation
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS document_generated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT true;

-- Add index for contract number lookup (used by Make.com)
CREATE INDEX IF NOT EXISTS idx_contracts_contract_number ON contracts(contract_number);
CREATE INDEX IF NOT EXISTS idx_contracts_is_current ON contracts(is_current);

-- Update existing contracts to have is_current = true
UPDATE contracts SET is_current = true WHERE is_current IS NULL;

-- Create a function to ensure only one current contract per contract_number
CREATE OR REPLACE FUNCTION ensure_single_current_contract()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_current = true THEN
        -- Set all other contracts with same contract_number to not current
        UPDATE contracts 
        SET is_current = false 
        WHERE contract_number = NEW.contract_number 
        AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for the function
DROP TRIGGER IF EXISTS ensure_single_current_contract_trigger ON contracts;
CREATE TRIGGER ensure_single_current_contract_trigger
    BEFORE INSERT OR UPDATE ON contracts
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_current_contract();

-- Add columns to promoters table for document URLs
ALTER TABLE promoters 
ADD COLUMN IF NOT EXISTS id_card_url TEXT,
ADD COLUMN IF NOT EXISTS passport_url TEXT;

-- Grant permissions for service role (used by Make.com)
GRANT ALL ON contracts TO service_role;
GRANT ALL ON promoters TO service_role;
GRANT ALL ON parties TO service_role;
