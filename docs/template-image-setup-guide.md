# 📋 Google Docs Template Image Setup - Visual Guide

## Error: `The object with ID ID_CARD_IMAGE could not be found`

### This means your Google Docs template needs image placeholders!

## Quick Setup Instructions

### 1. Open Your Google Docs Template

### 2. Add First Image Placeholder (ID Card)
\`\`\`
Step 1: Click where you want the ID card image
Step 2: Insert → Image → Upload from computer (or Search the web)
Step 3: Choose any temporary image
Step 4: Right-click the inserted image
Step 5: Select "Alt text"
Step 6: Enter exactly: ID_CARD_IMAGE
Step 7: Click Apply
\`\`\`

### 3. Add Second Image Placeholder (Passport)
\`\`\`
Step 1: Click where you want the passport image  
Step 2: Insert → Image → Upload from computer (or Search the web)
Step 3: Choose any temporary image
Step 4: Right-click the inserted image
Step 5: Select "Alt text"
Step 6: Enter exactly: PASSPORT_IMAGE
Step 7: Click Apply
\`\`\`

### 4. Template Example Layout
\`\`\`
CONTRACT AGREEMENT

Promoter: {{promoter_name_en}}
Contract #: {{contract_number}}

ID CARD IMAGE:
[Image with Alt text: ID_CARD_IMAGE]

PASSPORT IMAGE:  
[Image with Alt text: PASSPORT_IMAGE]

Contract Details:
Start Date: {{start_date}}
End Date: {{end_date}}
Position: {{job_title}}
Location: {{work_location}}
\`\`\`

## Critical Requirements

### ✅ Must Have:
- **Actual images inserted** (not just text)
- **Exact Alt text**: `ID_CARD_IMAGE` and `PASSPORT_IMAGE`
- **Case sensitive** - all caps with underscores
- **No extra spaces** in Alt text

### ❌ Won't Work:
- Text saying "Image goes here"
- Wrong Alt text like `id_card_image` or `ID CARD IMAGE`
- No Alt text set
- Missing image placeholders

## Quick Test
1. Right-click each image in your template
2. Select "Alt text"  
3. Should show exactly `ID_CARD_IMAGE` or `PASSPORT_IMAGE`
4. If not, update the Alt text

## After Adding Placeholders
- Save your Google Docs template
- Run Make.com scenario again
- Error should be resolved
- Images should appear in generated documents

**The template needs actual image objects with specific Alt text for Make.com to replace them!**
