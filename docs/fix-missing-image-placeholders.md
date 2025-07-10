# 🔧 URGENT: Google Docs Template Missing Image Placeholders

## Current Error Analysis
```
[400] Invalid requests[12].replaceImage: The object with ID ID_CARD_IMAGE could not be found.
```

## Root Cause
The Google Docs template is **missing image placeholders** with the Alt text `ID_CARD_IMAGE` (and likely `PASSPORT_IMAGE`).

## IMMEDIATE FIX: Add Image Placeholders to Google Docs Template

### Step 1: Open Your Google Docs Template
1. Go to your Google Docs template used in Make.com
2. Find where you want the ID card and passport images to appear

### Step 2: Insert Image Placeholders

**For ID Card Image:**
1. Click where you want the ID card image
2. Go to **Insert** → **Image** → **Search the web**
3. Search for any placeholder image (or use Upload)
4. Insert a temporary image
5. **Right-click the image** → **Alt text**
6. Set Alt text to: `ID_CARD_IMAGE` (exactly this text)
7. Click **Apply**

**For Passport Image:**
1. Click where you want the passport image
2. Go to **Insert** → **Image** → **Search the web**
3. Insert another temporary image
4. **Right-click the image** → **Alt text**
5. Set Alt text to: `PASSPORT_IMAGE` (exactly this text)
6. Click **Apply**

### Step 3: Verify Alt Text is Correct
1. Right-click each image
2. Select **Alt text**
3. Confirm the text is exactly:
   - `ID_CARD_IMAGE`
   - `PASSPORT_IMAGE`
4. **Case sensitive and no extra spaces!**

### Step 4: Save the Template
1. Save your Google Docs template
2. The template is now ready for Make.com

## Alternative: Quick Template Setup

If you want to create a simple test template:

### Create New Test Template:
1. Create a new Google Doc
2. Add this content:

```
CONTRACT DOCUMENT

Promoter Name: {{promoter_name_en}}
Contract Number: {{contract_number}}

ID CARD:
[Insert image here - Alt text: ID_CARD_IMAGE]

PASSPORT:
[Insert image here - Alt text: PASSPORT_IMAGE]

Contract Details:
- Start Date: {{start_date}}
- End Date: {{end_date}}
- Job Title: {{job_title}}
```

3. Insert two placeholder images with correct Alt text
4. Use this template in your Make.com scenario

## Visual Guide for Adding Images

### Method 1: Insert → Image → Upload
1. **Insert** menu → **Image** → **Upload from computer**
2. Upload any sample image (will be replaced by Make.com)
3. Right-click image → **Alt text** → Enter `ID_CARD_IMAGE`

### Method 2: Insert → Image → Search
1. **Insert** menu → **Image** → **Search the web**
2. Search "placeholder" or "sample id card"
3. Insert any image
4. Right-click image → **Alt text** → Enter `ID_CARD_IMAGE`

## Common Mistakes to Avoid

❌ **Wrong Alt text:**
- `id_card_image` (wrong case)
- `ID CARD IMAGE` (spaces instead of underscores)
- `promoter_id_card` (wrong name)

✅ **Correct Alt text:**
- `ID_CARD_IMAGE` (exact match)
- `PASSPORT_IMAGE` (exact match)

❌ **No image placeholder:**
- Just text saying "Image goes here"
- Empty space

✅ **Actual image placeholder:**
- Real inserted image with Alt text

## Test Your Template

After adding the placeholders:
1. Run your Make.com scenario
2. Should now work without "object not found" errors
3. Images should be replaced in the generated document

## Expected Template Structure

Your template should have:
- ✅ Text placeholders: `{{contract_number}}`, `{{promoter_name_en}}`, etc.
- ✅ Image placeholder 1: Any image with Alt text `ID_CARD_IMAGE`
- ✅ Image placeholder 2: Any image with Alt text `PASSPORT_IMAGE`

## Quick Verification

**In Google Docs template:**
1. Click on first image → should show "ID_CARD_IMAGE" in Alt text
2. Click on second image → should show "PASSPORT_IMAGE" in Alt text
3. Both should be actual images, not text

**This will fix the "object not found" error immediately!**
