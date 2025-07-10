# URGENT: Add Images to Google Docs Template - Step by Step

## 🎯 **Priority Action: Fix Template for Images**

Since your scenario works without images, the issue is that your Google Docs template doesn't have the required image placeholders.

## 📋 **EXACT STEPS TO FIX**

### **1. Open Your Google Docs Template**
- **Go to**: https://docs.google.com/document/d/1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0/edit
- **This is your contract template** that needs image placeholders

### **2. Add ID Card Image Placeholder**
1. **Find** where you want the ID card to appear in the contract
2. **Click** Insert → Image → "Upload from computer"
3. **Upload any sample image** (can be a placeholder image)
4. **Right-click** the inserted image
5. **Select** "Alt text"
6. **Type exactly**: `ID_CARD_IMAGE` (must be exact)
7. **Click** "Apply"

### **3. Add Passport Image Placeholder**
1. **Find** where you want the passport to appear in the contract
2. **Click** Insert → Image → "Upload from computer"
3. **Upload any sample image** (can be a placeholder image)
4. **Right-click** the inserted image
5. **Select** "Alt text"
6. **Type exactly**: `PASSPORT_IMAGE` (must be exact)
7. **Click** "Apply"

### **4. Save the Template**
- **File** → **Save** or Ctrl+S

## 🔧 **Then Fix Make.com Image Settings**

### **Option A: Use Google Drive (Current Setup)**

**Add to your Google Drive upload modules (4 & 5):**
```json
"permissions": [
  {
    "role": "reader",
    "type": "anyone"
  }
]
```

**Image URLs in Google Docs module:**
- **ID_CARD_IMAGE**: `https://drive.google.com/uc?export=view&id={{4.id}}`
- **PASSPORT_IMAGE**: `https://drive.google.com/uc?export=view&id={{5.id}}`

### **Option B: Use Supabase Direct (Simpler)**

**Skip Google Drive uploads, use Supabase URLs directly:**
- **ID_CARD_IMAGE**: `{{1.promoter_id_card_url}}`
- **PASSPORT_IMAGE**: `{{1.promoter_passport_url}}`

## 🧪 **Test Process**

1. **Fix template** with image placeholders (steps 1-4 above)
2. **Add images back** to Make.com Google Docs module
3. **Run scenario**
4. **Check** if images appear in generated document

## ⚡ **Quick Verification**

**To check if template is ready:**
1. **Open** your template
2. **Look for** two images with alt text: `ID_CARD_IMAGE` and `PASSPORT_IMAGE`
3. **If not found** → Add them using steps above
4. **If found** → Template is ready for Make.com

## 🎯 **Why This Will Work**

- ✅ **Core scenario verified working** (without images)
- ✅ **JavaScript errors completely fixed**
- ✅ **Only missing image placeholders** in template
- ✅ **Images are important** → Template needs proper setup

**Priority**: Fix the Google Docs template first, then test images!
