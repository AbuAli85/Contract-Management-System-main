# Authentication Setup

The application requires authentication to create contracts. The error you're seeing is because there's no authenticated user session.

## Quick Start

1. **Navigate to the login page**: http://localhost:3001/simple-signin

2. **Create a test user in Supabase**:
   - Go to your Supabase dashboard: https://supabase.com/dashboard/project/ekdjxzhujettocosgzql
   - Navigate to Authentication > Users
   - Click "Add user" > "Create new user"
   - Enter:
     - Email: test@example.com
     - Password: Test123!
   - Click "Create user"

3. **Sign in using the simple sign-in page**:
   - Go to http://localhost:3001/simple-signin
   - Use the credentials:
     - Email: test@example.com
     - Password: Test123!
   - Click "Sign In"

4. **After successful login**, you'll be redirected to the contract generation page and should be able to create contracts.

## Alternative Login Pages

The application has multiple authentication pages:

- `/simple-signin` - Simplified login form with test credentials
- `/login` - Main login page
- `/auth/signin` - Full authentication page with social login options
- `/test-auth` - Authentication testing page to verify your session

## Troubleshooting

If you're still having issues:

1. **Check authentication status**: Visit http://localhost:3001/test-auth to see if you're authenticated
2. **Clear cookies**: Sometimes old session cookies can cause issues
3. **Check Supabase connection**: Ensure your Supabase project is active and the environment variables are correct

## Environment Variables

Make sure these are set in your `.env.local`:

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=https://ekdjxzhujettocosgzql.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrZGp4emh1amV0dG9jb3NnenFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMTkxMDYsImV4cCI6MjA2NDg5NTEwNn0.6VGbocKFVLNX_MCIOwFtdEssMk6wd_UQ5yNT1CfV6BA
\`\`\`

## Creating Contracts

Once authenticated, you can:

1. Navigate to http://localhost:3001/generate-contract
2. Fill in the contract form
3. Submit to create a new contract

The contract creation requires:

- First party (select from dropdown)
- Second party (select from dropdown)
- Promoter (select from dropdown)
- Start and end dates
- Optional: contract value, job title, work location
