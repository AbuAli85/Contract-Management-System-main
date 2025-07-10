// Test script to verify webhook compatibility with Make.com blueprint
const testWebhookCompatibility = async () => {
  const webhookUrl = 'http://localhost:3000/api/generate-contract'
  
  // This payload matches what the Make.com blueprint expects to send
  const makecomPayload = {
    contract_number: 'CONTRACT-000001',
    promoter_name_en: 'Ahmed Hassan',
    promoter_name_ar: 'أحمد حسن',
    promoter_id_card_url: 'https://example.com/id-card.jpg',
    promoter_passport_url: 'https://example.com/passport.jpg',
    first_party_name_en: 'ABC Company',
    first_party_name_ar: 'شركة أ ب ج',
    first_party_crn: '1234567890',
    second_party_name_en: 'XYZ Corporation',
    second_party_name_ar: 'شركة س ي ز',
    second_party_crn: '0987654321',
    id_card_number: '1234567890123',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    job_title: 'Software Developer',
    work_location: 'Riyadh, Saudi Arabia',
    contract_value: 120000,
    email: 'ahmed@example.com'
  }

  try {
    console.log('Testing webhook compatibility with Make.com blueprint...')
    console.log('Payload:', JSON.stringify(makecomPayload, null, 2))
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(makecomPayload)
    })

    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))
    
    const responseText = await response.text()
    console.log('Response body:', responseText)
    
    if (response.ok) {
      try {
        const responseJson = JSON.parse(responseText)
        console.log('Parsed response:', responseJson)
        
        // Check if response has expected fields that Make.com blueprint expects
        const expectedFields = ['success', 'pdf_url', 'contract_id']
        const missingFields = expectedFields.filter(field => !(field in responseJson))
        
        if (missingFields.length === 0) {
          console.log('✅ Webhook is compatible with Make.com blueprint!')
        } else {
          console.log('⚠️  Response missing expected fields:', missingFields)
        }
        
      } catch (parseError) {
        console.log('Response is not valid JSON, but request succeeded')
      }
    } else {
      console.log('❌ Webhook request failed')
    }

  } catch (error) {
    console.error('Error testing webhook:', error)
  }
}

// Test database schema compatibility
const testDatabaseSchema = async () => {
  console.log('\n=== Testing Database Schema Compatibility ===')
  
  // Fields expected by Make.com blueprint
  const expectedFields = [
    'contract_number',
    'is_current', 
    'promoter_id_card_url',
    'promoter_passport_url',
    'first_party_name_en',
    'first_party_name_ar', 
    'first_party_crn',
    'second_party_name_en',
    'second_party_name_ar',
    'second_party_crn',
    'promoter_name_en',
    'promoter_name_ar',
    'id_card_number',
    'start_date', // maps to contract_start_date
    'end_date',   // maps to contract_end_date
    'status',
    'pdf_url'
  ]
  
  console.log('Fields expected by Make.com blueprint:')
  expectedFields.forEach(field => console.log(`  - ${field}`))
  
  console.log('\nNext steps to ensure compatibility:')
  console.log('1. Run the database migration script: 014_add_webhook_integration_fields.sql')
  console.log('2. Update Supabase types to include new fields')
  console.log('3. Test webhook endpoint with Make.com format')
  console.log('4. Update contract generation forms to include contract_number field')
}

// Run tests
const runTests = async () => {
  await testDatabaseSchema()
  
  console.log('\n=== Testing Webhook Endpoint ===')
  console.log('Make sure your Next.js app is running on http://localhost:3000')
  console.log('Then uncomment the line below to test the webhook:')
  console.log('// await testWebhookCompatibility()')
  
  // Uncomment to test webhook endpoint
  // await testWebhookCompatibility()
}

runTests().catch(console.error)

module.exports = {
  testWebhookCompatibility,
  testDatabaseSchema
}
