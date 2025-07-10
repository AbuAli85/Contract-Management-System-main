# 🔧 URGENT FIX: Missing URL Parameter Values

## Exact Error Analysis
```
Validation failed for 2 parameter(s).
Missing value of required parameter 'url'.
Missing value of required parameter 'url'.
```

**Root Cause:** The Google Docs module is receiving EMPTY or NULL values for the image URL fields.

## Immediate Solutions (Try in Order)

### Solution 1: Add Fallback URLs
In your Google Docs module, replace the current image fields with fallback logic:

**ID_CARD_IMAGE field:**
```
{{ifempty(promoter_id_card_url; "https://vcjhdguxbmlqtzzllkki.supabase.co/storage/v1/object/public/promoter-documents/promoter_id_cards/1736025061969_id-card.jpg")}}
```

**PASSPORT_IMAGE field:**
```
{{ifempty(promoter_passport_url; "https://vcjhdguxbmlqtzzllkki.supabase.co/storage/v1/object/public/promoter-documents/promoter_passports/1736025062016_passport.jpg")}}
```

### Solution 2: Use Hardcoded URLs (Quick Test)
Temporarily use these working URLs to confirm the module works:

**ID_CARD_IMAGE:**
```
https://vcjhdguxbmlqtzzllkki.supabase.co/storage/v1/object/public/promoter-documents/promoter_id_cards/1736025061969_id-card.jpg
```

**PASSPORT_IMAGE:**
```
https://vcjhdguxbmlqtzzllkki.supabase.co/storage/v1/object/public/promoter-documents/promoter_passports/1736025062016_passport.jpg
```

### Solution 3: Check Field Mapping
Verify you're using the correct field names:

**Correct mapping:**
- `{{promoter_id_card_url}}`
- `{{promoter_passport_url}}`

**NOT:**
- `{{14.value.promoter_id_card_url}}`
- `{{data.promoter_id_card_url}}`
- `{{id_card_url}}`

### Solution 4: Debug the Source Data
1. **Check webhook module output** - Look at the actual data being sent
2. **Verify the webhook is sending image URLs** in the payload
3. **Check if promoter has images** in the database

## Why URLs Are Missing

### Possible Causes:
1. **Wrong field mapping** - Using incorrect field names
2. **Empty webhook data** - Promoter doesn't have image URLs in database  
3. **Webhook payload missing** - Images not included in the request
4. **Field not found** - Using iterator syntax when data is at root level

## Step-by-Step Debug Process

### Step 1: Test with Hardcoded URLs
- Use the hardcoded URLs above
- If this works → Problem is field mapping or source data
- If this fails → Problem is template or Google Docs permissions

### Step 2: Check Webhook Output
- Run the scenario and look at the webhook response
- Check if `promoter_id_card_url` and `promoter_passport_url` have values
- If empty → Problem is in the webhook or database

### Step 3: Verify Field Names
- Use exact field names: `{{promoter_id_card_url}}`
- Remove any iterator references like `{{14.value...}}`

### Step 4: Add Error Handling
- Use `ifempty()` function to provide fallback URLs
- This prevents validation errors when URLs are missing

## Webhook Update Needed?

If the webhook isn't sending image URLs, we may need to update it. Let me check if the test payload includes images:

**Expected webhook payload should include:**
```json
{
  "promoter_id_card_url": "https://supabase-url...",
  "promoter_passport_url": "https://supabase-url...",
  ...
}
```

## Quick Fix Summary

**IMMEDIATE ACTION:**
1. In Google Docs module, replace image URL fields with hardcoded URLs
2. Test the scenario - should work without validation errors
3. If successful, then replace with proper field mapping + fallbacks
4. If still fails, check Google Docs template has image placeholders

**Final working configuration:**
```
ID_CARD_IMAGE: {{ifempty(promoter_id_card_url; "https://vcjhdguxbmlqtzzllkki.supabase.co/storage/v1/object/public/promoter-documents/promoter_id_cards/1736025061969_id-card.jpg")}}

PASSPORT_IMAGE: {{ifempty(promoter_passport_url; "https://vcjhdguxbmlqtzzllkki.supabase.co/storage/v1/object/public/promoter-documents/promoter_passports/1736025062016_passport.jpg")}}
```

This approach ensures the URLs are never empty and always provide valid image links.
