# Fix Make.com Automatic Execution Issue

## Problem
The webhook is working (returns "Accepted"), but Make.com only executes the scenario when you manually press "Run once" instead of automatically triggering when data is received.

## Solution Steps

### 1. Check Webhook Trigger Configuration

1. **Open your Make.com scenario**
2. **Click on the Webhook trigger module** (first module)
3. **Verify these settings**:
   - **"Allow manual execution"** should be ✅ **ENABLED**
   - **"Show data structure"** should be ✅ **ENABLED**
   - **"Webhook URL"** should match your environment variable

### 2. Check Scenario Settings

1. **Click the gear icon** (⚙️) next to your scenario name
2. **Go to "Settings"**
3. **Verify these settings**:
   - **"Status"** should be ✅ **"Active"** (not Paused)
   - **"Execution frequency"** should be set to **"Immediately"**
   - **"Allow manual execution"** should be ✅ **ENABLED**

### 3. Check Webhook Data Structure

1. **In the Webhook trigger module**, click **"Show data structure"**
2. **Click "Add"** to add a sample data structure
3. **Use this sample data**:
\`\`\`json
{
  "contract_id": "test-123",
  "first_party_name_en": "Test Client",
  "first_party_name_ar": "عميل تجريبي",
  "first_party_crn": "123456789",
  "second_party_name_en": "Test Employer",
  "second_party_name_ar": "صاحب عمل تجريبي",
  "second_party_crn": "987654321",
  "promoter_name_en": "Test Promoter",
  "promoter_name_ar": "مروج تجريبي",
  "job_title": "Developer",
  "work_location": "Riyadh",
  "email": "test@example.com",
  "start_date": "2024-01-01",
  "end_date": "2024-12-31",
  "contract_number": "CONTRACT-001",
  "id_card_number": "1234567890",
  "promoter_id_card_url": "https://example.com/id.jpg",
  "promoter_passport_url": "https://example.com/passport.jpg",
  "pdf_url": "https://example.com/contract.pdf"
}
\`\`\`

### 4. Test the Webhook Trigger

1. **Click "Run once"** in the Webhook trigger module
2. **Check if it shows the sample data** in the execution
3. **If it works**, the trigger is configured correctly

### 5. Check for Manual Steps

1. **Review your entire scenario flow**
2. **Look for any modules that require manual approval**:
   - Manual approval steps
   - Decision modules that might be blocking
   - Error handling that stops execution
3. **Remove or bypass any manual intervention steps**

### 6. Alternative: Use HTTP Router

If the webhook trigger still doesn't work automatically, try this alternative:

1. **Replace the Webhook trigger** with an **HTTP Router**
2. **Configure the HTTP Router** to accept POST requests
3. **Set the same URL** as your webhook
4. **Map the incoming data** to your scenario

### 7. Check Make.com Plan Limitations

1. **Verify your Make.com plan** allows automatic webhook execution
2. **Some free plans** have limitations on automatic execution
3. **Check execution limits** in your plan

### 8. Test with Different Payload

Try sending a simpler test payload to see if the issue is with the data structure:

\`\`\`json
{
  "test": "simple",
  "timestamp": "2024-01-01T00:00:00Z"
}
\`\`\`

### 9. Enable Debug Mode

1. **In Make.com scenario settings**, enable **"Debug mode"**
2. **This will show detailed execution logs**
3. **Check the logs** when you send a webhook request

### 10. Check Webhook URL Format

Ensure your webhook URL is in the correct format:
- ✅ `https://hook.eu2.make.com/71go2x4zwsnha4r1f4en1g9gjxpk3ts4`
- ❌ `https://hook.make.com/71go2x4zwsnha4r1f4en1g9gjxpk3ts4` (wrong region)

## Common Issues and Solutions

### Issue 1: Scenario is Paused
**Solution**: Activate the scenario in settings

### Issue 2: Manual Execution Only
**Solution**: Enable "Allow manual execution" in webhook trigger

### Issue 3: Wrong Data Structure
**Solution**: Update the data structure in the webhook trigger

### Issue 4: Plan Limitations
**Solution**: Upgrade Make.com plan or contact support

### Issue 5: Webhook URL Mismatch
**Solution**: Ensure the URL in Make.com matches your environment variable

## Verification Steps

After making changes:

1. **Test the webhook** again:
   \`\`\`bash
   node scripts/test-webhook-config.js
   \`\`\`

2. **Create a test contract** in your application

3. **Check Make.com execution history** to see if it ran automatically

4. **Monitor the logs** for any error messages

## Still Not Working?

If the issue persists:

1. **Contact Make.com support** with your scenario details
2. **Check Make.com community forums** for similar issues
3. **Try creating a new scenario** from scratch
4. **Verify your Make.com account permissions**

## Expected Behavior

When working correctly:
- ✅ Webhook receives data automatically
- ✅ Scenario executes immediately
- ✅ No manual intervention required
- ✅ Execution appears in Make.com history
- ✅ PDF is generated and returned
