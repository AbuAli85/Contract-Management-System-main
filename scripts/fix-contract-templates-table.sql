-- Quick fix to add missing columns to contract_templates table

-- Add is_active column if it doesn't exist
ALTER TABLE contract_templates 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update all existing templates to be active
UPDATE contract_templates 
SET is_active = true 
WHERE is_active IS NULL;

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'contract_templates'
ORDER BY ordinal_position;