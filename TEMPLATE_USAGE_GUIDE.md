# Contract Template Usage Guide

This guide explains how to use the template-based contract generation system.

## Overview

The template system allows you to:

1. Select from predefined contract templates
2. Show/hide form fields based on the selected template
3. Automatically generate documents via Make.com integration
4. Store template-specific metadata in Supabase

## How It Works

### 1. Template Selection Flow

The new contract generation flow has two steps:

**Step 1: Template Selection**

- User sees all available templates
- Each template shows its category, description, and features
- User selects a template and clicks "Continue"

**Step 2: Form Filling**

- Form dynamically shows only fields required by the selected template
- Required fields are marked with red asterisks (\*)
- Form validation adapts to the template requirements

### 2. Template Configuration

Templates are stored in the `contract_templates` table with these fields:

```typescript
{
  id: string                    // Unique identifier
  name: string                  // Display name
  description: string           // Brief description
  category: string              // Template category
  fields: string[]              // Array of required fields
  make_scenario_id: string      // Make.com scenario ID
  document_url: string          // Template document URL
  metadata: object              // Additional settings
  is_active: boolean            // Enable/disable template
}
```

### 3. Field Mapping

Each template defines which fields are required:

**Standard Employment Contract:**

- first_party_id (required)
- second_party_id (required)
- promoter_id (required)
- contract_start_date (required)
- contract_end_date (required)
- contract_value (required)
- job_title (required)
- work_location (required)

**Service Agreement:**

- All employment fields plus:
- deliverables (required)
- payment_terms (required)

**Partnership Agreement:**

- first_party_id (required)
- second_party_id (required)
- contract_start_date (required)
- contract_end_date (required)
- profit_share_percentage (optional)
- capital_contribution (optional)
- responsibilities (optional)

**Freelance Contract:**

- All employment fields plus:
- hourly_rate (required)
- project_scope (required)
- max_hours (optional)

### 4. Using the Template-Based Form

#### Option 1: Replace Existing Form

Update your existing contract generation page:

```typescript
// In app/generate-contract/page.tsx
import ContractGeneratorFormWithTemplate from "@/components/contract-generator-form-with-template"

export default function GenerateContractPage() {
  return (
    <div className="container max-w-5xl py-8">
      <ContractGeneratorFormWithTemplate />
    </div>
  )
}
```

#### Option 2: Use New Route

Access the template-based form at `/generate-contract-v2`:

```typescript
// Already created at app/generate-contract-v2/page.tsx
```

### 5. Adding New Templates

#### Step 1: Add to Database

```sql
INSERT INTO contract_templates (
  id,
  name,
  description,
  category,
  fields,
  make_scenario_id,
  metadata
) VALUES (
  'nda-agreement',
  'Non-Disclosure Agreement',
  'Confidentiality agreement for protecting sensitive information',
  'legal',
  '["first_party_id", "second_party_id", "contract_start_date", "contract_end_date", "confidentiality_period", "scope_of_information"]',
  'your_make_scenario_id',
  '{"confidentiality_period_default": "2 years"}'
);
```

#### Step 2: Update Template Features

In `contract-template-selector.tsx`, add features:

```typescript
const templateFeatures = {
  // ... existing templates
  "nda-agreement": [
    "Confidentiality clauses",
    "Information scope definition",
    "Duration of confidentiality",
    "Permitted disclosures",
    "Legal remedies",
  ],
}
```

#### Step 3: Update Form Schema

In `contract-generator-form-with-template.tsx`, add field validation:

```typescript
if (template?.fields.includes("confidentiality_period")) {
  templateFields.confidentiality_period = z.string().min(1, "Confidentiality period is required")
}

if (template?.fields.includes("scope_of_information")) {
  templateFields.scope_of_information = z.string().min(1, "Information scope is required")
}
```

### 6. Make.com Integration

Each template should have a corresponding Make.com scenario that:

1. Receives the webhook with contract data
2. Uses the template document (Google Docs/Word)
3. Replaces placeholders with actual data
4. Generates PDF/DOCX
5. Uploads to storage
6. Sends callback with document URL

### 7. Template Management

#### View Active Templates

```sql
SELECT * FROM contract_templates WHERE is_active = true;
```

#### Disable a Template

```sql
UPDATE contract_templates
SET is_active = false
WHERE id = 'template-id';
```

#### Update Template Fields

```sql
UPDATE contract_templates
SET fields = '["first_party_id", "second_party_id", "new_field"]'
WHERE id = 'template-id';
```

### 8. Testing Templates

1. **Create Test Template:**

   ```sql
   INSERT INTO contract_templates (id, name, description, category, fields)
   VALUES ('test-template', 'Test Template', 'For testing', 'test', '["first_party_id", "second_party_id"]');
   ```

2. **Test Form Behavior:**
   - Go to `/generate-contract-v2`
   - Select the test template
   - Verify only specified fields appear
   - Submit and check data in Supabase

3. **Test Make.com Integration:**
   - Ensure Make.com scenario is active
   - Submit a contract with the template
   - Check webhook logs
   - Verify document generation

### 9. Troubleshooting

**Template not appearing:**

- Check `is_active = true` in database
- Verify user has permission to view templates
- Check browser console for errors

**Fields not showing correctly:**

- Verify field names in template's `fields` array
- Check form schema includes the field
- Ensure field component is implemented

**Document not generating:**

- Check Make.com scenario is active
- Verify `make_scenario_id` is correct
- Review webhook logs for errors
- Check Make.com scenario history

### 10. Best Practices

1. **Template Naming:**
   - Use descriptive IDs (kebab-case)
   - Clear, concise display names
   - Detailed descriptions

2. **Field Management:**
   - Only include necessary fields
   - Group related fields
   - Use consistent field names

3. **Validation:**
   - Set appropriate validation rules
   - Provide helpful error messages
   - Consider field dependencies

4. **Documentation:**
   - Document each template's purpose
   - List all required fields
   - Provide example data

## Example Usage

```typescript
// Using the template selector component
import { ContractTemplateSelector } from "@/components/contract-template-selector"

function MyComponent() {
  const [selectedTemplate, setSelectedTemplate] = useState(null)

  return (
    <ContractTemplateSelector
      onSelectTemplate={(template) => {
        console.log("Selected:", template)
        setSelectedTemplate(template)
      }}
      selectedTemplateId={selectedTemplate?.id}
    />
  )
}
```

## Summary

The template system provides:

- Dynamic form generation based on templates
- Integration with Make.com for document generation
- Flexible field configuration
- Easy template management
- Consistent user experience

This allows you to quickly add new contract types without modifying code, just by adding templates to the database and creating corresponding Make.com scenarios.
