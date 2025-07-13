# Make.com Field Mapping Quick Reference

## Validation Error Fix - Exact Field Names

Based on the webhook response structure, here are the **EXACT** field names to use in your Google Docs module:

### Image URL Fields (These are likely causing validation errors)

**For ID Card Image:**
\`\`\`
{{promoter_id_card_url}}
\`\`\`

**For Passport Image:**
\`\`\`
{{promoter_passport_url}}
\`\`\`

### All Available Fields from Webhook Response

#### Promoter Information
- `{{promoter_name_en}}` - Promoter name (English)
- `{{promoter_name_ar}}` - Promoter name (Arabic)  
- `{{promoter_id_card_url}}` - ID card image URL
- `{{promoter_passport_url}}` - Passport image URL
- `{{id_card_number}}` - ID card number

#### Contract Details
- `{{contract_number}}` - Contract number
- `{{start_date}}` - Contract start date
- `{{end_date}}` - Contract end date
- `{{job_title}}` - Job title
- `{{work_location}}` - Work location
- `{{contract_value}}` - Contract value
- `{{email}}` - Email address
- `{{status}}` - Contract status

#### Party Information
- `{{first_party_name_en}}` - First party name (English)
- `{{first_party_name_ar}}` - First party name (Arabic)
- `{{first_party_crn}}` - First party CRN
- `{{second_party_name_en}}` - Second party name (English)
- `{{second_party_name_ar}}` - Second party name (Arabic)
- `{{second_party_crn}}` - Second party CRN

#### Internal IDs (for reference)
- `{{promoter_id}}` - Promoter database ID
- `{{first_party_id}}` - First party database ID
- `{{second_party_id}}` - Second party database ID
- `{{contract_uuid}}` - Contract UUID

## Immediate Fix Steps

### Step 1: Update Google Docs Module
Replace the failing fields with:

**Image placeholders in Google Docs template:**
- Alt text: `ID_CARD_IMAGE` → Field: `{{promoter_id_card_url}}`
- Alt text: `PASSPORT_IMAGE` → Field: `{{promoter_passport_url}}`

### Step 2: Test with Hardcoded URLs (if above fails)
Use these working Supabase URLs to test:

**ID_CARD_IMAGE:**
\`\`\`
https://vcjhdguxbmlqtzzllkki.supabase.co/storage/v1/object/public/promoter-documents/promoter_id_cards/1736025061969_id-card.jpg
\`\`\`

**PASSPORT_IMAGE:**
\`\`\`
https://vcjhdguxbmlqtzzllkki.supabase.co/storage/v1/object/public/promoter-documents/promoter_passports/1736025062016_passport.jpg
\`\`\`

### Step 3: Add Fallbacks (if fields might be empty)
\`\`\`
{{ifempty(promoter_id_card_url; "")}}
{{ifempty(promoter_passport_url; "")}}
\`\`\`

## Why These Field Names?

The webhook response structure shows these fields are returned at the root level:
\`\`\`json
{
  "promoter_id_card_url": "https://...",
  "promoter_passport_url": "https://...",
  "promoter_name_en": "...",
  ...
}
\`\`\`

**No Iterator needed** - these fields are directly accessible from the webhook response.

## Common Mistakes to Avoid

❌ **Wrong:** `{{14.value.promoter_id_card_url}}`  
✅ **Correct:** `{{promoter_id_card_url}}`

❌ **Wrong:** `{{data.promoter_id_card_url}}`  
✅ **Correct:** `{{promoter_id_card_url}}`

❌ **Wrong:** `{{id_card_url}}`  
✅ **Correct:** `{{promoter_id_card_url}}`

## Test URLs to Verify Template Works

Use these in Google Docs module temporarily:
- **ID_CARD_IMAGE**: Direct Supabase URL above
- **PASSPORT_IMAGE**: Direct Supabase URL above

If document generates successfully with hardcoded URLs, then the template is correct and you just need to use the dynamic fields: `{{promoter_id_card_url}}` and `{{promoter_passport_url}}`.
