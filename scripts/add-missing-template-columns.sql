-- Add missing columns to contract_templates table to match the expected structure

-- Add description column
ALTER TABLE contract_templates 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add category column
ALTER TABLE contract_templates 
ADD COLUMN IF NOT EXISTS category VARCHAR(50);

-- Add fields column (array of required fields)
ALTER TABLE contract_templates 
ADD COLUMN IF NOT EXISTS fields JSONB DEFAULT '[]';

-- Add make_scenario_id for Make.com integration
ALTER TABLE contract_templates 
ADD COLUMN IF NOT EXISTS make_scenario_id VARCHAR(255);

-- Add document_url for template document
ALTER TABLE contract_templates 
ADD COLUMN IF NOT EXISTS document_url TEXT;

-- Add metadata for additional settings
ALTER TABLE contract_templates 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add updated_at timestamp
ALTER TABLE contract_templates 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing templates with default values
UPDATE contract_templates 
SET 
    description = COALESCE(description, 'Contract template for ' || name),
    category = COALESCE(category, 'general'),
    fields = COALESCE(fields, '["first_party_id", "second_party_id", "contract_start_date", "contract_end_date"]'::jsonb),
    metadata = COALESCE(metadata, '{}'::jsonb)
WHERE description IS NULL OR category IS NULL OR fields IS NULL;

-- Insert default templates if they don't exist
INSERT INTO contract_templates (id, name, description, category, fields, metadata, doc_template_id) 
VALUES
    (
        gen_random_uuid(),
        'Standard Employment Contract',
        'Full-time employment agreement with standard terms',
        'employment',
        '["first_party_id", "second_party_id", "promoter_id", "contract_start_date", "contract_end_date", "contract_value", "job_title", "work_location"]'::jsonb,
        '{"probationPeriod": "3 months", "noticePeriod": "30 days", "workingHours": "40 hours/week"}'::jsonb,
        'employment-template-id'
    ),
    (
        gen_random_uuid(),
        'Service Agreement',
        'Professional services contract for consultants and contractors',
        'service',
        '["first_party_id", "second_party_id", "promoter_id", "contract_start_date", "contract_end_date", "contract_value", "job_title", "work_location", "deliverables", "payment_terms"]'::jsonb,
        '{}'::jsonb,
        'service-template-id'
    ),
    (
        gen_random_uuid(),
        'Partnership Agreement',
        'Business partnership with profit sharing arrangements',
        'partnership',
        '["first_party_id", "second_party_id", "contract_start_date", "contract_end_date", "profit_share_percentage", "capital_contribution", "responsibilities"]'::jsonb,
        '{}'::jsonb,
        'partnership-template-id'
    ),
    (
        gen_random_uuid(),
        'Freelance Contract',
        'Project-based work agreement for freelancers',
        'freelance',
        '["first_party_id", "second_party_id", "promoter_id", "contract_start_date", "contract_end_date", "contract_value", "job_title", "project_scope", "hourly_rate", "max_hours"]'::jsonb,
        '{}'::jsonb,
        'freelance-template-id'
    )
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    fields = EXCLUDED.fields,
    metadata = EXCLUDED.metadata;

-- Create a unique constraint on name to prevent duplicates
ALTER TABLE contract_templates 
ADD CONSTRAINT IF NOT EXISTS contract_templates_name_unique UNIQUE (name);

-- Verify the updated structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'contract_templates'
ORDER BY ordinal_position;
