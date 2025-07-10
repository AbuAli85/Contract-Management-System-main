# QUICK MAKE.COM FIX - Copy & Paste Solution

## 🚨 **Current Error**
"Invalid IML for parameter" - caused by `replaceAll` function not being supported

## ✅ **INSTANT FIX**

### **Option 1: Simple Title (Recommended)**
Copy and paste this into your Google Docs "Title" field:
```
{{1.contract_number}}-{{1.promoter_name_en}}.pdf
```

### **Option 2: Advanced Title (with cleaning)**
If you want extra cleaning, use this:
```
{{lower(1.contract_number).replace(/[^a-z0-9_-]/g, "").replace(/ /g, "_")}}-{{lower(1.promoter_name_en).replace(/[^a-z0-9_-]/g, "").replace(/ /g, "_")}}.pdf
```

## 📋 **Step-by-Step Instructions**

1. **Click** on your Google Docs module (the one with the red error)
2. **Find** the "Title" field
3. **Delete** everything in the Title field
4. **Copy & paste** one of the solutions above
5. **Click "Save"**
6. **Test** your scenario

## 🧪 **Expected Results**

After the fix:
- ✅ No more "Invalid IML" errors
- ✅ No more "replaceAll not found" errors
- ✅ Clean document titles like: `CNT-2024-001-John_Doe.pdf`
- ✅ Working automation

## 💡 **Why This Works**

- **Option 1**: Uses your webhook's already-clean data (simplest)
- **Option 2**: Adds extra cleaning using Make.com-compatible `replace()` function
- **Both**: Avoid the unsupported `replaceAll()` function

## 🔧 **If You Still Get Errors**

1. **Check** that you're editing the correct field (Title/Name)
2. **Ensure** you copied the exact text above
3. **Save** the module after making changes
4. **Test** with a simple contract first

The fix should work immediately!
