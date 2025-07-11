# Authentication Troubleshooting Guide

## Error: "Invalid login credentials"

This error typically occurs when:

1. The user doesn't exist
2. The password is incorrect
3. The email hasn't been verified
4. The account is locked
5. There's a configuration issue

## Quick Fix Steps

### 1. First, check your environment setup:

```bash
npm run debug-auth
```

This will:

- Check if environment variables are set
- Test Supabase connection
- Show auth configuration status
- Provide specific troubleshooting tips

### 2. Create test users:

```bash
npm run create-test-user
```

This creates two test accounts:

- **Admin**: `admin@example.com` / `Admin123!`
- **User**: `user@example.com` / `User123!`

### 3. Check Supabase Dashboard Settings

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **Authentication** → **Providers**
3. Ensure **Email** provider is enabled
4. Check **Email Templates** settings:
   - For development, consider disabling "Enable email confirmations"
   - This allows immediate login after signup

### 4. Common Issues and Solutions

#### Issue: Email confirmation is required

**Solution**:

- Option 1: Disable email confirmations in Supabase Dashboard
- Option 2: Check your email (including spam) for verification link
- Option 3: Use the admin API to create pre-verified users (see create-test-user.js)

#### Issue: Password doesn't meet requirements

**Solution**:
The password must:

- Be at least 6 characters long
- Contain at least one uppercase letter
- Contain at least one lowercase letter
- Contain at least one number

Example valid password: `Test123!`

#### Issue: User doesn't exist

**Solution**:

1. Sign up first before trying to sign in
2. Or use `npm run create-test-user` to create test accounts

#### Issue: Database tables missing

**Solution**:
Run the migrations in Supabase SQL Editor:

1. Go to SQL Editor in Supabase Dashboard
2. Run the migration files in order:
   - `scripts/migrations/001_auth_system.sql`
   - `scripts/migrations/002_auth_enhancements.sql`
   - `scripts/migrations/003_auth_rls_policies.sql`

### 5. Manual User Creation (Supabase Dashboard)

1. Go to **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Enter email and password
4. Check "Auto Confirm Email" for immediate access
5. Click **Create user**

### 6. Check Browser Console

Open browser DevTools (F12) and check:

- Network tab for failed requests
- Console for JavaScript errors
- Look for specific error messages from Supabase

### 7. Test with cURL

Test the auth endpoint directly:

```bash
curl -X POST https://YOUR_PROJECT_ID.supabase.co/auth/v1/token?grant_type=password \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "User123!"
  }'
```

### 8. Reset Everything

If nothing works, try a clean slate:

1. Delete all users in Supabase Dashboard
2. Re-run the database migrations
3. Create fresh test users
4. Clear browser cache and cookies
5. Try in an incognito/private window

### 9. Enable Detailed Logging

Add this to your auth form to see exactly what's being sent:

```typescript
console.log("Auth attempt:", {
  email: data.email.trim(),
  passwordLength: data.password.length,
  mode: isSignUp ? "signup" : "signin",
})
```

### 10. Check RLS Policies

Ensure Row Level Security isn't blocking access:

```sql
-- Temporarily disable RLS for testing (NOT for production!)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Or create a permissive policy
CREATE POLICY "Enable all access for authenticated users" ON profiles
  FOR ALL USING (true);
```

## Still Having Issues?

1. Check Supabase service status: https://status.supabase.com/
2. Review Supabase logs in Dashboard → Logs → Auth
3. Ensure your Supabase project isn't paused (free tier)
4. Verify API keys haven't been regenerated

## Contact Support

If you've tried everything above:

1. Note the exact error message
2. Check browser console for detailed errors
3. Save the output of `npm run debug-auth`
4. Contact Supabase support with these details
