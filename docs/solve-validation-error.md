# SOLVE: Validation Failed - Image URL Mapping Issue

## 🚨 **Current Error**
"Validation failed for 2 parameter(s)" - Image URL fields are empty

## 🎯 **ROOT CAUSE**
The field mapping for image URLs is incorrect. The Google Docs module can't find the image URL values.

## ✅ **STEP-BY-STEP SOLUTION**

### **STEP 1: Test with Hardcoded URLs First**

**Before fixing field mapping, verify the template works:**

**In Google Docs module, set:**
- **ID_CARD_IMAGE URL**: `https://via.placeholder.com/300x200.png?text=ID+Card`
- **PASSPORT_IMAGE URL**: `https://via.placeholder.com/300x200.png?text=Passport`

**Save and test.** 

**If this works:** ✅ Template is correct, field mapping is wrong
**If this fails:** ❌ Template needs to be fixed first

### **STEP 2: Find Correct Field Names**

**Debug the data structure:**

1. **Run** your scenario once
2. **Click** on Module 14 (Iterator) 
3. **Look at the output data**
4. **Screenshot** or note the exact field names

**Look for fields like:**
- `promoter_id_card_url`
- `id_card_url`
- `promoter_passport_url`
- `passport_url`

### **STEP 3: Try Different Field Mappings**

**Since you're using Iterator (Module 14), try these in order:**

**Option 1 (Most Likely):**
- `{{14.value.promoter_id_card_url}}`
- `{{14.value.promoter_passport_url}}`

**Option 2:**
- `{{2.data.0.promoter_id_card_url}}`
- `{{2.data.0.promoter_passport_url}}`

**Option 3:**
- `{{1.promoter_id_card_url}}`
- `{{1.promoter_passport_url}}`

**Option 4:**
- `{{14.promoter_id_card_url}}`
- `{{14.promoter_passport_url}}`

### **STEP 4: Check Your Webhook Response**

**Look at your webhook code to see exact field names:**

**In `app/api/webhook/makecom/route.ts`, check:**
\`\`\`typescript
// What are the exact field names?
promoter_id_card_url: (promoter_id_card_url || "").toString(),
promoter_passport_url: (promoter_passport_url || "").toString(),
\`\`\`

**Make sure these match your Make.com mapping exactly.**

## 🔧 **ALTERNATIVE SOLUTIONS**

### **Solution 1: Remove Images Temporarily**

**To get the scenario working:**
1. **Delete** both image replacement entries
2. **Save** Google Docs module
3. **Test** scenario - should work without images
4. **Add images back** once field mapping is correct

### **Solution 2: Use Different Module Data**

**Try getting images from different modules:**
- From webhook: `{{1.fieldname}}`
- From database: `{{2.data.0.fieldname}}`
- From iterator: `{{14.value.fieldname}}`

### **Solution 3: Hardcode for Testing**

**Use your actual Supabase URLs:**
- **ID_CARD_IMAGE**: `https://ekdjxzhujettocosgzql.supabase.co/storage/v1/object/public/promoter-documents/1751449305348_HAFIZ_MUHAMMAD_BILAL_ID.png`
- **PASSPORT_IMAGE**: `https://ekdjxzhujettocosgzql.supabase.co/storage/v1/object/public/promoter-documents/1751449604204_Hafiz_Bilal_Passport.png`

## 🎯 **IMMEDIATE ACTION PLAN**

1. **First**: Test with placeholder URLs (`https://via.placeholder.com/300x200.png`)
2. **If that works**: The issue is field mapping
3. **Then**: Try `{{14.value.promoter_id_card_url}}` and `{{14.value.promoter_passport_url}}`
4. **If still fails**: Check Module 14 output to see actual field names
5. **Last resort**: Remove images temporarily to get scenario working

The validation error means the URL fields are empty - we need to find the correct field mapping!
