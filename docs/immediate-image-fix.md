# IMMEDIATE FIX: Google Docs Template Image Placeholders

## 🚨 **Current Error**
```
[400] Invalid requests[12].replaceImage: The object with ID ID_CARD_IMAGE could not be found.
```

## 🎯 **Root Cause**
- Your Google Docs template doesn't have image placeholders with IDs: `ID_CARD_IMAGE` and `PASSPORT_IMAGE`
- Make.com is trying to replace images that don't exist in the template
- The template needs to be set up with proper image objects

## ✅ **SOLUTION 1: Fix Google Docs Template (Required)**

### **Step 1: Open Your Google Docs Template**
1. Go to Google Docs
2. Open template ID: `1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0`
3. This is your contract template that needs image placeholders

### **Step 2: Add Image Placeholders**
1. **Insert** → **Image** → **Upload from computer** (use any placeholder image)
2. **Right-click** on the inserted image
3. **Select** "Alt text"
4. **Set Alt text to**: `ID_CARD_IMAGE` (exactly this text)
5. **Repeat** for second image with Alt text: `PASSPORT_IMAGE`

### **Step 3: Alternative - Use Drawings**
1. **Insert** → **Drawing** → **New**
2. **Insert** → **Image** in the drawing
3. **Save and close** the drawing
4. **Right-click** the drawing → **Alt text** → Set to `ID_CARD_IMAGE`

## ✅ **SOLUTION 2: Remove Image Replacements (Quick Fix)**

**If you don't need images right now:**

1. **Open** Google Docs module in Make.com
2. **Delete** both image replacement entries:
   - Remove `ID_CARD_IMAGE` entry
   - Remove `PASSPORT_IMAGE` entry
3. **Save** and test the scenario
4. **Documents will generate** without images

## ✅ **SOLUTION 3: How to Set Up Template Images**

### **Method 1: Using Alt Text (Recommended)**
1. **Open** your Google Docs template: `1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0`
2. **Add placeholder images** where you want ID card and passport
3. **Right-click** each image → **Alt text**
4. **Set Alt text** to exact IDs:
   - First image: `ID_CARD_IMAGE`
   - Second image: `PASSPORT_IMAGE`
5. **Save** the template

### **Method 2: Using Image Replacement API**
The images need to be inserted as objects in Google Docs with specific object IDs that Match what your Make.com scenario expects.

## 📋 **Quick Test Steps**

### **Immediate Fix (Remove Images):**
1. **Open** Google Docs module in Make.com
2. **Scroll to** "Images Replacement" section  
3. **Delete** both image replacement entries
4. **Save** module
5. **Run** scenario - should work without images

### **Then Add Images Back:**
1. **Fix** the Google Docs template with proper image placeholders
2. **Add** image replacements back to Make.com module
3. **Test** full scenario with images

## 🎯 **NOW FIX THE IMAGES (Since they're important)**

Great! The scenario works without images, which means all Make.com JavaScript errors are fixed. Now let's add the images back properly.

### **Step 1: Fix Your Google Docs Template**

**Open your template**: `1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0`

**Add image placeholders:**
1. **Position cursor** where you want the ID card image
2. **Insert** → **Image** → **Upload from computer** 
3. **Upload any placeholder image** (you can use a sample ID card image)
4. **Right-click** the inserted image
5. **Click** "Alt text"
6. **Type exactly**: `ID_CARD_IMAGE`
7. **Click** "Apply"

**Repeat for passport:**
1. **Position cursor** where you want the passport image
2. **Insert** → **Image** → **Upload from computer**
3. **Upload any placeholder image** (sample passport)
4. **Right-click** the image
5. **Alt text**: `PASSPORT_IMAGE`
6. **Apply**

### **Step 2: Make Google Drive Images Public**

**Update your Google Drive upload modules (4 & 5):**

**Add this to both Module 4 and Module 5 mappers:**
```json
"permissions": [
  {
    "role": "reader",
    "type": "anyone"
  }
]
```

### **Step 3: Add Images Back to Make.com**

**In your Google Docs module, add back:**
- **Image Object ID**: `ID_CARD_IMAGE`
- **Image URL**: `https://drive.google.com/uc?export=view&id={{4.id}}`

- **Image Object ID**: `PASSPORT_IMAGE` 
- **Image URL**: `https://drive.google.com/uc?export=view&id={{5.id}}`

### **Step 4: Test Full Scenario**

1. **Save** all changes
2. **Run** the scenario
3. **Check** that document generates with images
4. **Verify** images appear correctly in the PDF

## 🚀 **Expected Results**

After these fixes:
- ✅ **Text replacements working** (already confirmed)
- ✅ **Images loading properly** 
- ✅ **Professional contracts** with ID card and passport photos
- ✅ **Complete automation** without errors

## ⚡ **Quick Alternative: Use Supabase Images Directly**

If Google Drive images still cause issues, try using Supabase URLs directly:

**In Google Docs module, use:**
- **ID_CARD_IMAGE URL**: `{{1.promoter_id_card_url}}`
- **PASSPORT_IMAGE URL**: `{{1.promoter_passport_url}}`

This skips Google Drive entirely and uses your original Supabase images (make sure they're publicly accessible).

The key is fixing the Google Docs template with proper image placeholders first!
