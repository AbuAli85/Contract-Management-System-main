-- Check if contract_templates table exists and its structure

-- 1. Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'contract_templates'
) as table_exists;

-- 2. If it exists, show its columns
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'contract_templates'
ORDER BY ordinal_position;

-- 3. Check if we have any templates
SELECT COUNT(*) as template_count FROM contract_templates;

-- 4. Show existing templates
SELECT id, name, category, fields FROM contract_templates;
