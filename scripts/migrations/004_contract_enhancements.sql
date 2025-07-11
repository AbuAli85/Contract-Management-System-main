-- Contract System Enhancements for Make.com Integration
-- This migration adds fields needed for document generation and webhook tracking

-- 1. Add document generation fields to contracts table
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS template_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS document_url TEXT,
ADD COLUMN IF NOT EXISTS document_generated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS document_generation_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- 2. Create contract history table for audit trail
CREATE TABLE IF NOT EXISTS contract_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- created, updated, deleted, document_generated, etc.
    changes JSONB,
    performed_by UUID REFERENCES auth.users(id),
    performed_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- 3. Create webhook logs table
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source VARCHAR(50) NOT NULL, -- make.com, zapier, etc.
    event_type VARCHAR(100) NOT NULL,
    contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
    status VARCHAR(50),
    payload JSONB,
    response JSONB,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create contract templates table
CREATE TABLE IF NOT EXISTS contract_templates (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    fields JSONB DEFAULT '[]',
    make_scenario_id VARCHAR(255),
    document_url TEXT,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Insert default templates
INSERT INTO contract_templates (id, name, description, category, fields, metadata) VALUES
('standard-employment', 'Standard Employment Contract', 'Full-time employment agreement with standard terms', 'employment', 
 '["first_party_id", "second_party_id", "promoter_id", "contract_start_date", "contract_end_date", "contract_value", "job_title", "work_location"]',
 '{"probationPeriod": "3 months", "noticePeriod": "30 days", "workingHours": "40 hours/week"}'),
 
('service-agreement', 'Service Agreement', 'Professional services contract for consultants and contractors', 'service',
 '["first_party_id", "second_party_id", "promoter_id", "contract_start_date", "contract_end_date", "contract_value", "job_title", "work_location", "deliverables", "payment_terms"]',
 '{}'),
 
('partnership-agreement', 'Partnership Agreement', 'Business partnership with profit sharing arrangements', 'partnership',
 '["first_party_id", "second_party_id", "contract_start_date", "contract_end_date", "profit_share_percentage", "capital_contribution", "responsibilities"]',
 '{}'),
 
('freelance-contract', 'Freelance Contract', 'Project-based work agreement for freelancers', 'freelance',
 '["first_party_id", "second_party_id", "promoter_id", "contract_start_date", "contract_end_date", "contract_value", "job_title", "project_scope", "hourly_rate", "max_hours"]',
 '{}')
ON CONFLICT (id) DO NOTHING;

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contracts_template_id ON contracts(template_id);
CREATE INDEX IF NOT EXISTS idx_contracts_deleted_at ON contracts(deleted_at);
CREATE INDEX IF NOT EXISTS idx_contract_history_contract_id ON contract_history(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_history_performed_at ON contract_history(performed_at);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_contract_id ON webhook_logs(contract_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);

-- 7. Enable RLS on new tables
ALTER TABLE contract_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for contract_history
CREATE POLICY "Users can view history of contracts they can access" ON contract_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM contracts 
            WHERE contracts.id = contract_history.contract_id
            -- This will use whatever policies are on the contracts table
        )
    );

CREATE POLICY "Service role can manage contract history" ON contract_history
    FOR ALL USING (auth.role() = 'service_role');

-- 9. RLS Policies for webhook_logs
CREATE POLICY "Admins can view webhook logs" ON webhook_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Service role can manage webhook logs" ON webhook_logs
    FOR ALL USING (auth.role() = 'service_role');

-- 10. RLS Policies for contract_templates
CREATE POLICY "Everyone can view active templates" ON contract_templates
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage templates" ON contract_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- 11. Create function to update contract status
CREATE OR REPLACE FUNCTION update_contract_status(
    p_contract_id UUID,
    p_status VARCHAR(50),
    p_metadata JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
    UPDATE contracts 
    SET 
        status = p_status,
        updated_at = NOW(),
        metadata = metadata || p_metadata
    WHERE id = p_contract_id;
    
    INSERT INTO contract_history (
        contract_id,
        action,
        changes,
        performed_by,
        metadata
    ) VALUES (
        p_contract_id,
        'status_changed',
        jsonb_build_object('status', p_status),
        auth.uid(),
        p_metadata
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Grant permissions
GRANT SELECT ON contract_templates TO authenticated, anon;
GRANT SELECT ON contract_history TO authenticated;
GRANT SELECT ON webhook_logs TO authenticated;
GRANT EXECUTE ON FUNCTION update_contract_status TO authenticated;