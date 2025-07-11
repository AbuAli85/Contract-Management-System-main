# Make.com Integration Guide

This guide explains how to set up the integration between your Contract Management System and Make.com for automated document generation.

## Overview

The system uses Make.com (formerly Integromat) to automatically generate contract documents when a new contract is created. The flow works as follows:

1. User creates a contract using the Contract Generator Form
2. System sends contract data to Make.com via webhook
3. Make.com processes the data and generates a document (PDF/DOCX)
4. Make.com sends the document URL back via callback webhook
5. System updates the contract with the document URL

## Setup Instructions

### 1. Environment Variables

Add these to your `.env.local` file:

```env
# Make.com Integration
MAKE_WEBHOOK_URL=https://hook.eu1.make.com/YOUR_WEBHOOK_ID
MAKE_API_KEY=your_make_api_key_here

# Make.com Scenario IDs (one for each template)
NEXT_PUBLIC_MAKE_EMPLOYMENT_SCENARIO_ID=scenario_id_1
NEXT_PUBLIC_MAKE_SERVICE_SCENARIO_ID=scenario_id_2
NEXT_PUBLIC_MAKE_PARTNERSHIP_SCENARIO_ID=scenario_id_3
NEXT_PUBLIC_MAKE_FREELANCE_SCENARIO_ID=scenario_id_4

# Your app URL (for callbacks)
NEXT_PUBLIC_APP_URL=https://your-app.com
```

### 2. Database Setup

Run the migration to add necessary tables and fields:

```sql
-- In Supabase SQL Editor, run:
-- scripts/migrations/004_contract_enhancements.sql
```

### 3. Make.com Scenario Setup

For each contract template, create a Make.com scenario:

#### Scenario Structure:

1. **Webhook Trigger** - Receives contract data
2. **Data Processing** - Format and prepare data
3. **Document Generation** - Use Google Docs/Word template
4. **File Upload** - Upload to cloud storage (Google Drive/Dropbox)
5. **Webhook Response** - Send document URL back

#### Webhook Data Structure:

```json
{
  "contractId": "uuid",
  "templateId": "standard-employment",
  "contractData": {
    "contractNumber": "CNT-202401-0001",
    "firstParty": {
      "id": "uuid",
      "name_en": "Company ABC",
      "name_ar": "شركة أ ب ج",
      "crn": "1234567890"
    },
    "secondParty": {
      "id": "uuid",
      "name_en": "Company XYZ",
      "name_ar": "شركة س ص ع",
      "crn": "0987654321"
    },
    "promoter": {
      "id": "uuid",
      "name_en": "John Doe",
      "name_ar": "جون دو",
      "id_card_number": "1234567890"
    },
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "value": 50000,
    "jobTitle": "Software Developer",
    "workLocation": "Riyadh, Saudi Arabia",
    "metadata": {}
  },
  "callbackUrl": "https://your-app.com/api/webhooks/make/callback"
}
```

#### Callback Structure:

```json
{
  "contractId": "uuid",
  "status": "completed",
  "documentUrl": "https://storage.example.com/contracts/CNT-202401-0001.pdf",
  "processId": "make_process_id"
}
```

### 4. Document Templates

Create document templates in Google Docs or Microsoft Word with placeholders:

```
CONTRACT AGREEMENT

This agreement is made between {{firstParty.name_en}} (First Party)
and {{secondParty.name_en}} (Second Party) on {{contractDate}}.

Promoter: {{promoter.name_en}}
Position: {{jobTitle}}
Location: {{workLocation}}
Duration: {{startDate}} to {{endDate}}
Value: {{contractValue}}

[Rest of contract terms...]
```

### 5. Testing the Integration

1. **Test Webhook Connection**:

   ```bash
   curl -X POST YOUR_MAKE_WEBHOOK_URL \
     -H "Content-Type: application/json" \
     -H "X-API-Key: your_api_key" \
     -d '{"test": true}'
   ```

2. **Create Test Contract**:
   - Go to `/generate-contract`
   - Fill in all fields
   - Select a template
   - Submit the form

3. **Check Webhook Logs**:
   ```sql
   SELECT * FROM webhook_logs
   WHERE source = 'make.com'
   ORDER BY created_at DESC;
   ```

### 6. Error Handling

The system handles various error scenarios:

- **Webhook Timeout**: Continues without document (can be generated later)
- **Invalid Data**: Returns validation error to user
- **Make.com Error**: Logs error and notifies admin
- **Network Issues**: Retries with exponential backoff

### 7. Security Considerations

1. **API Key Validation**: All webhooks require valid API key
2. **HTTPS Only**: Ensure all webhooks use HTTPS
3. **IP Whitelisting**: Consider restricting webhook access to Make.com IPs
4. **Data Encryption**: Sensitive data should be encrypted in transit

### 8. Monitoring

Monitor the integration health:

1. **Check Recent Webhooks**:

   ```sql
   SELECT
     date_trunc('hour', created_at) as hour,
     COUNT(*) as total,
     COUNT(*) FILTER (WHERE status = 'completed') as successful,
     COUNT(*) FILTER (WHERE status = 'failed') as failed
   FROM webhook_logs
   WHERE source = 'make.com'
     AND created_at > NOW() - INTERVAL '24 hours'
   GROUP BY hour
   ORDER BY hour DESC;
   ```

2. **Failed Document Generations**:
   ```sql
   SELECT c.*, w.error
   FROM contracts c
   JOIN webhook_logs w ON w.contract_id = c.id
   WHERE w.status = 'failed'
     AND c.document_url IS NULL
   ORDER BY c.created_at DESC;
   ```

### 9. Manual Document Generation

If automatic generation fails, you can trigger it manually:

```typescript
import { generateContractDocument } from "@/app/actions/contracts"

// In your component or API route
await generateContractDocument(contractId, templateId)
```

### 10. Troubleshooting

**Issue: Webhook not receiving data**

- Check Make.com scenario is active
- Verify webhook URL is correct
- Check API key matches

**Issue: Document not generated**

- Check Make.com scenario logs
- Verify template exists and is accessible
- Check data mapping in scenario

**Issue: Callback not received**

- Verify callback URL is publicly accessible
- Check firewall/security rules
- Review Make.com HTTP module settings

## Support

For issues with:

- **Make.com scenarios**: Check Make.com documentation
- **Database/Supabase**: Review Supabase logs
- **Application code**: Check browser console and server logs
