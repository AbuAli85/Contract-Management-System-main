# Make.com Blueprint Fix - Google Docs Error Solution

## 🎯 **Problem Fixed**

**Error**: "Failed to map 'name': Function 'replaceAll' not found!"

**Root Cause**: The Google Docs module was using `replaceAll()` which is not supported by Make.com's JavaScript engine.

## ✅ **Solution Applied**

### **Original (Broken) Code:**
\`\`\`javascript
"name": "{{replaceAll(replaceAll(lower(1.contract_number); \"[^a-z0-9_-]\"; \"\"); ; \"_\")}}-{{replaceAll(replaceAll(lower(1.promoter_name_en); \"[^a-z0-9_-]\"; \"\"); ; \"_\")}}.pdf"
\`\`\`

### **Fixed Code:**
\`\`\`javascript
"name": "{{lower(1.contract_number).replace(/[^a-z0-9_-]/g, \"\").replace(/ /g, \"_\")}}-{{lower(1.promoter_name_en).replace(/[^a-z0-9_-]/g, \"\").replace(/ /g, \"_\")}}.pdf"
\`\`\`

## 🔄 **What Changed**

| ❌ **Before (Broken)** | ✅ **After (Fixed)** |
|------------------------|---------------------|
| `replaceAll(...; "pattern"; "replacement")` | `replace(/pattern/g, "replacement")` |
| Uses semicolon syntax | Uses comma syntax |
| Not supported by Make.com | Fully compatible |

## 📋 **How to Apply the Fix**

1. **Download the fixed blueprint**: `Integration Webhooks - FIXED.blueprint.json`
2. **Import it into Make.com**:
   - Go to your Make.com dashboard
   - Click "Create a new scenario"
   - Choose "Import blueprint"
   - Upload the fixed JSON file
3. **Update your connections** (if needed):
   - Webhook connection
   - Google connections
   - Supabase connection
4. **Test the scenario** with a sample contract

## 🧪 **Expected Results**

After applying this fix:
- ✅ **No more Google Docs errors**
- ✅ **No more filter errors** (already fixed in webhook)
- ✅ **Clean, properly formatted document names**
- ✅ **Reliable automation**

## 🔧 **Technical Details**

The fix replaces Make.com incompatible functions with supported alternatives:

- **Function compatibility**: Uses `replace()` with regex instead of `replaceAll()`
- **Regex patterns**: `/[^a-z0-9_-]/g` removes special characters
- **Space handling**: `/ /g` replaces spaces with underscores
- **Chaining**: Multiple `replace()` calls for complex transformations

## 📞 **Support**

If you encounter any issues:
1. **Check connections** are properly configured
2. **Verify webhook URL** is correct
3. **Test with simple data** first
4. **Review execution logs** in Make.com

The scenario should now work without errors!
