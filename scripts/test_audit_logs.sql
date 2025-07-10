-- Test data for audit_logs table
-- This script can be used to insert some sample audit log entries for testing

-- Insert some sample audit log entries
INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details) VALUES
(null, 'system_startup', 'system', null, 'Application started successfully'),
(null, 'contract_created', 'contract', 1001, '{"contract_name": "Sample Contract", "status": "draft"}'),
(null, 'user_login', 'user', null, '{"login_method": "email", "success": true}'),
(null, 'contract_updated', 'contract', 1001, '{"field_changed": "status", "old_value": "draft", "new_value": "active"}'),
(null, 'contract_deleted', 'contract', 1002, '{"reason": "duplicate", "deleted_by": "admin"}'),
(null, 'party_created', 'party', 501, '{"party_name": "Test Company", "type": "organization"}'),
(null, 'promoter_created', 'promoter', 301, '{"promoter_name": "John Doe", "status": "active"}');

-- Query to verify the data
SELECT 
  id,
  user_id,
  action,
  entity_type,
  entity_id,
  details,
  created_at
FROM public.audit_logs 
ORDER BY created_at DESC;
