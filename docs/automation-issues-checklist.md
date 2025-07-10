# Automation Issues Checklist

## What Does "Not Fully Automated" Mean?

Please check which of these issues you're experiencing:

### 🔄 **Webhook Trigger Issues**
- [ ] Webhook doesn't trigger automatically when contract is created
- [ ] Webhook triggers but scenario doesn't execute
- [ ] Webhook triggers but scenario fails to complete
- [ ] Webhook triggers but requires manual approval

### 📄 **PDF Generation Issues**
- [ ] PDF is not being generated at all
- [ ] PDF is generated but not returned to the application
- [ ] PDF URL is not being saved to the database
- [ ] PDF generation takes too long and times out

### 🗄️ **Database Issues**
- [ ] Contract is not being saved to database
- [ ] Contract is saved but PDF URL is missing
- [ ] Contract data is incomplete or incorrect
- [ ] Database errors occur during contract creation

### 🔐 **Authentication/Authorization Issues**
- [ ] Make.com scenario requires manual login
- [ ] Google Docs API authentication fails
- [ ] File upload permissions are missing
- [ ] API keys are expired or invalid

### ⏱️ **Timing Issues**
- [ ] Scenario takes too long to execute
- [ ] Application times out waiting for response
- [ ] Retry mechanism doesn't work properly
- [ ] Webhook response is delayed

### 📊 **Data Flow Issues**
- [ ] Data is not being passed correctly to Make.com
- [ ] Required fields are missing
- [ ] Data format is incorrect
- [ ] Arabic characters are not handled properly

## Quick Diagnostic Questions

### 1. **When you create a contract through your application:**
- Does the contract get saved to the database? ✅/❌
- Does the webhook get triggered? ✅/❌
- Does Make.com execute the scenario? ✅/❌
- Is a PDF generated? ✅/❌
- Is the PDF URL saved back to the database? ✅/❌

### 2. **In Make.com execution history:**
- Do you see executions when contracts are created? ✅/❌
- Are there any error messages? ✅/❌
- Do executions complete successfully? ✅/❌
- Are PDFs being generated? ✅/❌

### 3. **In your application logs:**
- Are there any error messages? ✅/❌
- Does the webhook call succeed? ✅/❌
- Is the PDF URL being returned? ✅/❌

## Common Automation Blockers

### 1. **Make.com Scenario Configuration**
- **Issue**: Scenario is paused or not configured for automatic execution
- **Solution**: Activate scenario and enable automatic execution

### 2. **Data Validation**
- **Issue**: Make.com scenario has required fields that are missing
- **Solution**: Update data structure or make fields optional

### 3. **Authentication**
- **Issue**: Google Docs API or other services require re-authentication
- **Solution**: Re-authenticate connections in Make.com

### 4. **Error Handling**
- **Issue**: Scenario fails on certain data and stops execution
- **Solution**: Add proper error handling and retry logic

### 5. **Timeout Issues**
- **Issue**: PDF generation takes longer than expected
- **Solution**: Increase timeout values or optimize scenario

## Debugging Steps

### Step 1: Run Comprehensive Test
\`\`\`bash
node scripts/debug-webhook-execution.js
\`\`\`

### Step 2: Check Make.com Execution History
1. Go to your Make.com scenario
2. Check "Execution history" tab
3. Look for recent executions
4. Check for error messages

### Step 3: Test Manual Execution
1. Click "Run once" on webhook trigger
2. See if it processes the data correctly
3. Check if PDF is generated

### Step 4: Check Application Logs
1. Look for webhook call logs
2. Check for database errors
3. Verify PDF URL updates

### Step 5: Test with Real Contract
1. Create a real contract through your application
2. Monitor the entire process
3. Identify where it fails

## Specific Issues and Solutions

### Issue: "Webhook triggers but no PDF generated"
**Possible Causes:**
- Google Docs API authentication expired
- Template ID is incorrect
- Required fields missing in template
- File permissions issue

**Solutions:**
- Re-authenticate Google Docs connection
- Verify template ID and structure
- Check all required fields are provided
- Verify file permissions

### Issue: "PDF generated but not saved to database"
**Possible Causes:**
- Make.com doesn't return PDF URL
- Application doesn't handle response correctly
- Database update fails

**Solutions:**
- Configure Make.com to return PDF URL
- Check response handling in application
- Verify database update logic

### Issue: "Scenario executes but fails to complete"
**Possible Causes:**
- Missing required data
- API rate limits
- Network timeouts
- Authentication issues

**Solutions:**
- Add error handling in Make.com scenario
- Check all required data is provided
- Increase timeout values
- Re-authenticate connections

## Next Steps

1. **Run the debug script** to identify specific issues
2. **Check the checklist** above to pinpoint problems
3. **Review Make.com execution history** for error messages
4. **Test with real contract creation** to see the full flow
5. **Update configuration** based on findings

## Need More Help?

If you can't identify the specific issue:
1. Share the results of the debug script
2. Tell us which checklist items are failing
3. Share any error messages from Make.com or your application
4. Describe exactly what happens when you create a contract
