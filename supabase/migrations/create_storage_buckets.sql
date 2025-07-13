-- Create storage buckets for the application

-- Enable the storage extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create contracts bucket
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'contracts',
  'contracts',
  true, -- Public bucket for contract PDFs
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'application/vnd.google-apps.document']
)
ON CONFLICT (id) DO NOTHING;

-- Create promoter-documents bucket
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'promoter-documents',
  'promoter-documents',
  true, -- Public bucket for ID cards and passports
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Create party-files bucket
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'party-files',
  'party-files',
  true, -- Public bucket for party documents
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for contracts bucket
CREATE POLICY "Allow authenticated users to upload contracts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'contracts');

CREATE POLICY "Allow authenticated users to update contracts"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'contracts');

CREATE POLICY "Allow public to view contracts"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'contracts');

CREATE POLICY "Allow authenticated users to delete contracts"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'contracts');

-- Set up RLS policies for promoter-documents bucket
CREATE POLICY "Allow authenticated users to upload promoter documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'promoter-documents');

CREATE POLICY "Allow authenticated users to update promoter documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'promoter-documents');

CREATE POLICY "Allow public to view promoter documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'promoter-documents');

CREATE POLICY "Allow authenticated users to delete promoter documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'promoter-documents');

-- Set up RLS policies for party-files bucket
CREATE POLICY "Allow authenticated users to upload party files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'party-files');

CREATE POLICY "Allow authenticated users to update party files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'party-files');

CREATE POLICY "Allow public to view party files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'party-files');

CREATE POLICY "Allow authenticated users to delete party files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'party-files');
