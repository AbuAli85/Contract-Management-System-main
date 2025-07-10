-- Migration: Enhance parties table with additional fields
-- Run this in Supabase SQL editor

-- Add new columns to parties table
ALTER TABLE public.parties 
ADD COLUMN IF NOT EXISTS role TEXT,
ADD COLUMN IF NOT EXISTS cr_expiry_date DATE,
ADD COLUMN IF NOT EXISTS contact_person TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS address_en TEXT,
ADD COLUMN IF NOT EXISTS address_ar TEXT,
ADD COLUMN IF NOT EXISTS tax_number TEXT,
ADD COLUMN IF NOT EXISTS license_number TEXT,
ADD COLUMN IF NOT EXISTS license_expiry_date DATE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended')),
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Update type column to use enum values
ALTER TABLE public.parties 
ALTER COLUMN type TYPE TEXT CHECK (type IN ('Employer', 'Client', 'Both'));

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_parties_status ON public.parties(status);
CREATE INDEX IF NOT EXISTS idx_parties_type ON public.parties(type);
CREATE INDEX IF NOT EXISTS idx_parties_cr_expiry ON public.parties(cr_expiry_date);
CREATE INDEX IF NOT EXISTS idx_parties_license_expiry ON public.parties(license_expiry_date);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_parties_updated_at ON public.parties;
CREATE TRIGGER update_parties_updated_at
    BEFORE UPDATE ON public.parties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update RLS policies to include new fields
DROP POLICY IF EXISTS "Allow read access to all authenticated users on parties" ON public.parties;
CREATE POLICY "Allow read access to all authenticated users on parties"
ON public.parties
FOR SELECT
USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert parties
DROP POLICY IF EXISTS "Allow authenticated users to insert parties" ON public.parties;
CREATE POLICY "Allow authenticated users to insert parties"
ON public.parties
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update parties
DROP POLICY IF EXISTS "Allow authenticated users to update parties" ON public.parties;
CREATE POLICY "Allow authenticated users to update parties"
ON public.parties
FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to delete parties
DROP POLICY IF EXISTS "Allow authenticated users to delete parties" ON public.parties;
CREATE POLICY "Allow authenticated users to delete parties"
ON public.parties
FOR DELETE
USING (auth.role() = 'authenticated'); 