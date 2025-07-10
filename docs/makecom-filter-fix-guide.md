# Make.com Filter Fix Guide

## Problem Identified

The error "Failed to evaluate filter '0=0': Cannot read properties of undefined (reading 'split')" occurs because:

1. **Root Cause**: Make.com filters were trying to process `null` or `undefined` values as strings
2. **Specific Issue**: When image URLs were missing, the webhook returned `null`, but Make.com tried to call string methods like `.split()` on these null values

## Solution Implemented

### 1. Webhook Response Fix ✅ COMPLETED

Updated `app/api/webhook/makecom/route.ts` to ensure:
- **All string fields return actual strings** (never null/undefined)
- **Empty image URLs return `""` instead of `null`**
- **All fields are explicitly converted to strings using `.toString()`**

### 2. Make.com Filter Updates Needed

Based on your screenshots, you need to update your Make.com filters:

#### Current Filter (causing errors):
```
Status code "Equal to" [undefined/empty condition]
```

#### Recommended Filter Logic:

**For "Passport Download Success" Filter:**
```
Condition 1: promoter_passport_url "not equal" ""
AND
Condition 2: length(promoter_passport_url) "greater" 0
```

**For "ID Card Download Success" Filter:**
```
Condition 1: promoter_id_card_url "not equal" ""
AND 
Condition 2: length(promoter_id_card_url) "greater" 0
```

#### Alternative Simple Filter:
```
promoter_passport_url "contains" "http"
```
This will only pass when there's an actual URL.

## Step-by-Step Fix in Make.com

### Step 1: Fix the Filter Conditions

1. **Open your Make.com scenario**
2. **Click on the failing filter module** (the one showing the error)
3. **Delete the current conditions**
4. **Add new condition:**
   - Field: `promoter_passport_url` (or `promoter_id_card_url`)
   - Operator: `not equal`
   - Value: `""` (empty string)
5. **Add second condition (optional but recommended):**
   - Field: `length(promoter_passport_url)`
   - Operator: `greater`
   - Value: `0`

### Step 2: Set Filter Logic

- **Set the filter logic to "AND"** if you have multiple conditions
- **Or use "OR"** if you want to process when either image is available

### Step 3: Save and Test

1. **Save the scenario**
2. **Run a test** with the webhook
3. **Check execution history** for any errors

## Expected Behavior After Fix

### When NO images provided:
- `promoter_id_card_url`: `""`
- `promoter_passport_url`: `""`
- **Filter result**: SKIP (doesn't process images)
- **Scenario**: Continues to next module

### When images ARE provided:
- `promoter_id_card_url`: `"https://example.com/image.jpg"`
- `promoter_passport_url`: `"https://example.com/passport.jpg"`
- **Filter result**: PASS (processes images)
- **Scenario**: Downloads and processes images

## Testing the Fix

### 1. Test with No Images
Send this payload to test empty image handling:
```json
{
  "contract_number": "TEST-001",
  "promoter_name_en": "Test User",
  "first_party_name_en": "Test Company",
  "second_party_name_en": "Test Employer"
}
```

### 2. Test with Images
Send this payload to test image processing:
```json
{
  "contract_number": "TEST-002", 
  "promoter_name_en": "Test User",
  "promoter_id_card_url": "https://via.placeholder.com/600x400",
  "promoter_passport_url": "https://via.placeholder.com/600x400",
  "first_party_name_en": "Test Company",
  "second_party_name_en": "Test Employer"
}
```

## Troubleshooting

### If errors still occur:

1. **Check webhook response** by looking at Make.com execution logs
2. **Verify all fields are strings** in the webhook response
3. **Ensure no null values** are being returned
4. **Update filter conditions** to handle empty strings properly

### Quick Diagnosis Commands:

```bash
# Test the webhook locally
cd "c:\Users\HP\Documents\GitHub\extra-contracts-yy-main"
node scripts/test-fixed-filter-response.js

# Test webhook endpoint directly
curl -X POST http://localhost:3000/api/webhook/makecom \
  -H "Content-Type: application/json" \
  -d '{"contract_number":"TEST-001","promoter_name_en":"Test"}'
```

## Summary

✅ **Webhook Fixed**: All string fields guaranteed to be strings  
⚠️ **Make.com Filter**: Needs updating to handle empty strings properly  
🎯 **Result**: No more `.split()` errors, proper conditional processing  

The webhook now returns safe string values that Make.com can process without errors. Update your filters as described above to complete the fix.
