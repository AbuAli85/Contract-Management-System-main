# Fix Make.com Validation Errors - Step by Step

## Current Issue
**Error:** `Data is INVALID because of the error: [Validation failed for 2 parameter(s).]]`

This means 2 fields in your Google Docs module are not receiving valid data. Most likely the image URL fields.

## Immediate Debug Steps

### Step 1: Check Which Fields Are Failing
1. Go to your Make.com scenario
2. Click on the Google Docs module (Module 15 or 16)
3. Look for any fields highlighted in RED or with warning icons
4. The failing fields are likely:
   - `ID_CARD_IMAGE` 
   - `PASSPORT_IMAGE`

### Step 2: Check the Iterator Output (Module 14)
1. Run the scenario with a test webhook
2. Click on Module 14 (Iterator) after it executes
3. Look at the **output data**
4. Find the exact field names for images, they might be:
   - `promoter_id_card_url`
   - `promoter_passport_url` 
   - `id_card_url`
   - `passport_url`
   - Or some other variation

### Step 3: Test with Hardcoded URLs First
To confirm the Google Docs template works:

1. In the Google Docs module, temporarily replace the dynamic fields with these working URLs:
   - **ID_CARD_IMAGE**: `https://vcjhdguxbmlqtzzllkki.supabase.co/storage/v1/object/public/promoter-documents/promoter_id_cards/1736025061969_id-card.jpg`
   - **PASSPORT_IMAGE**: `https://vcjhdguxbmlqtzzllkki.supabase.co/storage/v1/object/public/promoter-documents/promoter_passports/1736025062016_passport.jpg`

2. Run the scenario
3. If it works, the problem is field mapping
4. If it fails, the problem is template or permissions

### Step 4: Fix Field Mapping
Based on what you see in the Iterator output, use the correct syntax:

**Option A - Direct from Iterator:**
```
{{14.value.promoter_id_card_url}}
{{14.value.promoter_passport_url}}
```

**Option B - If fields are nested:**
```
{{14.value.promoter.id_card_url}}
{{14.value.promoter.passport_url}}
```

**Option C - If fields have different names:**
```
{{14.value.id_card_image_url}}
{{14.value.passport_image_url}}
```

## Common Validation Errors and Fixes

### Error 1: Empty or Null Fields
**Cause:** Field mapping returns null/undefined
**Fix:** Use fallback syntax:
```
{{ifempty(14.value.promoter_id_card_url; "")}}
```

### Error 2: Invalid URL Format
**Cause:** URL is malformed or not accessible
**Fix:** Ensure Supabase URLs are public and complete

### Error 3: Field Not Found
**Cause:** Wrong field name in mapping
**Fix:** Check exact field names in Iterator output

## Quick Test Procedure

1. **Test webhook response:**
   ```bash
   curl -X POST http://localhost:3000/api/webhook/makecom \
     -H "Content-Type: application/json" \
     -d '{"promoter_id": "test123"}'
   ```

2. **Check for these fields in response:**
   - `promoter_id_card_url`
   - `promoter_passport_url`

3. **Use exact field names in Google Docs module**

## Expected Working Configuration

**Google Docs Module Fields:**
- **Template Document ID**: Your Google Docs template ID
- **ID_CARD_IMAGE**: `{{14.value.promoter_id_card_url}}`
- **PASSPORT_IMAGE**: `{{14.value.promoter_passport_url}}`
- All other text fields should already be working

## If Still Failing

1. **Check Supabase bucket permissions:**
   - Go to Supabase dashboard
   - Storage → Buckets → promoter-documents
   - Ensure bucket is PUBLIC

2. **Verify image URLs are accessible:**
   - Copy a Supabase URL from webhook response
   - Paste in browser - should show image

3. **Check Google Docs template:**
   - Ensure placeholders exist with correct Alt text:
     - Alt text: `ID_CARD_IMAGE`
     - Alt text: `PASSPORT_IMAGE`

## Next Steps After This Fix

Once validation passes:
1. Test with real promoter data
2. Verify images appear in generated document
3. Check document formatting and layout
4. Deploy to production

---

**Remember:** The exact field names depend on your Iterator output. Always check Module 14's actual output data to see the precise field names available.
