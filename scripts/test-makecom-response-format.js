/**
 * Test script to validate Make.com webhook response format
 * This helps diagnose the "Cannot read properties of undefined (reading 'split')" error
 */

const testPayload = {
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

async function testWebhookResponse() {
  console.log("🧪 Testing Make.com webhook response format...")
  
  try {
    const webhookUrl = "http://localhost:3000/api/webhook/makecom"
    
    console.log("📤 Sending test payload to webhook...")
    console.log("Payload:", JSON.stringify(testPayload, null, 2))
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    })
    
    const responseData = await response.json()
    
    console.log("\n📥 Webhook Response:")
    console.log("Status:", response.status)
    console.log("Response:", JSON.stringify(responseData, null, 2))
    
    if (!response.ok) {
      console.error("❌ Webhook request failed")
      return
    }
    
    console.log("\n🔍 Analyzing response for potential .split() issues...")
    
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
      'email'
    ]
    
    console.log("\n📋 String field validation:")
    stringFields.forEach(field => {
      const value = responseData[field]
      const type = typeof value
      const isString = type === 'string'
      const hasValue = value !== null && value !== undefined && value !== ''
      
      console.log(`  ${field}: ${value} (${type}) - ${isString && hasValue ? '✅' : '⚠️'}`)
      
      if (!isString || !hasValue) {
        console.log(`    ⚠️  Warning: ${field} is ${type} with value '${value}' - might cause .split() error`)
      }
    })
    
    // Check for missing fields that Make.com blueprint expects
    const expectedFields = [
      'success', 'contract_id', 'contract_uuid', 'status', 'pdf_url',
      'promoter_id', 'first_party_id', 'second_party_id', 'images_processed'
    ]
    
    console.log("\n📋 Required field validation:")
    expectedFields.forEach(field => {
      const hasField = responseData.hasOwnProperty(field)
      console.log(`  ${field}: ${hasField ? '✅' : '❌'}`)
      
      if (!hasField) {
        console.log(`    ❌ Missing field: ${field}`)
      }
    })
    
    // Test simulated .split() operations on string fields
    console.log("\n🧪 Simulating .split() operations:")
    stringFields.forEach(field => {
      const value = responseData[field]
      try {
        if (value && typeof value === 'string') {
          // Common split operations that might be in Make.com filters
          const splits = {
            'dash': value.split('-'),
            'space': value.split(' '),
            'underscore': value.split('_'),
            'dot': value.split('.')
          }
          console.log(`  ${field}.split() tests: ✅`)
        } else {
          console.log(`  ${field}.split() would fail: ⚠️ (${typeof value}: '${value}')`)
        }
      } catch (error) {
        console.log(`  ${field}.split() error: ❌ ${error.message}`)
      }
    })
    
    console.log("\n✅ Test completed!")
    
  } catch (error) {
    console.error("❌ Test failed:", error.message)
    console.error(error.stack)
  }
}

// Self-executing test
testWebhookResponse()
