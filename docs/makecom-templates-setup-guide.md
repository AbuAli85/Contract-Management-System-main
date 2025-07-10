# Make.com Contract Templates - Setup and Usage Guide

## Overview

This system provides automated contract generation using Make.com (formerly Integromat) with Google Docs templates. It supports multiple contract types with Oman Labor Law compliance and automatic PDF generation.

## 🏗️ Architecture

### Components
1. **Contract Type Configuration** (`lib/contract-type-config.ts`)
2. **Make.com Template Configuration** (`lib/makecom-template-config.ts`)
3. **API Endpoints** (`app/api/contracts/makecom/generate/route.ts`)
4. **Management Interface** (`components/makecom-contract-templates.tsx`)
5. **Webhook Integration** (`app/api/webhook/makecom/route.ts`)

### Workflow
```
Contract Creation → Database Storage → Make.com Webhook → Google Docs → PDF Generation → Storage → Database Update
```

## 🔧 Setup Instructions

### 1. Environment Variables

Add these to your `.env.local`:

```bash
# Make.com Integration
MAKECOM_WEBHOOK_URL=https://hook.make.com/your-webhook-id
MAKECOM_API_KEY=your-makecom-api-key

# Google Drive/Docs (configured in Make.com)
GOOGLE_DRIVE_FOLDER_ID=your-google-drive-folder-id
```

### 2. Google Docs Template Setup

#### Step 1: Create Google Docs Templates
1. Create a new Google Doc for each contract type
2. Add placeholders using the format: `{{placeholder_name}}`
3. Copy the document ID from the URL
4. Update the template IDs in `lib/makecom-template-config.ts`

#### Step 2: Available Placeholders

**Employee Information:**
- `{{employee_name_en}}` - Employee name in English
- `{{employee_name_ar}}` - Employee name in Arabic
- `{{employee_id_number}}` - Employee ID card number

**Employer Information:**
- `{{employer_name_en}}` - Company name in English
- `{{employer_name_ar}}` - Company name in Arabic
- `{{employer_crn}}` - Commercial registration number

**Contract Details:**
- `{{contract_number}}` - Unique contract identifier
- `{{job_title}}` - Position title
- `{{department}}` - Department/division
- `{{basic_salary}}` - Monthly basic salary
- `{{currency}}` - Currency code (OMR, AED, USD)
- `{{start_date}}` - Contract start date
- `{{end_date}}` - Contract end date (if applicable)
- `{{work_location}}` - Primary work location

**Example Google Docs Template:**
```
EMPLOYMENT CONTRACT

Contract Number: {{contract_number}}
Date: {{contract_date}}

BETWEEN:
{{employer_name_en}} ({{employer_name_ar}})
Commercial Registration: {{employer_crn}}

AND:
{{employee_name_en}} ({{employee_name_ar}})
ID Number: {{employee_id_number}}

POSITION: {{job_title}}
DEPARTMENT: {{department}}
BASIC SALARY: {{basic_salary}} {{currency}}
START DATE: {{start_date}}
WORK LOCATION: {{work_location}}

[Contract terms and conditions...]
```

### 3. Make.com Scenario Setup

#### Module 1: Webhook Trigger
```json
{
  "webhook": {
    "type": "custom",
    "url": "https://your-domain.com/api/webhook/makecom",
    "method": "POST"
  }
}
```

#### Module 2: HTTP Request (Get Contract Data)
```json
{
  "http": {
    "url": "https://your-domain.com/api/contracts/{{webhook.contract_number}}",
    "method": "GET",
    "headers": {
      "Authorization": "Bearer {{api_key}}"
    }
  }
}
```

#### Module 3: Google Docs (Create from Template)
```json
{
  "google_docs": {
    "operation": "create_document_from_template",
    "template_id": "{{template_config.googleDocsTemplateId}}",
    "variables": {
      "employee_name_en": "{{http.promoter_name_en.trim()}}",
      "employer_name_en": "{{http.first_party_name_en.trim()}}",
      "contract_number": "{{http.contract_number.replace(/[^A-Z0-9]/g, \"\")}}",
      "basic_salary": "{{http.basic_salary}}",
      "currency": "{{http.currency}}",
      "start_date": "{{formatDate(http.start_date, \"DD/MM/YYYY\")}}"
    }
  }
}
```

#### Module 4: Google Docs (Export as PDF)
```json
{
  "google_docs": {
    "operation": "export_document",
    "document_id": "{{google_docs.document_id}}",
    "format": "pdf"
  }
}
```

#### Module 5: Supabase (Upload PDF)
```json
{
  "supabase": {
    "operation": "upload_file",
    "bucket": "contracts",
    "file_data": "{{google_docs_export.data}}",
    "file_name": "{{http.contract_number}}.pdf"
  }
}
```

#### Module 6: HTTP Request (Update Contract)
```json
{
  "http": {
    "url": "https://your-domain.com/api/contracts/{{http.contract_id}}",
    "method": "PATCH",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": {
      "pdf_url": "{{supabase.url}}",
      "status": "completed"
    }
  }
}
```

## 📝 Adding New Contract Types

### 1. Define Template Configuration

Add to `lib/makecom-template-config.ts`:

```typescript
"your-new-contract": {
  id: "your-new-contract",
  name: "Your New Contract Type",
  description: "Description of the contract type",
  category: "Oman Labor Law",
  googleDocsTemplateId: "YOUR_GOOGLE_DOCS_TEMPLATE_ID",
  templatePlaceholders: {
    "{{employee_name}}": "Employee Full Name",
    "{{job_title}}": "Job Position",
    // Add more placeholders
  },
  requiredFields: [
    "first_party_id", "second_party_id", "promoter_id",
    "contract_start_date", "job_title", "basic_salary"
  ],
  businessRules: [
    "Must comply with Oman Labor Law",
    "Specific rule for this contract type"
  ],
  omanCompliant: true,
  allowsSalary: true,
  allowsProbation: true,
  allowsRemoteWork: false,
  makecomModuleConfig: {
    webhookTriggerFields: ["contract_number", "promoter_id"],
    templateVariables: {
      "employee_name": "{{1.promoter_name_en.trim()}}",
      "job_title": "{{1.job_title.trim()}}"
    },
    outputFormat: 'pdf'
  }
}
```

### 2. Add to Enhanced Config

Update `lib/contract-type-config.ts`:

```typescript
"your-new-contract-makecom": {
  id: "your-new-contract-makecom",
  name: "Your New Contract (Make.com Automated)",
  description: "Automated contract with Make.com integration",
  category: "Oman Labor Law",
  // ... other config
  makecomTemplateId: "your-new-contract",
  makecomIntegration: true
}
```

### 3. Create Google Docs Template

1. Create new Google Doc
2. Add required placeholders
3. Format according to Oman labor law requirements
4. Note the document ID
5. Update the `googleDocsTemplateId` in config

### 4. Test the Integration

1. Navigate to `/dashboard/makecom-templates`
2. Select your new contract type
3. Generate and download the blueprint
4. Import the blueprint into Make.com
5. Configure the webhook URL and test

## 🔧 Make.com Functions Reference

### Safe Template Functions
```javascript
// Text replacement (compatible with Make.com)
{{field.replace(/ /g, "_")}}           // Replace spaces with underscores
{{field.replace(/[^a-zA-Z0-9]/g, "")}} // Remove special characters
{{field.trim()}}                       // Remove whitespace
{{field.toUpperCase()}}                // Convert to uppercase

// Date formatting
{{formatDate(date_field, "DD/MM/YYYY")}}
{{formatDate(date_field, "YYYY-MM-DD")}}

// Number formatting
{{round(number_field)}}
{{parseFloat(text_field)}}

// Conditional logic
{{if(condition, true_value, false_value)}}
```

### Avoid These Functions
❌ `replaceAll()` - Not supported in Make.com
❌ `includes()` - Use `indexOf() > -1` instead
❌ Arrow functions - Use regular functions

## 🚀 Usage

### From the Application

1. **Navigate to Contract Generation**
   - Go to `/generate-contract`
   - Select a Make.com enabled contract type
   - Fill in the required fields
   - Submit the form

2. **Automatic Processing**
   - Contract is created in database
   - Make.com webhook is triggered
   - Google Docs template is populated
   - PDF is generated and stored
   - Contract is updated with PDF URL

### From the Management Interface

1. **Navigate to Template Management**
   - Go to `/dashboard/makecom-templates`
   - Select contract type to manage
   - View template configuration
   - Generate Make.com blueprints
   - Test the integration

### API Usage

```javascript
// Generate contract with Make.com
const response = await fetch('/api/contracts/makecom/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contractType: 'oman-unlimited-makecom',
    contractData: {
      first_party_id: 'company-id',
      second_party_id: 'employer-id', 
      promoter_id: 'employee-id',
      contract_start_date: '2025-01-01',
      job_title: 'Software Engineer',
      basic_salary: 2500,
      currency: 'OMR'
    },
    triggerMakecom: true
  })
})
```

## 🐛 Troubleshooting

### Common Issues

1. **Template Variables Not Replacing**
   - Check placeholder syntax: `{{variable_name}}`
   - Ensure variables are defined in makecomModuleConfig
   - Verify data is being passed correctly in webhook

2. **Make.com Webhook Not Triggering**
   - Check MAKECOM_WEBHOOK_URL environment variable
   - Verify webhook is active in Make.com
   - Check webhook logs in Make.com dashboard

3. **PDF Generation Fails**
   - Verify Google Docs template ID is correct
   - Check Google Drive permissions
   - Ensure all required placeholders are provided

4. **Contract Validation Errors**
   - Check required fields in contract configuration
   - Verify business rule compliance
   - Review Oman labor law requirements

### Debugging Steps

1. **Check API Response**
   ```bash
   curl -X GET "https://your-domain.com/api/contracts/makecom/generate?action=types"
   ```

2. **Test Template Configuration**
   ```bash
   curl -X GET "https://your-domain.com/api/contracts/makecom/generate?action=template&type=oman-unlimited-makecom"
   ```

3. **Validate Contract Data**
   - Use the validation functions in the API
   - Check browser console for errors
   - Review Make.com execution logs

## 📊 Monitoring and Analytics

### Contract Generation Metrics
- Success/failure rates
- Processing times
- Template usage statistics
- Error patterns

### Make.com Monitoring
- Webhook trigger frequency
- Execution success rates
- Error logs and debugging
- Performance metrics

This system provides a robust foundation for automated contract generation with Make.com, ensuring Oman labor law compliance while maintaining flexibility for different contract types.
