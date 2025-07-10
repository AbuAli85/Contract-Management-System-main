# Google Docs Image Access Fix

## 🚨 **Current Error**
"Invalid requests[12].replaceImage: There was a problem retrieving the image"

## 🔍 **Root Cause**
Google Drive images are not publicly accessible to the Google Docs API.

## ✅ **SOLUTION 1: Fix Image Permissions (Recommended)**

### **Update Google Drive Upload Modules**

**Modules to Update:** ID 4 (ID Card Upload) and ID 5 (Passport Upload)

**Current Settings:**
- Images uploaded to private folder
- Not publicly accessible

**Required Changes:**
1. **Make folder publicly accessible**, OR
2. **Update image URLs to use proper sharing format**

### **Quick Fix - Update Image URLs in Google Docs Module**

**Current URLs:**
```
https://drive.google.com/uc?id={{4.id}}
https://drive.google.com/uc?id={{5.id}}
```

**Fixed URLs (with export parameter):**
```
https://drive.google.com/uc?export=view&id={{4.id}}
https://drive.google.com/uc?export=view&id={{5.id}}
```

## ✅ **SOLUTION 2: Conditional Image Replacement (Safer)**

If images often fail, use conditional logic to only include images when they exist:

**Safe Image URLs:**
```
{{if(4.id != ""; "https://drive.google.com/uc?export=view&id=" + 4.id; "")}}
{{if(5.id != ""; "https://drive.google.com/uc?export=view&id=" + 5.id; "")}}
```

## ✅ **SOLUTION 3: Skip Images Entirely (Fastest)**

For testing purposes, temporarily remove image replacements:

1. **Delete** both image replacement entries
2. **Test** document generation without images
3. **Add images back** once working

## 📋 **Step-by-Step Fix**

### **Immediate Fix (Update URLs):**

1. **Open** Google Docs module
2. **Find** Images Replacement section
3. **Update** both Image URLs:
   - **ID Card**: `https://drive.google.com/uc?export=view&id={{4.id}}`
   - **Passport**: `https://drive.google.com/uc?export=view&id={{5.id}}`
4. **Save** and test

### **Alternative Fix (Make Folder Public):**

1. **Go to** Google Drive folder: `1WoJfPb62ILAKaMT1jEjXH3zwjfkXmg3a`
2. **Right-click** → Share
3. **Change** to "Anyone with the link can view"
4. **Save** sharing settings
5. **Test** scenario again

## 🧪 **Testing Order**

1. **First**: Try the URL fix with `export=view`
2. **If fails**: Make the folder publicly accessible
3. **If still fails**: Remove images temporarily to test core functionality
4. **Last resort**: Use different image hosting or embedding method

## 💡 **Why This Happens**

- **Google Docs API** requires images to be publicly accessible
- **Private Drive folders** block API access
- **URL format** matters for proper image retrieval
- **File permissions** must allow external access

## ✅ **Expected Results**

After fixing:
- ✅ Images load properly in generated documents
- ✅ No more "problem retrieving image" errors
- ✅ Complete document generation
- ✅ Professional-looking contracts with images

Try the URL fix first - it's the quickest solution!
