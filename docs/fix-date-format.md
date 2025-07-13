# 🗓️ Fix Date Format in Make.com Scenario

## Current Issue
Dates are being formatted as `yyyy-mm-dd` but need to be `dd-mm-yyyy`

**Example:**
- Current: `2025-07-04` to `2027-07-04`
- Required: `04-07-2025` to `04-07-2027`

## Where to Fix This

### Module 6 (Google Docs) - Text Replacements
In your Google Docs module, you have these date formatting fields:

**Current (incorrect):**
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

**This is actually CORRECT!** The format `"DD-MM-YYYY"` should produce `04-07-2025`.

## Possible Issues and Solutions

### Issue 1: Input Date Format
If your webhook is sending dates as `2025-07-04`, Make.com should parse them correctly.

### Issue 2: Webhook Date Fields
Check your webhook response format. Currently your webhook uses:
- `start_date`: "2025-07-04"
- `end_date`: "2027-07-04"

### Issue 3: Make.com Module Configuration
Verify the Google Docs module is using the correct format string.

## Step-by-Step Fix

### Step 1: Verify Current Format in Module 6
1. Open Module 6 (Google Docs) in your scenario
2. Look for the "requests" section
3. Find the date replacement entries
4. Ensure they use: `{{formatDate(1.start_date; "DD-MM-YYYY")}}`

### Step 2: Test Date Formatting
Try these format variations if needed:
- `"DD-MM-YYYY"` → 04-07-2025
- `"dd-mm-yyyy"` → 04-07-2025  
- `"D-M-YYYY"` → 4-7-2025

### Step 3: Webhook Input Format
If dates come from your webhook as strings, ensure they're recognizable:
- ✅ "2025-07-04" (ISO format)
- ✅ "2025/07/04"
- ✅ "04-07-2025"

## Blueprint Update

Your Module 6 should have:

\`\`\`json
"requests": [
    {
        "text": "contract_start_date",
        "replaceText": "{{formatDate(1.start_date; \"DD-MM-YYYY\")}}"
    },
    {
        "text": "contract_end_date",
        "replaceText": "{{formatDate(1.end_date; \"DD-MM-YYYY\")}}"
    }
]
\`\`\`

## Alternative: Parse Date First

If the current format isn't working, try:

\`\`\`json
{
    "text": "contract_start_date",
    "replaceText": "{{formatDate(parseDate(1.start_date; \"YYYY-MM-DD\"); \"DD-MM-YYYY\")}}"
}
\`\`\`

## Expected Results

After fixing:
- **Input**: `2025-07-04`
- **Output in Document**: `04-07-2025`

## Quick Test

1. Update the date format in Module 6
2. Run the scenario
3. Check the generated document for correct date format
4. Verify dates appear as `04-07-2025` to `04-07-2027`

**The format string `"DD-MM-YYYY"` should give you the desired `dd-mm-yyyy` format!**
