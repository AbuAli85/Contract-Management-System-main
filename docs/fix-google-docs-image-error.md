# 🔧 URGENT: Google Docs Image Retrieval Error Fix

## Current Error Analysis
```
[400] Invalid requests[12].replaceImage: There was a problem retrieving the image. 
The provided image should be publicly accessible, within size limit, and in supported formats.
```

## Root Cause
Google Docs API cannot access the Supabase image URLs. This could be due to:
1. **Supabase bucket permissions** (images not public)
2. **Image format/size issues**
3. **URL accessibility from Google's servers**

## Immediate Solutions

### Solution 1: Check Supabase Bucket Permissions

**Step 1: Make Supabase bucket public**
1. Go to your Supabase dashboard
2. Navigate to **Storage** → **Buckets**
3. Find the `promoter-documents` bucket
4. Click **Settings** (gear icon)
5. Set **Public bucket** to **ON**
6. Save changes

**Step 2: Update bucket policy**
Add this RLS policy for public read access:
```sql
CREATE POLICY "Public read access" ON storage.objects FOR SELECT USING (bucket_id = 'promoter-documents');
```

### Solution 2: Test with Alternative Image URLs

Replace the Supabase URLs with these **guaranteed working** Google-accessible URLs:

**ID_CARD_IMAGE:**
```
https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=400&fit=crop
```

**PASSPORT_IMAGE:**
```
https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop
```

### Solution 3: Use Google Drive Images Instead

**Step 1: Upload images to Google Drive**
1. Upload sample ID card and passport images to Google Drive
2. Set sharing to **Anyone with the link can view**
3. Get the direct image URLs

**Step 2: Convert Google Drive links**
From: `https://drive.google.com/file/d/FILE_ID/view`
To: `https://drive.google.com/uc?export=view&id=FILE_ID`

### Solution 4: Webhook Fix with Working URLs

Update the webhook to use guaranteed working image URLs:
