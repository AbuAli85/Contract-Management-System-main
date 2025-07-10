/**
 * Test script to validate the webhook response format for Make.com compatibility
 * This simulates the response structure to identify potential .split() issues
 */

// Simulate the response structure from our webhook
function createMockWebhookResponse() {
  const mockPayload = {
    contract_number: "CNT-2024-001",
    promoter_name_en: "John Smith",
    promoter_name_ar: "جون سميث",
    promoter_id_card_url: "https://example.com/id-card.jpg",
    promoter_passport_url: "https://example.com/passport.jpg",
    first_party_name_en: "ABC Company",
    first_party_name_ar: "شركة ABC",
    first_party_crn: "12345678",
    second_party_name_en: "XYZ Corp",
    second_party_name_ar: "شركة XYZ",
    second_party_crn: "87654321",
    id_card_number: "123456789",
    start_date: "2024-01-01",
    end_date: "2024-12-31",
    job_title: "Software Developer",
    work_location: "Riyadh",
    contract_value: "50000",
    email: "john@example.com"
  }

  // Simulate the updated webhook response format (with all string fields guaranteed)
  const response = {
    // Core contract data that Make.com blueprint expects
    contract_number: mockPayload.contract_number || "",
    promoter_name_en: mockPayload.promoter_name_en || "",
    promoter_name_ar: mockPayload.promoter_name_ar || mockPayload.promoter_name_en || "",
    promoter_id_card_url: mockPayload.promoter_id_card_url || "",
    promoter_passport_url: mockPayload.promoter_passport_url || "",
    first_party_name_en: mockPayload.first_party_name_en || "",
    first_party_name_ar: mockPayload.first_party_name_ar || mockPayload.first_party_name_en || "",
    first_party_crn: mockPayload.first_party_crn || "",
    second_party_name_en: mockPayload.second_party_name_en || "",
    second_party_name_ar: mockPayload.second_party_name_ar || mockPayload.second_party_name_en || "",
    second_party_crn: mockPayload.second_party_crn || "",
    id_card_number: mockPayload.id_card_number || "",
    start_date: mockPayload.start_date || "",
    end_date: mockPayload.end_date || "",
    job_title: mockPayload.job_title || "",
    work_location: mockPayload.work_location || "",
    email: mockPayload.email || "",
    contract_value: mockPayload.contract_value ? parseFloat(mockPayload.contract_value.toString()) : 0,
    
    // Status and tracking fields
    status: "active",
    pdf_url: "",
    
    // Response metadata for Make.com processing
    success: true,
    contract_id: mockPayload.contract_number || "",
    contract_uuid: "550e8400-e29b-41d4-a716-446655440000",
    message: "Contract created successfully",
    
    // Additional data for blueprint processing
    is_current: true,
    
    // Party and promoter IDs for internal tracking
    promoter_id: "550e8400-e29b-41d4-a716-446655440001",
    first_party_id: "550e8400-e29b-41d4-a716-446655440002",
    second_party_id: "550e8400-e29b-41d4-a716-446655440003",
    
    // Image processing status
    images_processed: {
      id_card: !!mockPayload.promoter_id_card_url,
      passport: !!mockPayload.promoter_passport_url
    }
  }

  return response
}

function validateResponseFormat() {
  console.log("🧪 Validating Make.com webhook response format...")
  
  const response = createMockWebhookResponse()
  
  console.log("\n📥 Mock Response Structure:")
  console.log(JSON.stringify(response, null, 2))
  
  // Check for fields that might be null/undefined but expected as strings
  const stringFields = [
    'contract_number',
    'promoter_name_en', 
    'promoter_name_ar',
    'first_party_name_en',
    'first_party_name_ar', 
    'first_party_crn',
    'second_party_name_en',
    'second_party_name_ar',
    'second_party_crn',
    'id_card_number',
    'start_date',
    'end_date',
    'job_title',
    'work_location',
    'email',
    'contract_id',
    'contract_uuid',
    'promoter_id',
    'first_party_id',
    'second_party_id',
    'status',
    'pdf_url'
  ]
  
  console.log("\n📋 String field validation:")
  let allFieldsValid = true
  
  stringFields.forEach(field => {
    const value = response[field]
    const type = typeof value
    const isString = type === 'string'
    const hasDefinedValue = value !== null && value !== undefined
    
    console.log(`  ${field}: "${value}" (${type}) - ${isString && hasDefinedValue ? '✅' : '❌'}`)
    
    if (!isString || !hasDefinedValue) {
      console.log(`    ❌ Error: ${field} is ${type} with value '${value}' - WILL cause .split() error`)
      allFieldsValid = false
    }
  })
  
  // Test simulated .split() operations on string fields
  console.log("\n🧪 Simulating .split() operations that Make.com might perform:")
  
  const splitTests = [
    { field: 'contract_number', operation: 'split("-")' },
    { field: 'promoter_name_en', operation: 'split(" ")' },
    { field: 'first_party_name_en', operation: 'split(" ")' },
    { field: 'second_party_name_en', operation: 'split(" ")' },
    { field: 'start_date', operation: 'split("-")' },
    { field: 'end_date', operation: 'split("-")' },
    { field: 'id_card_number', operation: 'split("")' },
    { field: 'first_party_crn', operation: 'split("")' },
    { field: 'second_party_crn', operation: 'split("")' }
  ]
  
  splitTests.forEach(test => {
    const value = response[test.field]
    try {
      if (value && typeof value === 'string') {
        // Test the split operation
        const delimiter = test.operation.match(/split\("(.*)"\)/)[1]
        const result = value.split(delimiter)
        console.log(`  ✅ ${test.field}.${test.operation} → [${result.join(', ')}]`)
      } else {
        console.log(`  ❌ ${test.field}.${test.operation} would fail: (${typeof value}: '${value}')`)
        allFieldsValid = false
      }
    } catch (error) {
      console.log(`  ❌ ${test.field}.${test.operation} error: ${error.message}`)
      allFieldsValid = false
    }
  })
  
  // Check for required Make.com fields
  const requiredFields = [
    'success', 'contract_id', 'contract_uuid', 'status', 'pdf_url',
    'images_processed'
  ]
  
  console.log("\n📋 Required Make.com fields validation:")
  requiredFields.forEach(field => {
    const hasField = response.hasOwnProperty(field)
    console.log(`  ${field}: ${hasField ? '✅' : '❌'}`)
    
    if (!hasField) {
      console.log(`    ❌ Missing required field: ${field}`)
      allFieldsValid = false
    }
  })
  
  console.log(`\n${allFieldsValid ? '✅' : '❌'} Overall validation: ${allFieldsValid ? 'PASS' : 'FAIL'}`)
  
  if (allFieldsValid) {
    console.log("\n🎉 Response format is compatible with Make.com blueprint!")
    console.log("   All string fields are properly defined and will not cause .split() errors.")
  } else {
    console.log("\n⚠️  Response format has issues that may cause Make.com errors!")
    console.log("   Fix the fields marked with ❌ to prevent .split() errors.")
  }
  
  return allFieldsValid
}

// Test different scenarios
function testEdgeCases() {
  console.log("\n🔬 Testing edge cases...")
  
  // Test with null/undefined values
  const edgeCaseFields = {
    contract_number: null,
    promoter_name_en: undefined,
    first_party_crn: "",
    start_date: null
  }
  
  console.log("\n📋 Testing with problematic values:")
  Object.entries(edgeCaseFields).forEach(([field, value]) => {
    try {
      if (value && typeof value === 'string') {
        const result = value.split('-')
        console.log(`  ✅ ${field} (${value}).split('-') → OK`)
      } else {
        console.log(`  ❌ ${field} (${typeof value}: '${value}').split('-') → Would fail`)
      }
    } catch (error) {
      console.log(`  ❌ ${field}.split('-') error: ${error.message}`)
    }
  })
}

// Run the validation
console.log("🚀 Starting Make.com webhook response validation...\n")

try {
  const isValid = validateResponseFormat()
  testEdgeCases()
  
  console.log("\n" + "=".repeat(60))
  console.log(`📊 FINAL RESULT: ${isValid ? 'COMPATIBLE' : 'NEEDS FIXES'}`)
  console.log("=".repeat(60))
  
  if (isValid) {
    console.log("\n✅ The webhook response format should resolve the Make.com .split() error!")
    console.log("💡 Next steps:")
    console.log("   1. Deploy the updated webhook code")
    console.log("   2. Test the Make.com scenario again")
    console.log("   3. Monitor the execution logs for any remaining issues")
  }
  
} catch (error) {
  console.error("❌ Validation failed:", error.message)
}
