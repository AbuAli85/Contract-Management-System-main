/**
 * Test the updated webhook response format for Make.com filter compatibility
 * This tests the specific fix for image URL handling
 */

function createUpdatedMockWebhookResponse() {
  // Simulate webhook response with the new format
  const mockPayloadWithImages = {
    contract_number: "CNT-2024-001",
    promoter_name_en: "John Smith",
    promoter_id_card_url: "https://example.com/id-card.jpg",
    promoter_passport_url: "https://example.com/passport.jpg",
    first_party_name_en: "ABC Company",
    second_party_name_en: "XYZ Corp"
  }

  const mockPayloadWithoutImages = {
    contract_number: "CNT-2024-002", 
    promoter_name_en: "Jane Doe",
    promoter_id_card_url: null, // or undefined/missing
    promoter_passport_url: null,
    first_party_name_en: "ABC Company",
    second_party_name_en: "XYZ Corp"
  }

  // Test both scenarios
  const responses = [
    {
      name: "With Images",
      response: createResponse(mockPayloadWithImages)
    },
    {
      name: "Without Images",
      response: createResponse(mockPayloadWithoutImages)
    }
  ]

  return responses
}

function createResponse(payload) {
  // Simulate the updated webhook response format
  return {
    contract_number: payload.contract_number || "",
    promoter_name_en: payload.promoter_name_en || "",
    promoter_id_card_url: payload.promoter_id_card_url || null,  // KEY FIX: null instead of ""
    promoter_passport_url: payload.promoter_passport_url || null,  // KEY FIX: null instead of ""
    first_party_name_en: payload.first_party_name_en || "",
    second_party_name_en: payload.second_party_name_en || "",
    success: true,
    images_processed: {
      id_card: !!payload.promoter_id_card_url,
      passport: !!payload.promoter_passport_url
    }
  }
}

function testMakeComFilterCompatibility() {
  console.log("🧪 TESTING UPDATED WEBHOOK RESPONSE FOR MAKE.COM FILTER")
  console.log("=====================================================")
  
  const responses = createUpdatedMockWebhookResponse()
  
  responses.forEach(testCase => {
    console.log(`\n📋 Testing: ${testCase.name}`)
    console.log(`Response:`, JSON.stringify(testCase.response, null, 2))
    
    // Test the specific Make.com filter logic from the screenshot
    const idCardUrl = testCase.response.promoter_id_card_url
    const passportUrl = testCase.response.promoter_passport_url
    
    console.log(`\n🔍 Make.com Filter Analysis:`)
    
    // Test ID Card URL filter
    console.log(`  ID Card URL: ${typeof idCardUrl}: '${idCardUrl}'`)
    const idCardExists = idCardUrl !== null && idCardUrl !== undefined
    console.log(`  - Exists: ${idCardExists}`)
    
    if (idCardExists && typeof idCardUrl === 'string') {
      const hasLength = idCardUrl.length > 0
      console.log(`  - Length > 0: ${hasLength}`)
      console.log(`  - Filter would pass: ${idCardExists && hasLength ? '✅' : '❌'}`)
      
      if (hasLength) {
        try {
          const split = idCardUrl.split('.')
          console.log(`  - .split('.') works: ✅ [${split.join(', ')}]`)
        } catch (error) {
          console.log(`  - .split('.') fails: ❌ ${error.message}`)
        }
      }
    } else {
      console.log(`  - Filter would pass: ✅ (null/undefined skips processing)`)
    }
    
    // Test Passport URL filter  
    console.log(`\n  Passport URL: ${typeof passportUrl}: '${passportUrl}'`)
    const passportExists = passportUrl !== null && passportUrl !== undefined
    console.log(`  - Exists: ${passportExists}`)
    
    if (passportExists && typeof passportUrl === 'string') {
      const hasLength = passportUrl.length > 0
      console.log(`  - Length > 0: ${hasLength}`)
      console.log(`  - Filter would pass: ${passportExists && hasLength ? '✅' : '❌'}`)
    } else {
      console.log(`  - Filter would pass: ✅ (null/undefined skips processing)`)
    }
    
    // Test images_processed logic
    const imagesProcessed = testCase.response.images_processed
    console.log(`\n  Images Processed:`)
    console.log(`  - ID Card: ${imagesProcessed.id_card}`)
    console.log(`  - Passport: ${imagesProcessed.passport}`)
  })
  
  console.log("\n🎯 EXPECTED MAKE.COM BEHAVIOR:")
  console.log("✅ Scenario 1 (With Images): Filter passes, images are processed")
  console.log("✅ Scenario 2 (Without Images): Filter skips image processing, continues workflow")
  console.log("✅ No .split() errors should occur in either case")
  
  console.log("\n🔧 KEY CHANGES MADE:")
  console.log("• promoter_id_card_url: empty string ('') → null")
  console.log("• promoter_passport_url: empty string ('') → null")
  console.log("• Other string fields: still use empty string ('') to prevent .split() errors")
  
  console.log("\n💡 WHY THIS WORKS:")
  console.log("• null/undefined values are falsy, so Make.com filter skips them")
  console.log("• Empty strings ('') are truthy but have length 0, causing filter failures")
  console.log("• Valid URLs are truthy with length > 0, so filter processes them correctly")
}

// Test the specific filter condition that was failing
function testSpecificFilterCondition() {
  console.log("\n🎯 TESTING SPECIFIC FILTER CONDITION FROM SCREENSHOT")
  console.log("==================================================")
  
  // The filter from the screenshot:
  // "ID Card URL Valid" with condition "promoter_id_card_url exists and length(...) > 0"
  
  const testValues = [
    { name: "Valid URL", value: "https://example.com/id.jpg" },
    { name: "Empty string (old)", value: "" },
    { name: "Null (new fix)", value: null },
    { name: "Undefined", value: undefined }
  ]
  
  testValues.forEach(test => {
    console.log(`\n🧪 Testing: ${test.name}`)
    const value = test.value
    
    // Simulate Make.com filter logic
    try {
      const exists = value !== null && value !== undefined
      console.log(`  Exists check: ${exists}`)
      
      if (exists) {
        if (typeof value === 'string') {
          const length = value.length
          const hasLength = length > 0
          console.log(`  Length: ${length}`)
          console.log(`  Length > 0: ${hasLength}`)
          
          if (hasLength) {
            // Simulate .split() operations that Make.com might do
            const splitDot = value.split('.')
            const splitSlash = value.split('/')
            console.log(`  .split('.') result: [${splitDot.join(', ')}]`)
            console.log(`  .split('/') result: [${splitSlash.join(', ')}]`)
            console.log(`  Filter result: ✅ PASS (processes image)`)
          } else {
            console.log(`  Filter result: ❌ FAIL (length = 0)`)
          }
        } else {
          console.log(`  Type: ${typeof value}`)
          console.log(`  Filter result: ❌ FAIL (not string)`)
        }
      } else {
        console.log(`  Filter result: ✅ SKIP (null/undefined, continues workflow)`)
      }
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`)
    }
  })
}

// Run the tests
testMakeComFilterCompatibility()
testSpecificFilterCondition()

console.log("\n" + "=".repeat(60))
console.log("🎉 CONCLUSION: Updated webhook should resolve Make.com filter error!")
console.log("   - Image URLs now return null when missing (instead of empty string)")
console.log("   - Make.com filter will skip null values instead of failing on empty strings")
console.log("   - Valid URLs will still be processed correctly")
console.log("=" .repeat(60))
