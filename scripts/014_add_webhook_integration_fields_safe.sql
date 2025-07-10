-- Safe migration script for Make.com webhook integration
-- This version can be run multiple times safely

BEGIN;

-- Add missing fields required by Make.com webhook integration
-- This script adds fields that the automation blueprint expects

-- Add contract_number field to contracts table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'contract_number') THEN
    ALTER TABLE contracts ADD COLUMN contract_number TEXT;
  END IF;
END $$;

-- Add contract start and end dates (if not already present)
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS contract_start_date DATE;

ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS contract_end_date DATE;

-- Add contract value field
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS contract_value NUMERIC(12,2);

-- Add status field with specific values (handle existing data)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'status') THEN
    ALTER TABLE contracts ADD COLUMN status TEXT DEFAULT 'draft';
  END IF;
  
  -- Drop existing constraint if it exists and add new one
  ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_status_check;
  ALTER TABLE contracts ADD CONSTRAINT contracts_status_check 
    CHECK (status IN ('draft', 'active', 'pending', 'expired', 'generated', 'soon-to-expire'));
END $$;

-- Add PDF URL field (might already exist)
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Add user_id field for tracking who created the contract
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'contracts_user_id_fkey' 
    AND table_name = 'contracts'
  ) THEN
    ALTER TABLE contracts 
    ADD CONSTRAINT contracts_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add email field for notifications
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Handle employer_id to first_party_id migration safely
DO $$
BEGIN
  -- Check if both employer_id and first_party_id exist
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'employer_id') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'first_party_id') THEN
    -- Both exist - copy data from employer_id to first_party_id if first_party_id is null
    UPDATE contracts SET first_party_id = employer_id WHERE first_party_id IS NULL AND employer_id IS NOT NULL;
    -- Drop the old employer_id column
    ALTER TABLE contracts DROP COLUMN employer_id;
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'employer_id') THEN
    -- Only employer_id exists - rename it
    ALTER TABLE contracts RENAME COLUMN employer_id TO first_party_id;
  END IF;
END $$;

-- Handle client_id to second_party_id migration safely
DO $$
BEGIN
  -- Check if both client_id and second_party_id exist
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'client_id') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'second_party_id') THEN
    -- Both exist - copy data from client_id to second_party_id if second_party_id is null
    UPDATE contracts SET second_party_id = client_id WHERE second_party_id IS NULL AND client_id IS NOT NULL;
    -- Drop the old client_id column
    ALTER TABLE contracts DROP COLUMN client_id;
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'client_id') THEN
    -- Only client_id exists - rename it
    ALTER TABLE contracts RENAME COLUMN client_id TO second_party_id;
  END IF;
END $$;

-- Add first_party_id if it doesn't exist
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS first_party_id UUID;

-- Add foreign key constraint for first_party_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'contracts_first_party_id_fkey' 
    AND table_name = 'contracts'
  ) THEN
    ALTER TABLE contracts 
    ADD CONSTRAINT contracts_first_party_id_fkey 
    FOREIGN KEY (first_party_id) REFERENCES parties(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add second_party_id if it doesn't exist  
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS second_party_id UUID;

-- Add foreign key constraint for second_party_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'contracts_second_party_id_fkey' 
    AND table_name = 'contracts'
  ) THEN
    ALTER TABLE contracts 
    ADD CONSTRAINT contracts_second_party_id_fkey 
    FOREIGN KEY (second_party_id) REFERENCES parties(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add indexes for new fields (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_contracts_contract_number ON contracts(contract_number);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_start_date ON contracts(contract_start_date);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON contracts(contract_end_date);
CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_first_party_id ON contracts(first_party_id);
CREATE INDEX IF NOT EXISTS idx_contracts_second_party_id ON contracts(second_party_id);

-- Add unique constraint for contract_number if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'contracts_contract_number_unique' 
    AND table_name = 'contracts'
  ) THEN
    ALTER TABLE contracts 
    ADD CONSTRAINT contracts_contract_number_unique 
    UNIQUE (contract_number);
  END IF;
END $$;

-- Add comments for new fields
DO $$
BEGIN
  -- Only add comments if column exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'contract_number') THEN
    EXECUTE 'COMMENT ON COLUMN contracts.contract_number IS ''Unique contract identifier for external integrations''';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'contract_start_date') THEN
    EXECUTE 'COMMENT ON COLUMN contracts.contract_start_date IS ''Date when the contract begins''';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'contract_end_date') THEN
    EXECUTE 'COMMENT ON COLUMN contracts.contract_end_date IS ''Date when the contract ends''';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'contract_value') THEN
    EXECUTE 'COMMENT ON COLUMN contracts.contract_value IS ''Total value of the contract''';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'status') THEN
    EXECUTE 'COMMENT ON COLUMN contracts.status IS ''Current status of the contract''';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'pdf_url') THEN
    EXECUTE 'COMMENT ON COLUMN contracts.pdf_url IS ''URL to the generated contract PDF''';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'user_id') THEN
    EXECUTE 'COMMENT ON COLUMN contracts.user_id IS ''User who created this contract''';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'email') THEN
    EXECUTE 'COMMENT ON COLUMN contracts.email IS ''Email for contract notifications''';
  END IF;
END $$;

-- Create a function to generate contract numbers
CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  -- Get the next sequential number
  SELECT COALESCE(MAX(CAST(SUBSTRING(contract_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO counter
  FROM contracts 
  WHERE contract_number SIMILAR TO 'CONTRACT-[0-9]+';
  
  new_number := 'CONTRACT-' || LPAD(counter::TEXT, 6, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to auto-generate contract numbers
CREATE OR REPLACE FUNCTION set_contract_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.contract_number IS NULL OR NEW.contract_number = '' THEN
    NEW.contract_number := generate_contract_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trigger_set_contract_number ON contracts;
CREATE TRIGGER trigger_set_contract_number
  BEFORE INSERT ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION set_contract_number();

-- Update existing contracts to have contract numbers if they don't
WITH numbered_contracts AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM contracts 
  WHERE contract_number IS NULL OR contract_number = ''
)
UPDATE contracts 
SET contract_number = 'CONTRACT-' || LPAD(numbered_contracts.row_num::TEXT, 6, '0')
FROM numbered_contracts
WHERE contracts.id = numbered_contracts.id;

-- Ensure all existing contracts have a valid status
UPDATE contracts 
SET status = 'active' 
WHERE status IS NULL OR status NOT IN ('draft', 'active', 'pending', 'expired', 'generated', 'soon-to-expire');

COMMIT;

-- Display migration results
SELECT 
  'Migration completed successfully!' as message,
  COUNT(*) as total_contracts,
  COUNT(CASE WHEN contract_number IS NOT NULL THEN 1 END) as contracts_with_numbers,
  COUNT(CASE WHEN status IS NOT NULL THEN 1 END) as contracts_with_status
FROM contracts;
