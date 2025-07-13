-- Comprehensive Auth Diagnosis Script
-- Run this in Supabase SQL Editor to understand the auth issue

-- 1. Check if the test user exists and their status
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    banned_until
FROM auth.users
WHERE email = 'test@example.com';

-- 2. Check if the user has a profile
SELECT 
    p.*,
    u.email,
    u.email_confirmed_at
FROM profiles p
RIGHT JOIN auth.users u ON p.id = u.id
WHERE u.email = 'test@example.com';

-- 3. Check auth configuration
SELECT 
    key,
    value
FROM auth.config
WHERE key IN (
    'password_min_length',
    'password_required_characters',
    'enable_signup',
    'enable_confirmations',
    'external_email_enabled',
    'mailer_autoconfirm',
    'sms_autoconfirm'
);

-- 4. Check if there are any auth flow states blocking the user
SELECT 
    id,
    user_id,
    auth_code,
    code_challenge_method,
    code_challenge,
    provider_type,
    provider_access_token,
    provider_refresh_token,
    created_at,
    updated_at
FROM auth.flow_state
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com')
ORDER BY created_at DESC
LIMIT 5;

-- 5. Check recent auth audit log entries for this user
SELECT 
    instance_id,
    id,
    payload,
    created_at,
    ip_address
FROM auth.audit_log_entries
WHERE payload->>'actor_email' = 'test@example.com'
   OR payload->>'traits'->>'email' = 'test@example.com'
ORDER BY created_at DESC
LIMIT 10;

-- 6. Check if password hash exists (won't show the actual hash for security)
SELECT 
    id,
    email,
    CASE 
        WHEN encrypted_password IS NOT NULL AND encrypted_password != '' 
        THEN 'Password is set'
        ELSE 'No password set'
    END as password_status,
    CASE
        WHEN email_confirmed_at IS NOT NULL 
        THEN 'Email confirmed'
        ELSE 'Email NOT confirmed'
    END as email_status
FROM auth.users
WHERE email = 'test@example.com';

-- 7. Test if we can manually verify the user (admin only)
-- Uncomment and run if you have admin access
-- UPDATE auth.users 
-- SET email_confirmed_at = NOW()
-- WHERE email = 'test@example.com' AND email_confirmed_at IS NULL;

-- 8. Check for any rate limiting
SELECT 
    COUNT(*) as failed_attempts,
    MAX(created_at) as last_attempt
FROM auth.audit_log_entries
WHERE payload->>'action' = 'login_failed'
  AND payload->>'actor_email' = 'test@example.com'
  AND created_at > NOW() - INTERVAL '1 hour';

-- 9. Summary query - everything about the test user
WITH user_info AS (
    SELECT 
        u.id,
        u.email,
        u.email_confirmed_at,
        u.created_at,
        u.last_sign_in_at,
        u.raw_user_meta_data,
        p.role as profile_role,
        p.full_name,
        p.email_verified_at as profile_email_verified
    FROM auth.users u
    LEFT JOIN profiles p ON u.id = p.id
    WHERE u.email = 'test@example.com'
)
SELECT 
    jsonb_pretty(
        jsonb_build_object(
            'user_exists', CASE WHEN id IS NOT NULL THEN true ELSE false END,
            'user_id', id,
            'email', email,
            'email_confirmed', email_confirmed_at IS NOT NULL,
            'email_confirmed_at', email_confirmed_at,
            'profile_exists', profile_role IS NOT NULL,
            'profile_role', profile_role,
            'last_sign_in', last_sign_in_at,
            'account_age_days', EXTRACT(DAY FROM NOW() - created_at),
            'metadata', raw_user_meta_data
        )
    ) as user_summary
FROM user_info;
