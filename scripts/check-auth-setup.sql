-- Check Auth Setup Script
-- Run this in Supabase SQL Editor to diagnose auth issues

-- 1. Check if profiles table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
) as profiles_table_exists;

-- 2. Check profiles table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Check if trigger exists for new user creation
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table = 'users';

-- 4. Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'auth_logs', 'mfa_settings');

-- 5. Check existing RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'profiles';

-- 6. Count users in auth.users
SELECT COUNT(*) as total_users FROM auth.users;

-- 7. Count profiles
SELECT COUNT(*) as total_profiles FROM profiles;

-- 8. Check for users without profiles
SELECT 
    u.id,
    u.email,
    u.created_at,
    p.id as profile_id
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 9. Check auth configuration
SELECT 
    key,
    value
FROM auth.config
WHERE key IN ('email_confirmations', 'sms_provider', 'password_min_length');

-- 10. Quick fix: Create missing profiles for existing users
INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
    'user',
    u.created_at,
    NOW()
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;