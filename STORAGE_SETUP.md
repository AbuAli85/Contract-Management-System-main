# Storage Buckets Setup

The application requires three storage buckets in Supabase for file uploads. The error "Bucket not found" indicates these haven't been created yet.

## Quick Setup via Supabase Dashboard

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard/project/ekdjxzhujettocosgzql/storage/buckets

2. **Create the following buckets**:

### 1. Contracts Bucket

- Click "New bucket"
- Name: `contracts`
- Public bucket: ✅ Yes (check this)
- File size limit: 50MB
- Allowed MIME types:
  - application/pdf
  - application/vnd.google-apps.document

### 2. Promoter Documents Bucket

- Click "New bucket"
- Name: `promoter-documents`
- Public bucket: ✅ Yes (check this)
- File size limit: 10MB
- Allowed MIME types:
  - image/jpeg
  - image/jpg
  - image/png
  - image/webp
  - application/pdf

### 3. Party Files Bucket

- Click "New bucket"
- Name: `party-files`
- Public bucket: ✅ Yes (check this)
- File size limit: 50MB
- Allowed MIME types:
  - application/pdf
  - image/jpeg
  - image/jpg
  - image/png
  - application/msword
  - application/vnd.openxmlformats-officedocument.wordprocessingml.document
  - application/vnd.ms-excel
  - application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

## Alternative: SQL Setup

If you prefer to use SQL, you can run the migration script:

1. Go to the SQL Editor in Supabase: https://supabase.com/dashboard/project/ekdjxzhujettocosgzql/sql/new
2. Copy and paste the contents of `supabase/migrations/create_storage_buckets.sql`
3. Click "Run"

## Verify Setup

After creating the buckets, you should see them listed in your Storage dashboard. The application should now be able to:

- Upload contract PDFs
- Upload promoter ID cards and passports
- Upload party-related documents

## Troubleshooting

If you still get "Bucket not found" errors after creating the buckets:

1. **Check bucket names**: Ensure they match exactly (case-sensitive):
   - `contracts`
   - `promoter-documents`
   - `party-files`

2. **Check permissions**: Make sure the buckets are set to "public" if you want the files to be accessible via public URLs

3. **Clear browser cache**: Sometimes the Supabase client caches bucket information

4. **Restart the development server**: Stop and restart `npm run dev`
