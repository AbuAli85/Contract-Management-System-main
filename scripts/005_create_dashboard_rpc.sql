-- Drop existing view and functions if they exist to ensure clean recreation
DROP VIEW IF EXISTS contracts_view;
DROP FUNCTION IF EXISTS get_contract_status_counts();
DROP FUNCTION IF EXISTS get_monthly_contract_revenue();

-- Function to get contract status counts
CREATE OR REPLACE FUNCTION get_contract_status_counts()
RETURNS TABLE(name TEXT, count BIGINT)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    contracts.status::TEXT AS name,
    COUNT(*) AS count
  FROM contracts
  GROUP BY contracts.status;
END;
$$;

-- Function to get monthly contract and revenue
CREATE OR REPLACE FUNCTION get_monthly_contract_revenue()
RETURNS TABLE(month TEXT, contracts BIGINT, revenue NUMERIC)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_char(contracts.contract_start_date, 'Mon') AS month,
    COUNT(contracts.id) AS contracts,
    SUM(COALESCE(contracts.contract_value, 0)) AS revenue -- Assuming 'contract_value' column exists
  FROM contracts
  WHERE contracts.contract_start_date >= date_trunc('year', CURRENT_DATE) -- Current year example
  GROUP BY to_char(contracts.contract_start_date, 'Mon'), date_part('month', contracts.contract_start_date)
  ORDER BY date_part('month', contracts.contract_start_date);
END;
$$;

-- View for easier contract reporting, ensuring required column names
CREATE OR REPLACE VIEW contracts_view AS
SELECT
  c.id, -- Keep the original table's PK for uniqueness if needed by frontend/keys
  c.contract_id,
  c.contract_start_date AS start_date,
  c.contract_end_date AS end_date,
  c.status,
  p_promoter.name_en AS promoter_name,
  p_promoter.name_ar AS promoter_name_ar,
  p_first.name_en AS employer_name,
  p_first.name_ar AS employer_name_ar,
  p_second.name_en AS client_name,
  p_second.name_ar AS client_name_ar,
  c.user_id, -- Retain user_id if needed for RLS or context
  c.created_at -- Retain created_at for sorting or context
FROM
  contracts c
LEFT JOIN
  promoters p_promoter ON c.promoter_id = p_promoter.id
LEFT JOIN
  parties p_first ON c.first_party_id = p_first.id -- Assuming first_party is employer
LEFT JOIN
  parties p_second ON c.second_party_id = p_second.id; -- Assuming second_party is client

-- Create 'notifications' table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('success', 'error', 'warning', 'info', 'default')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT, -- Denormalized for easier display
  related_contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL, -- Required column
  related_entity_id UUID,
  related_entity_type TEXT
);
-- Ensure RLS is enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
-- Policies for 'notifications'
DROP POLICY IF EXISTS "Enable read access for relevant users" ON notifications;
CREATE POLICY "Enable read access for relevant users" ON notifications
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Allow service role to insert" ON notifications;
CREATE POLICY "Allow service role to insert" ON notifications
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');


-- Create 'audit_logs' table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT, -- Required
  action TEXT NOT NULL, -- Required
  details JSONB, -- Required
  ip_address TEXT, -- Required
  timestamp TIMESTAMPTZ DEFAULT now() NOT NULL -- Required, ensure NOT NULL
);
-- Ensure RLS is enabled
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
-- Policies for 'audit_logs'
DROP POLICY IF EXISTS "Enable read access for service_role" ON audit_logs;
CREATE POLICY "Enable read access for service_role" ON audit_logs
  FOR SELECT
  USING (auth.role() = 'service_role'); -- Or a specific admin role

DROP POLICY IF EXISTS "Allow service role to insert audit logs" ON audit_logs;
CREATE POLICY "Allow service role to insert audit logs" ON audit_logs
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Grant permissions for Supabase Realtime (if not already handled by enabling it on tables via UI)
-- This is often not needed if you enable realtime via the Supabase dashboard,
-- as it sets up the publication automatically.
-- However, explicitly:
-- GRANT SELECT ON TABLE public.contracts_view TO supabase_realtime;
-- GRANT SELECT ON TABLE public.notifications TO supabase_realtime;
-- GRANT SELECT ON TABLE public.audit_logs TO supabase_realtime;
-- GRANT SELECT ON TABLE public.contracts TO supabase_realtime;
-- GRANT SELECT ON TABLE public.promoters TO supabase_realtime;
-- GRANT SELECT ON TABLE public.parties TO supabase_realtime;
