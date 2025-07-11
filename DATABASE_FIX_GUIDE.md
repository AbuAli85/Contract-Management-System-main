# Database Fix Guide

## Issue: 500 Error on Contracts Query

If you're experiencing a 500 error when the application tries to fetch contracts data, it's likely due to missing foreign key relationships in the database.

## Solution

### Option 1: Run the Fix Script in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `scripts/fix-contracts-foreign-keys.sql`
5. Paste and click **Run**

This script will:

- Add missing foreign key constraints
- Create necessary indexes for performance
- Set up Row Level Security (RLS) policies
- Grant appropriate permissions

### Option 2: Manual Fix

If the script fails, you can manually check and fix the issues:

1. **Check if the contracts table exists:**

```sql
SELECT * FROM information_schema.tables
WHERE table_name = 'contracts';
```

2. **Check foreign key constraints:**

```sql
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name='contracts';
```

3. **If foreign keys are missing, add them manually:**

```sql
-- Add foreign key for promoter_id
ALTER TABLE contracts
ADD CONSTRAINT contracts_promoter_id_fkey
FOREIGN KEY (promoter_id)
REFERENCES promoters(id)
ON DELETE SET NULL;

-- Add foreign key for first_party_id
ALTER TABLE contracts
ADD CONSTRAINT contracts_first_party_id_fkey
FOREIGN KEY (first_party_id)
REFERENCES parties(id)
ON DELETE RESTRICT;

-- Add foreign key for second_party_id
ALTER TABLE contracts
ADD CONSTRAINT contracts_second_party_id_fkey
FOREIGN KEY (second_party_id)
REFERENCES parties(id)
ON DELETE RESTRICT;
```

## Application-Level Fix

The application has been updated to handle this error gracefully:

1. **Error Handling**: The promoter management components now wrap the contracts query in a try-catch block
2. **Fallback Behavior**: If the contracts query fails, the application continues to work without contract data
3. **Console Warnings**: Errors are logged to the console for debugging but don't crash the application

## Prevention

To prevent this issue in the future:

1. **Always run migrations** when setting up a new database
2. **Check foreign key relationships** after creating tables
3. **Enable RLS policies** for security
4. **Test queries** in the SQL editor before deploying

## Verification

After applying the fix, verify it works:

1. Go to the Promoter Management page
2. Check the browser console for any errors
3. The page should load without 500 errors
4. Contract counts may show as 0 if the relationships were missing

## Need Help?

If you continue to experience issues:

1. Check the Supabase logs for detailed error messages
2. Verify all tables (contracts, promoters, parties) exist
3. Ensure your database user has appropriate permissions
4. Contact support with the specific error message from the logs
