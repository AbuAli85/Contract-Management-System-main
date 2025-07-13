-- Cleanup and Simplify Contracts Table RLS Policies
-- WARNING: This will remove ALL existing policies and create a clean, simple set

-- Step 1: Drop ALL existing policies on contracts table
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'contracts' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON contracts', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- Step 2: Create a clean, simple set of policies

-- 1. Allow authenticated users to view all contracts
CREATE POLICY "authenticated_users_select_contracts" ON contracts
    FOR SELECT
    TO authenticated
    USING (true);

-- 2. Allow authenticated users to insert contracts
CREATE POLICY "authenticated_users_insert_contracts" ON contracts
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 3. Allow authenticated users to update contracts
CREATE POLICY "authenticated_users_update_contracts" ON contracts
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 4. Allow authenticated users to delete their own contracts or admins to delete any
CREATE POLICY "authenticated_users_delete_contracts" ON contracts
    FOR DELETE
    TO authenticated
    USING (
        -- User owns the contract
        (created_by = auth.uid()) 
        OR 
        -- User is an admin
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 5. Allow anon users to view contracts (optional - remove if not needed)
CREATE POLICY "anon_users_select_contracts" ON contracts
    FOR SELECT
    TO anon
    USING (true);

-- Step 3: Verify the new policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'contracts'
ORDER BY policyname;

-- Step 4: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON contracts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON contracts TO authenticated;

-- Step 5: Ensure RLS is enabled
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Summary of new policies:
-- 1. authenticated_users_select_contracts - Authenticated users can view all contracts
-- 2. authenticated_users_insert_contracts - Authenticated users can create contracts
-- 3. authenticated_users_update_contracts - Authenticated users can update any contract
-- 4. authenticated_users_delete_contracts - Users can delete their own contracts, admins can delete any
-- 5. anon_users_select_contracts - Anonymous users can view contracts (for public access)

-- Total: 5 simple, clear policies instead of 28 conflicting ones!
