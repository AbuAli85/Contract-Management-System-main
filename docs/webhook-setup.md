# Make.com Webhook Setup Guide

## Overview

This document explains how to configure the Make.com webhook for automatic contract PDF generation without manual intervention.

## Recent Changes

### Party Roles Update
- **Party A** = Client (العميل)
- **Party B** = Employer (صاحب العمل)

The form labels have been updated to clearly indicate these roles:
- "Client (Party A)" 
- "Employer (Party B)"

### Automatic Webhook Execution
The webhook has been enhanced with:
- Retry mechanism (3 attempts with exponential backoff)
- 30-second timeout
- Additional headers for better automation
- Better error handling and logging

## Environment Variables

Ensure these variables are set in your `.env.local` file:

\`\`\`env
# Make.com webhook configuration
MAKE_WEBHOOK_URL=https://hook.make.com/your-webhook-url
MAKE_WEBHOOK_SECRET=your-webhook-secret
\`\`\`

## Make.com Scenario Configuration

### 1. Webhook Trigger Setup
1. Create a new scenario in Make.com
2. Add a **Webhook** trigger as the first module
3. Configure the webhook to accept POST requests
4. Copy the webhook URL to your environment variables

### 2. Enable Automatic Execution
1. In your Make.com scenario, go to **Settings**
2. Ensure **"Allow manual execution"** is enabled
3. Set **"Execution frequency"** to **"Immediately"** or **"On webhook"**
4. Make sure the scenario is **Active**

### 3. Webhook Response Configuration
Configure your webhook to return one of these responses:
- `{"success": true, "pdf_url": "https://..."}` (with PDF URL)
- `{"success": true}` (success without URL)
- `"Accepted"` (simple text response)

### 4. Error Handling
- Set up error notifications in Make.com
- Configure retry logic for failed executions
- Monitor webhook execution logs

## Testing the Webhook

Run the test script to verify your configuration:

\`\`\`bash
node scripts/test-webhook-config.js
\`\`\`

This script will:
- Test the webhook URL connectivity
- Send a test payload
- Verify the response
- Check if automatic execution is working

## Troubleshooting

### Webhook Not Executing Automatically
1. Check if the scenario is **Active** in Make.com
2. Verify the webhook URL is correct
3. Ensure the scenario has proper error handling
4. Check Make.com execution logs

### Manual Intervention Required
1. Review the webhook trigger configuration
2. Check if there are any required fields missing
3. Verify the payload format matches expectations
4. Ensure the scenario doesn't have manual approval steps

### Timeout Issues
1. The webhook has a 30-second timeout
2. If your scenario takes longer, consider:
   - Optimizing the scenario
   - Using asynchronous processing
   - Implementing a callback mechanism

## Headers Sent by the Application

The application sends these headers with each webhook request:

\`\`\`
Content-Type: application/json
X-Webhook-Secret: [your-secret]
User-Agent: Contract-Generator-App/1.0
X-Trigger-Source: contract-generator
X-Contract-ID: [contract-id]
X-Timestamp: [iso-timestamp]
\`\`\`

## Payload Structure

The webhook receives this JSON payload:

\`\`\`json
{
  "contract_id": "uuid",
  "first_party_name_en": "Client Company Name",
  "first_party_name_ar": "اسم شركة العميل",
  "first_party_crn": "123456789",
  "second_party_name_en": "Employer Company Name", 
  "second_party_name_ar": "اسم شركة صاحب العمل",
  "second_party_crn": "987654321",
  "promoter_name_en": "Promoter Name",
  "promoter_name_ar": "اسم المروج",
  "job_title": "Software Developer",
  "work_location": "Riyadh, Saudi Arabia",
  "email": "contact@example.com",
  "start_date": "2024-01-01",
  "end_date": "2024-12-31",
  "contract_number": "CONTRACT-2024-001",
  "id_card_number": "1234567890",
  "promoter_id_card_url": "https://...",
  "promoter_passport_url": "https://...",
  "pdf_url": "https://..."
}
\`\`\`

## Monitoring and Logs

- Check the application logs for webhook execution details
- Monitor Make.com scenario execution history
- Set up alerts for failed webhook executions
- Review the retry mechanism logs

## Best Practices

1. **Always test** webhook changes in a development environment first
2. **Monitor** webhook execution times and success rates
3. **Implement** proper error handling in your Make.com scenario
4. **Use** the test script to verify configuration changes
5. **Keep** webhook secrets secure and rotate them regularly
6. **Document** any custom logic in your Make.com scenario
