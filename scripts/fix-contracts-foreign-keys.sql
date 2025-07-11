-- Fix contracts table foreign key relationships

-- First, check if the foreign key constraints exist
DO $$ 
BEGIN
    -- Add foreign key for promoter_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'contracts_promoter_id_fkey'
    ) THEN
        ALTER TABLE contracts 
        ADD CONSTRAINT contracts_promoter_id_fkey 
        FOREIGN KEY (promoter_id) 
        REFERENCES promoters(id) 
        ON DELETE SET NULL;
    END IF;

    -- Add foreign key for first_party_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'contracts_first_party_id_fkey'
    ) THEN
        ALTER TABLE contracts 
        ADD CONSTRAINT contracts_first_party_id_fkey 
        FOREIGN KEY (first_party_id) 
        REFERENCES parties(id) 
        ON DELETE RESTRICT;
    END IF;

    -- Add foreign key for second_party_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'contracts_second_party_id_fkey'
    ) THEN
        ALTER TABLE contracts 
        ADD CONSTRAINT contracts_second_party_id_fkey 
        FOREIGN KEY (second_party_id) 
        REFERENCES parties(id) 
        ON DELETE RESTRICT;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contracts_promoter_id ON contracts(promoter_id);
CREATE INDEX IF NOT EXISTS idx_contracts_first_party_id ON contracts(first_party_id);
CREATE INDEX IF NOT EXISTS idx_contracts_second_party_id ON contracts(second_party_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_contract_end_date ON contracts(contract_end_date);

-- Enable RLS on contracts table if not already enabled
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for contracts
DROP POLICY IF EXISTS "Enable read access for all users" ON contracts;
CREATE POLICY "Enable read access for all users" ON contracts
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON contracts;
CREATE POLICY "Enable insert for authenticated users only" ON contracts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users only" ON contracts;
CREATE POLICY "Enable update for authenticated users only" ON contracts
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Grant necessary permissions
GRANT SELECT ON contracts TO anon;
GRANT ALL ON contracts TO authenticated;
GRANT ALL ON contracts TO service_role;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';