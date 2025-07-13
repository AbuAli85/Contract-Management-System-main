# 🚨 IMMEDIATE FIX: Make.com Validation Errors

## The Problem
**Error:** `Data is INVALID because of the error: [Validation failed for 2 parameter(s).]]`

## The Solution
The 2 failing parameters are almost certainly the **image URL fields**. Here's the exact fix:

### Step 1: Check Your Google Docs Module Configuration

In your Make.com scenario, go to the Google Docs module and look for these fields:

**Current (probably wrong):**
\`\`\`
ID_CARD_IMAGE: {{14.value.promoter_id_card_url}}
PASSPORT_IMAGE: {{14.value.promoter_passport_url}}
\`\`\`

**Correct mapping:**
\`\`\`
ID_CARD_IMAGE: {{promoter_id_card_url}}
PASSPORT_IMAGE: {{promoter_passport_url}}
\`\`\`

### Step 2: Why This Fix Works

Based on the webhook code analysis, the response structure is:
\`\`\`json
{
  "promoter_id_card_url": "https://supabase-url...",
  "promoter_passport_url": "https://supabase-url...",
  "contract_number": "CON-123",
  "promoter_name_en": "John Doe",
  ...
}
\`\`\`

**The fields are at the ROOT level, not nested under an iterator.**

### Step 3: Alternative Test (If Above Doesn't Work)

If the correct field mapping still fails, test with hardcoded URLs to isolate the problem:

**Temporarily use these working URLs:**
- **ID_CARD_IMAGE**: `https://vcjhdguxbmlqtzzllkki.supabase.co/storage/v1/object/public/promoter-documents/promoter_id_cards/1736025061969_id-card.jpg`
- **PASSPORT_IMAGE**: `https://vcjhdguxbmlqtzzllkki.supabase.co/storage/v1/object/public/promoter-documents/promoter_passports/1736025062016_passport.jpg`

If hardcoded URLs work → Problem is field mapping  
If hardcoded URLs fail → Problem is template or permissions

### Step 4: Common Field Mapping Mistakes

❌ **Using iterator syntax when not needed:**
- `{{14.value.promoter_id_card_url}}`
- `{{data.promoter_id_card_url}}`

✅ **Correct direct mapping:**
- `{{promoter_id_card_url}}`
- `{{promoter_passport_url}}`

### Step 5: Verify Your Google Docs Template

Make sure your Google Docs template has:
1. **Image placeholders** (not just text)
2. **Correct Alt text:** 
   - First image Alt text: `ID_CARD_IMAGE`
   - Second image Alt text: `PASSPORT_IMAGE`

### Step 6: Quick Verification

After making the field mapping changes:
1. Run your Make.com scenario
2. Check if validation errors are gone
3. Verify the document generates with images

### Step 7: If Still Failing

1. **Check the webhook module output** - look for the actual field names
2. **Test without images** - remove image fields temporarily to see if other data works
3. **Check Supabase permissions** - ensure the bucket is public

---

## Summary

**Most likely fix:** Change your Google Docs module fields from:
- `{{14.value.promoter_id_card_url}}` → `{{promoter_id_card_url}}`
- `{{14.value.promoter_passport_url}}` → `{{promoter_passport_url}}`

This should resolve the 2 parameter validation errors immediately.
