# Authentication System Setup Guide

## Overview
This authentication system provides a complete, production-ready solution with:
- Email/password authentication
- Multi-factor authentication (MFA/2FA)
- Role-based access control (RBAC)
- Session management
- OAuth integration (Google, LinkedIn)
- Admin user management
- Audit logging

## Setup Instructions

### 1. Database Migration

#### Option A: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `supabase/migrations/20240101000000_auth_system.sql`
5. Paste and click **Run**

#### Option B: Using Supabase CLI
\`\`\`bash
# If you have Supabase CLI installed
supabase db push
\`\`\`

### 2. Environment Variables

Copy `.env.example` to `.env.local` and update:

\`\`\`env
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="Contract Management System"

# Security (generate random strings)
CSRF_SECRET=generate_random_32_char_string
JWT_SECRET=generate_random_32_char_string
\`\`\`

### 3. OAuth Setup (Optional)

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
6. Copy Client ID and Secret to Supabase Auth settings

#### LinkedIn OAuth
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. Add OAuth 2.0 redirect URL
4. Copy Client ID and Secret to Supabase Auth settings

### 4. Email Templates

In Supabase Dashboard > Authentication > Email Templates:

#### Confirmation Email
\`\`\`html
<h2>Confirm your email</h2>
<p>Follow this link to confirm your email:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email address</a></p>
\`\`\`

#### Password Reset
\`\`\`html
<h2>Reset your password</h2>
<p>Follow this link to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
\`\`\`

### 5. Create First Admin User

1. Sign up normally through `/auth/signup`
2. Verify email
3. Run this SQL in Supabase to make the user an admin:

\`\`\`sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
\`\`\`

## Features Usage

### Authentication Pages
- **Sign Up**: `/auth/signup`
- **Sign In**: `/auth/signin`
- **Forgot Password**: `/auth/forgot-password`
- **MFA Setup**: Available in `/account/settings`

### Admin Pages
- **User Management**: `/admin/users` (requires admin role)

### User Pages
- **Account Settings**: `/account/settings`
- **Profile Management**: `/account/settings#profile`
- **Security Settings**: `/account/settings#security`

## Security Features

### 1. Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### 2. Rate Limiting
- Sign up: 3 attempts per hour per IP
- Sign in: 5 attempts per 15 minutes per email
- Password reset: 3 attempts per hour per email

### 3. Account Security
- Automatic account locking after 5 failed login attempts
- Session management with refresh tokens
- MFA/2FA support with backup codes

### 4. Audit Logging
All authentication events are logged:
- Sign up/in/out
- Password resets
- MFA events
- Failed attempts
- Account locks

## API Endpoints

### Public Endpoints
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout
- `POST /api/auth/reset-password/request` - Request password reset
- `POST /api/auth/reset-password/confirm` - Confirm password reset
- `POST /api/auth/refresh` - Refresh access token

### Protected Endpoints
- `POST /api/auth/mfa/setup` - Setup MFA (requires auth)
- `POST /api/auth/mfa/verify` - Verify MFA code (requires auth)

### Admin Endpoints
- `POST /api/admin/users/invite` - Invite new user (requires admin)
- `POST /api/admin/users/reset-password` - Reset user password (requires admin)

## Troubleshooting

### Common Issues

1. **"Cannot read properties of null"** during npm install
   - Use `npm install --legacy-peer-deps` flag
   - Or install packages one by one

2. **Migration fails**
   - Ensure you're using the correct Supabase project
   - Check that UUID extension is enabled
   - Run statements one by one if needed

3. **OAuth not working**
   - Verify redirect URLs match exactly
   - Check that OAuth is enabled in Supabase
   - Ensure environment variables are set

4. **MFA QR code not showing**
   - Check browser console for errors
   - Ensure the app can access external APIs
   - Try using a different authenticator app

## Development Tips

1. **Testing Authentication**
   - Use different browsers/incognito for multiple users
   - Test rate limiting with VPN or different IPs
   - Check audit logs for debugging

2. **Security Best Practices**
   - Always use HTTPS in production
   - Rotate secrets regularly
   - Monitor audit logs for suspicious activity
   - Keep dependencies updated

3. **Customization**
   - Modify password requirements in `lib/auth/types.ts`
   - Adjust rate limits in API routes
   - Customize email templates in Supabase
   - Add custom fields to profiles table

## Support

For issues or questions:
1. Check the browser console for errors
2. Review Supabase logs
3. Check audit_logs table for auth events
4. Verify all environment variables are set correctly
