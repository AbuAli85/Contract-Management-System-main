-- Update the contract with missing field values
UPDATE contracts 
SET 
  job_title = 'Senior Software Engineer',
  department = 'Technology',
  contract_type = 'Full-time',
  contract_start_date = '2025-01-01',
  contract_end_date = '2027-01-01',
  work_location = 'Dubai Office - Technology Center',
  email = 'senior.engineer@alamri.com'
WHERE id = '841caf76-9429-4845-adc9-4475c02778ce';

-- Verify the update
SELECT 
  id,
  job_title,
  department,
  contract_type,
  contract_start_date,
  contract_end_date,
  work_location,
  email,
  first_party_id,
  second_party_id
FROM contracts 
WHERE id = '841caf76-9429-4845-adc9-4475c02778ce';
