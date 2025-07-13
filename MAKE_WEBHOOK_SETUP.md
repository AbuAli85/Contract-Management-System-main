# Make.com Webhook Setup Guide

This guide explains how to set up the Make.com webhook integration for automatic contract document generation.

## Overview

The system uses the provided Make.com blueprint which:

1. Receives contract data via webhook
2. Fetches contract details from Supabase
3. Downloads promoter ID card and passport images
4. Uploads images to Google Drive
5. Creates a contract from Google Docs template
6. Exports as PDF
7. Uploads PDF to Supabase storage
8. Updates contract record with PDF URL

## Setup Steps

### 1. Import the Blueprint

1. Go to Make.com and create a new scenario
2. Import the blueprint JSON file
3. The scenario will be created with all modules configured

### 2. Configure Connections

You'll need to set up these connections in Make.com:

#### Supabase Connection

- URL: `https://ekdjxzhujettocosgzql.supabase.co`
- Service Role Key: Your Supabase service role key
- Anon Key: Your Supabase anon key

#### Google Drive Connection

- Connect your Google account
- Grant permissions for Drive access
- Ensure access to the folders specified in the blueprint

### 3. Update Environment Variables

Add to your `.env.local`:

\`\`\`env
# Make.com Webhook URL (from your scenario)
MAKE_CONTRACT_WEBHOOK_URL=https://hook.eu2.make.com/YOUR_WEBHOOK_ID
\`\`\`

### 4. Database Setup

Run the migration to add required columns:

\`\`\`sql
-- In Supabase SQL Editor
-- Run: scripts/update-contracts-table-for-make.sql
\`\`\`

### 5. Google Docs Template

Create a Google Docs template with these placeholders:

- `{{ref_number}}` - Contract number
- `{{first_party_name_en}}` - First party English name
- `{{first_party_name_ar}}` - First party Arabic name
- `{{first_party_crn}}` - First party CRN
- `{{second_party_name_en}}` - Second party English name
- `{{second_party_name_ar}}` - Second party Arabic name
- `{{second_party_crn}}` - Second party CRN
- `{{promoter_name_en}}` - Promoter English name
- `{{promoter_name_ar}}` - Promoter Arabic name
- `{{id_card_number}}` - ID card number
- `{{contract_start_date}}` - Start date (DD-MM-YYYY)
- `{{contract_end_date}}` - End date (DD-MM-YYYY)

For images, add placeholders:

- ID Card: Name the image placeholder `ID_CARD_IMAGE`
- Passport: Name the image placeholder `PASSPORT_IMAGE`

### 6. Folder Structure

Create this folder structure in Google Drive:

\`\`\`
contracts/
├── templates/
│   └── Promoter Contract1 (your template)
├── extra_contracts/
│   └── 2025/
└── documents/ (for uploaded images)
\`\`\`

## Usage

### Generate Contract via UI

1. Create a contract in the system
2. Click "Generate Document" button
3. The system will:
   - Send contract data to Make.com
   - Make.com processes and creates the PDF
   - PDF is uploaded to Supabase storage
   - Contract record is updated with PDF URL

### Generate Contract via API

\`\`\`typescript
// POST /api/contracts/generate/{contractId}
const response = await fetch(`/api/contracts/generate/${contractId}`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
})

const result = await response.json()
// { success: true, pdf_url: "...", contract_id: "..." }
\`\`\`

### Add Generate Button to Contract Page

\`\`\`tsx
import { ContractGenerateButton } from "@/components/contract-generate-button"

;<ContractGenerateButton
  contractId={contract.id}
  contractNumber={contract.contract_number}
  hasDocument={!!contract.pdf_url}
  onSuccess={() => router.refresh()}
/>
\`\`\`

## Webhook Payload Structure

The system sends this payload to Make.com:

\`\`\`json
{
  "contract_id": "uuid",
  "contract_number": "CNT-202501-0001",
  "first_party_name_en": "Company ABC",
  "first_party_name_ar": "شركة أ ب ج",
  "first_party_crn": "1234567890",
  "second_party_name_en": "Company XYZ",
  "second_party_name_ar": "شركة س ص ع",
  "second_party_crn": "0987654321",
  "promoter_name_en": "John Doe",
  "promoter_name_ar": "جون دو",
  "job_title": "Software Developer",
  "work_location": "Riyadh",
  "email": "john@example.com",
  "start_date": "2025-01-01",
  "end_date": "2025-12-31",
  "id_card_number": "1234567890",
  "promoter_id_card_url": "https://...",
  "promoter_passport_url": "https://..."
}
\`\`\`

## Response Structure

Make.com responds with:

\`\`\`json
{
  "success": true,
  "pdf_url": "https://ekdjxzhujettocosgzql.supabase.co/storage/v1/object/public/contracts/CNT-202501-0001-John Doe.pdf",
  "contract_id": "CNT-202501-0001",
  "images_processed": {
    "id_card": true,
    "passport": true
  }
}
\`\`\`

## Troubleshooting

### Webhook Not Triggering

- Check Make.com scenario is active
- Verify webhook URL in environment variables
- Check browser console for errors

### Images Not Processing

- Ensure promoter has valid image URLs
- Check Google Drive permissions
- Verify image URLs are accessible

### PDF Not Generated

- Check Google Docs template exists
- Verify all placeholders match exactly
- Check Make.com scenario history for errors

### Contract Not Updated

- Ensure service role key has permissions
- Check contract_number and is_current fields
- Verify Supabase connection in Make.com

## Testing

1. **Test Webhook Manually**:

\`\`\`bash
curl -X POST YOUR_MAKE_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{
    "contract_number": "TEST-001",
    "first_party_name_en": "Test Company",
    ...
  }'
\`\`\`

2. **Check Make.com History**:

- Go to your scenario
- Click "History" tab
- Review execution details

3. **Verify in Supabase**:

\`\`\`sql
SELECT contract_number, pdf_url, status, document_generated_at
FROM contracts
WHERE contract_number = 'YOUR_CONTRACT_NUMBER';
\`\`\`

## Security Considerations

1. **Service Role Key**: Keep it secure, never expose in client code
2. **Webhook URL**: Consider adding authentication token
3. **Image URLs**: Ensure they're from trusted sources
4. **Google Drive**: Use dedicated service account if possible

## Monitoring

Monitor the integration:

\`\`\`sql
-- Recent document generations
SELECT
  contract_number,
  status,
  pdf_url,
  document_generated_at
FROM contracts
WHERE document_generated_at > NOW() - INTERVAL '24 hours'
ORDER BY document_generated_at DESC;

-- Failed generations
SELECT
  contract_number,
  status,
  created_at
FROM contracts
WHERE status = 'draft'
  AND created_at < NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
\`\`\`
