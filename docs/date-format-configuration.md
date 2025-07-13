# 📅 Date Format Configuration Guide

## Current Requirement
**Change date format from:** `2025-07-04` (yyyy-mm-dd)  
**To:** `04-07-2025` (dd-mm-yyyy)

## Make.com Module 6 Update

### Current Configuration Check
In your Google Docs module (Module 6), locate these text replacement entries:

\`\`\`json
{
    "text": "contract_start_date",
    "replaceText": "{{formatDate(1.start_date; \"DD-MM-YYYY\")}}"
},
{
    "text": "contract_end_date",
    "replaceText": "{{formatDate(1.end_date; \"DD-MM-YYYY\")}}"
}
\`\`\`

### ✅ Correct Format String
The format `"DD-MM-YYYY"` should produce: `04-07-2025`

### 🔧 If Not Working, Try These Alternatives:

**Option 1: Explicit parsing**
\`\`\`json
"replaceText": "{{formatDate(parseDate(1.start_date; \"YYYY-MM-DD\"); \"DD-MM-YYYY\")}}"
\`\`\`

**Option 2: Different format codes**
\`\`\`json
"replaceText": "{{formatDate(1.start_date; \"dd-MM-yyyy\")}}"
\`\`\`

**Option 3: Manual string manipulation**
\`\`\`json
"replaceText": "{{substring(1.start_date; 8; 2)}}-{{substring(1.start_date; 5; 2)}}-{{substring(1.start_date; 0; 4)}}"
\`\`\`

## Quick Fix Steps

### Step 1: Open Module 6 in Make.com
1. Click on the Google Docs module
2. Scroll to the "Values" section
3. Find the date replacement entries

### Step 2: Update Date Format
Replace the date formatting with:
\`\`\`
contract_start_date: {{formatDate(1.start_date; "DD-MM-YYYY")}}
contract_end_date: {{formatDate(1.end_date; "DD-MM-YYYY")}}
\`\`\`

### Step 3: Test the Changes
1. Save the module
2. Run the scenario
3. Check the generated document
4. Verify dates show as `04-07-2025`

## Expected Input/Output

**Webhook Input:**
\`\`\`json
{
    "start_date": "2025-07-04",
    "end_date": "2027-07-04"
}
\`\`\`

**Document Output:**
\`\`\`
Contract Start Date: 04-07-2025
Contract End Date: 04-07-2027
\`\`\`

## Troubleshooting

### If dates still show as yyyy-mm-dd:
1. **Check webhook data format** - ensure dates are strings
2. **Verify module mapping** - confirm correct field references
3. **Test format string** - try different format codes
4. **Check template placeholders** - ensure correct text in Google Docs

### Alternative Format Codes:
- `DD-MM-YYYY` → 04-07-2025
- `dd-MM-yyyy` → 04-07-2025
- `D-M-YYYY` → 4-7-2025 (no leading zeros)

**The key is ensuring your Google Docs module uses the correct `formatDate()` function with `"DD-MM-YYYY"` format string.**
