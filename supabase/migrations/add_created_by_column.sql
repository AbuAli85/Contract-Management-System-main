-- Add created_by column to contracts table if it doesn't exist
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Add deleted_at and deleted_by columns for soft delete functionality
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Add document_generation_started_at for tracking document generation
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS document_generation_started_at TIMESTAMPTZ;

-- Create an index on created_by for better query performance
CREATE INDEX IF NOT EXISTS idx_contracts_created_by ON contracts(created_by);

-- Create an index on deleted_at for filtering out deleted contracts
CREATE INDEX IF NOT EXISTS idx_contracts_deleted_at ON contracts(deleted_at);

-- Update existing contracts to set created_by from user_id if not already set
UPDATE contracts 
SET created_by = user_id 
WHERE created_by IS NULL AND user_id IS NOT NULL;
