-- Ensure user_id column exists on contracts table and is linked to auth.users
-- Run this manually if not already done:
-- ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
-- CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON public.contracts(user_id);

-- Enable RLS on the contracts table if not already enabled
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts FORCE ROW LEVEL SECURITY; -- Ensures RLS applies even to table owners

-- Drop existing policies to avoid conflicts before creating new ones
DROP POLICY IF EXISTS "Allow ALL access to contract owner" ON public.contracts;
DROP POLICY IF EXISTS "Allow INSERT for authenticated users" ON public.contracts;
DROP POLICY IF EXISTS "Allow SELECT for contract owner" ON public.contracts;
DROP POLICY IF EXISTS "Allow UPDATE for contract owner" ON public.contracts;
DROP POLICY IF EXISTS "Allow DELETE for contract owner" ON public.contracts;


-- Policy: Users can perform all actions (SELECT, INSERT, UPDATE, DELETE) on their own contracts.
-- The user_id in the contracts table must match the UID of the currently authenticated user.
CREATE POLICY "Allow ALL access to contract owner"
ON public.contracts
FOR ALL -- Covers SELECT, INSERT, UPDATE, DELETE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id); -- Ensures new/updated rows also belong to the user


-- RLS for parties and promoters (example: allow read for all authenticated users, admin for writes)
-- Parties Table
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parties FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access to all authenticated users on parties" ON public.parties;
-- DROP POLICY IF EXISTS "Allow admin full access on parties" ON public.parties; -- Example for admin

CREATE POLICY "Allow read access to all authenticated users on parties"
ON public.parties
FOR SELECT
USING (auth.role() = 'authenticated');

-- Example: Allow users with a specific 'admin' role (custom claim or in auth.users metadata) to manage parties
-- CREATE POLICY "Allow admin full access on parties"
-- ON public.parties
-- FOR ALL
-- USING (get_my_claim('user_role') = '"admin"'::jsonb) -- Requires a function get_my_claim or similar
-- WITH CHECK (get_my_claim('user_role') = '"admin"'::jsonb);


-- Promoters Table
ALTER TABLE public.promoters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promoters FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access to all authenticated users on promoters" ON public.promoters;
-- DROP POLICY IF EXISTS "Allow admin full access on promoters" ON public.promoters; -- Example for admin

CREATE POLICY "Allow read access to all authenticated users on promoters"
ON public.promoters
FOR SELECT
USING (auth.role() = 'authenticated');

-- Example: Allow users with 'admin' role to manage promoters
-- CREATE POLICY "Allow admin full access on promoters"
-- ON public.promoters
-- FOR ALL
-- USING (get_my_claim('user_role') = '"admin"'::jsonb)
-- WITH CHECK (get_my_claim('user_role') = '"admin"'::jsonb);


-- Storage Bucket: 'contracts' (for PDFs)
-- Policies for storage are managed in the Supabase Dashboard under Storage > Policies.
-- Example policy for 'contracts' bucket:
-- Allow authenticated users to INSERT into 'contracts' bucket:
-- Target roles: authenticated
-- Allowed operations: INSERT
-- Policy definition (USING expression): true (or bucket_id = 'contracts')

-- Allow contract owner to SELECT their own PDFs.
-- This is more complex as storage RLS doesn't directly join with tables.
-- Common patterns:
-- 1. Path-based convention: `contract_pdfs/{user_id}/{contract_id}/contract.pdf`
--    Policy: `(bucket_id = 'contracts') AND ((storage.foldername(name))[1] = auth.uid()::text)`
-- 2. Public URLs with Obfuscation: If PDF URLs are in the `contracts` table (which is RLS protected),
--    then access to the URL implies access. The bucket can be public, but URLs hard to guess.
-- 3. Signed URLs: Generate temporary signed URLs in your API for authorized users. Bucket remains private.
-- For this setup, we'll assume pattern #2: PDF URL is stored in the RLS-protected `contracts` table.
-- The `contracts` bucket itself can be configured for public read access in Supabase Dashboard.
-- The API route uses service_role, bypassing storage RLS for uploads.
