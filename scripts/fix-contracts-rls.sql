-- Fix RLS policies for contracts table
-- This ensures authenticated users can read contracts data

-- First, check if RLS is enabled
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON contracts;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON contracts;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON contracts;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON contracts;
DROP POLICY IF EXISTS "Users can view all contracts" ON contracts;
DROP POLICY IF EXISTS "Users can create contracts" ON contracts;
DROP POLICY IF EXISTS "Users can update contracts" ON contracts;

-- Create new policies
-- Allow all authenticated users to read contracts
CREATE POLICY "Authenticated users can view contracts" ON contracts
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Allow authenticated users to create contracts
CREATE POLICY "Authenticated users can create contracts" ON contracts
    FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update their own contracts
CREATE POLICY "Authenticated users can update contracts" ON contracts
    FOR UPDATE 
    USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete their own contracts (admin only)
CREATE POLICY "Admin users can delete contracts" ON contracts
    FOR DELETE 
    USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Grant permissions
GRANT SELECT ON contracts TO authenticated;
GRANT INSERT ON contracts TO authenticated;
GRANT UPDATE ON contracts TO authenticated;
GRANT DELETE ON contracts TO authenticated;

-- Also ensure anon users can at least see the table structure (but not data)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON contracts TO anon;

-- Create a more permissive policy for anon users (optional - remove if not needed)
CREATE POLICY "Anon users can view contracts" ON contracts
    FOR SELECT 
    USING (true);

-- Verify the policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'contracts'
ORDER BY policyname;