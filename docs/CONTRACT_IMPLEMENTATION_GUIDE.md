# Contract Generation - Quick Implementation Guide

## 🚀 Quick Start

### Using the Enhanced Form

```tsx
import EnhancedContractGeneratorForm from '@/components/enhanced-contract-generator-form'

// Basic usage
<EnhancedContractGeneratorForm 
  onFormSubmit={() => router.push('/contracts')}
/>

// With advanced features enabled
<EnhancedContractGeneratorForm 
  showAdvanced={true}
  onFormSubmit={handleSuccess}
/>

// For editing existing contracts
<EnhancedContractGeneratorForm 
  contract={existingContract}
  onFormSubmit={() => setIsEditing(false)}
/>
```

### Using Contract Utilities

```tsx
import { 
  analyzeContractDuration, 
  validateContractData,
  exportContractsToCSV 
} from '@/lib/contract-utils'

// Analyze contract duration
const durationAnalysis = analyzeContractDuration(startDate, endDate)
console.log(durationAnalysis.category) // "short-term" | "medium-term" | "long-term"

// Validate form data
const validation = validateContractData(formData)
if (!validation.isValid) {
  console.log('Errors:', validation.errors)
  console.log('Missing:', validation.missingFields)
}

// Export contracts to CSV
const csvData = exportContractsToCSV(contracts)
downloadCSV(csvData, 'contracts-export.csv')
```

## 🔧 Configuration

### Schema Customization

To add new validation rules, update `lib/schema-generator.ts`:

```typescript
export const contractGeneratorSchema = z
  .object({
    // Add new fields
    custom_field: z.string().min(1, "Custom field is required"),
  })
  .refine((data) => {
    // Add custom business rules
    return data.custom_field !== 'invalid_value'
  }, {
    message: "Custom validation message",
    path: ["custom_field"],
  })
```

### Form Sections

To modify form sections, update the `CONTRACT_FORM_SECTIONS` array:

```typescript
export const CONTRACT_FORM_SECTIONS: FormSection[] = [
  {
    id: "custom_section",
    title: "Custom Section",
    description: "Your custom section description",
    required: false,
    fields: ["custom_field"]
  }
]
```

## 🎯 Feature Flags

### Enabling Enhanced Form by Default

In your page component:

```tsx
const [useEnhancedForm, setUseEnhancedForm] = useState(
  process.env.NEXT_PUBLIC_USE_ENHANCED_FORM === 'true'
)
```

### Environment Variables

Add to your `.env.local`:

```bash
# Feature flags
NEXT_PUBLIC_USE_ENHANCED_FORM=true
NEXT_PUBLIC_SHOW_ADVANCED_FIELDS=false

# Contract settings
NEXT_PUBLIC_DEFAULT_CURRENCY=AED
NEXT_PUBLIC_MAX_CONTRACT_DURATION_YEARS=5
NEXT_PUBLIC_DEFAULT_PROBATION_MONTHS=3
```

## 🧪 Testing

### Form Validation Testing

```typescript
import { contractGeneratorSchema } from '@/lib/schema-generator'

describe('Contract Form Validation', () => {
  it('should validate required fields', () => {
    const result = contractGeneratorSchema.safeParse({
      first_party_id: undefined,
      // ... other fields
    })
    
    expect(result.success).toBe(false)
    expect(result.error?.issues).toContainEqual(
      expect.objectContaining({
        message: "Please select Party A (Client)."
      })
    )
  })
  
  it('should validate date ranges', () => {
    const startDate = new Date('2024-01-01')
    const endDate = new Date('2023-12-31') // Invalid: before start
    
    const result = contractGeneratorSchema.safeParse({
      contract_start_date: startDate,
      contract_end_date: endDate,
      // ... other required fields
    })
    
    expect(result.success).toBe(false)
  })
})
```

### Component Testing

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import EnhancedContractGeneratorForm from '@/components/enhanced-contract-generator-form'

describe('Enhanced Contract Form', () => {
  it('should render all sections', () => {
    render(<EnhancedContractGeneratorForm />)
    
    expect(screen.getByText('Contracting Parties')).toBeInTheDocument()
    expect(screen.getByText('Promoter Information')).toBeInTheDocument()
    expect(screen.getByText('Contract Period')).toBeInTheDocument()
  })
  
  it('should show progress indicator', () => {
    render(<EnhancedContractGeneratorForm />)
    
    expect(screen.getByText(/% Complete/)).toBeInTheDocument()
  })
})
```

## 🔍 Debugging

### Common Issues

1. **Schema Validation Errors**
   ```typescript
   // Enable debug mode
   const result = contractGeneratorSchema.safeParse(data)
   if (!result.success) {
     console.log('Validation errors:', result.error.issues)
   }
   ```

2. **Form State Issues**
   ```typescript
   // Debug form state
   console.log('Form values:', form.getValues())
   console.log('Form errors:', form.formState.errors)
   console.log('Form dirty fields:', form.formState.dirtyFields)
   ```

3. **API Integration**
   ```typescript
   // Add request/response logging
   const saveContract = async (data) => {
     console.log('Sending contract data:', data)
     const response = await fetch('/api/contracts', {
       method: 'POST',
       body: JSON.stringify(data)
     })
     console.log('API response:', await response.json())
   }
   ```

## 📱 Mobile Optimization

### Responsive Breakpoints

The enhanced form is optimized for:
- **Mobile**: Single column layout, larger touch targets
- **Tablet**: Two-column layout for efficiency
- **Desktop**: Full multi-column layout with advanced features

### Mobile-Specific Features

- Larger form controls for touch interaction
- Simplified section navigation
- Swipe gestures for section navigation
- Auto-save progress to prevent data loss

## 🔐 Security Considerations

### Input Validation

All form inputs are validated both client-side and server-side:

```typescript
// Client-side validation (Zod schema)
const validation = contractGeneratorSchema.safeParse(formData)

// Server-side validation (API route)
export async function POST(request: NextRequest) {
  const body = await request.json()
  const validation = contractGeneratorSchema.safeParse(body)
  
  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid form data", details: validation.error.issues },
      { status: 400 }
    )
  }
  
  // Process valid data...
}
```

### Data Sanitization

Sensitive data is handled securely:

```typescript
// Auto-filled sensitive data is validated
const sanitizedData = {
  ...formData,
  id_card_number: sanitizeIdNumber(formData.id_card_number),
  email: sanitizeEmail(formData.email),
}
```

## 📊 Analytics Integration

### Form Completion Tracking

```typescript
// Track form progress
const trackFormProgress = (sectionId: string, completeness: number) => {
  analytics.track('contract_form_progress', {
    section: sectionId,
    completion_percentage: completeness,
    timestamp: new Date().toISOString()
  })
}

// Track form submission
const trackFormSubmission = (success: boolean, errors?: string[]) => {
  analytics.track('contract_form_submission', {
    success,
    errors: errors?.length || 0,
    submission_time: Date.now() - formStartTime
  })
}
```

### Performance Monitoring

```typescript
// Monitor form load times
const formLoadStart = performance.now()

useEffect(() => {
  const loadTime = performance.now() - formLoadStart
  analytics.track('contract_form_load_time', { duration: loadTime })
}, [])
```

## 🎨 Customization

### Styling

The form uses Tailwind CSS classes and can be customized:

```tsx
// Custom theme colors
const customTheme = {
  primary: 'bg-blue-600 hover:bg-blue-700',
  secondary: 'bg-gray-200 hover:bg-gray-300',
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white'
}

<EnhancedContractGeneratorForm 
  className="custom-form-styles"
  theme={customTheme}
/>
```

### Field Customization

Add custom field components:

```tsx
// Custom field component
const CustomSalaryField = ({ field, form }) => (
  <FormItem>
    <FormLabel>Salary Range</FormLabel>
    <div className="grid grid-cols-2 gap-4">
      <Input placeholder="Min" {...field} />
      <Input placeholder="Max" {...field} />
    </div>
    <FormMessage />
  </FormItem>
)
```

This guide provides practical examples for implementing and customizing the enhanced contract generation system. For more detailed documentation, refer to the comprehensive analysis document.
