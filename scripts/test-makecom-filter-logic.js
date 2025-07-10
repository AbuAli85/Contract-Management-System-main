/**
 * Test the specific filter condition that's failing in Make.com
 * This simulates the exact filter logic: "promoter_id_card_url exists and length > 0"
 */

function testMakeComFilterLogic() {
  console.log("🔍 TESTING MAKE.COM FILTER LOGIC")
  console.log("=================================")
  
  // The filter from the screenshot appears to be checking:
  // 1. promoter_id_card_url exists 
  // 2. AND length of split result > 0
  
  console.log("\n📋 Testing different response scenarios:")
  
  const testCases = [
    {
      name: "With valid URL",
      data: { promoter_id_card_url: "https://example.com/image.jpg" }
    },
    {
      name: "With empty string (our current fix)",
      data: { promoter_id_card_url: "" }
    },
    {
      name: "With null (old behavior)",
      data: { promoter_id_card_url: null }
    },
    {
      name: "With undefined (old behavior)",
      data: { promoter_id_card_url: undefined }
    },
    {
      name: "Missing field entirely",
      data: {}
    }
  ]
  
  testCases.forEach(testCase => {
    console.log(`\n🧪 Testing: ${testCase.name}`)
    const value = testCase.data.promoter_id_card_url
    
    try {
      // Test the "exists" condition
      const exists = value !== null && value !== undefined
      console.log(`  Exists check: ${exists ? '✅' : '❌'} (${typeof value}: '${value}')`)
      
      // Test the length check (what might be causing the .split() error)
      if (exists && typeof value === 'string') {
        // Maybe the filter is doing something like: value.split('://')[0] to check protocol
        const protocolSplit = value.split('://')
        console.log(`  Protocol split: ✅ [${protocolSplit.join(', ')}]`)
        
        // Or checking file extension: value.split('.').pop()
        const extensionSplit = value.split('.')
        console.log(`  Extension split: ✅ [${extensionSplit.join(', ')}]`)
        
        // Or checking path segments: value.split('/')
        const pathSplit = value.split('/')
        console.log(`  Path split: ✅ [${pathSplit.join(', ')}]`)
        
        // Check length conditions
        console.log(`  String length: ${value.length}`)
        console.log(`  Length > 0: ${value.length > 0 ? '✅' : '❌'}`)
        
      } else {
        console.log(`  ❌ Would fail .split() - not a string or doesn't exist`)
      }
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`)
    }
  })
  
  console.log("\n💡 HYPOTHESIS:")
  console.log("The filter might be expecting:")
  console.log("1. promoter_id_card_url to exist (not null/undefined)")
  console.log("2. AND to be a valid URL format")
  console.log("3. The .split() might be checking URL structure")
  
  console.log("\n🔧 POTENTIAL SOLUTIONS:")
  console.log("Option 1: Return null instead of empty string for missing URLs")
  console.log("Option 2: Return a placeholder URL for missing images")
  console.log("Option 3: Modify the filter logic in Make.com")
  
  // Test the specific filter condition from the screenshot
  console.log("\n🎯 TESTING FILTER FROM SCREENSHOT:")
  console.log("Filter appears to check: promoter_id_card_url exists AND length(...) > 0")
  
  const mockResponseWithEmptyString = {
    promoter_id_card_url: "",
    promoter_passport_url: ""
  }
  
  const mockResponseWithNull = {
    promoter_id_card_url: null,
    promoter_passport_url: null
  }
  
  const mockResponseWithPlaceholder = {
    promoter_id_card_url: "https://placeholder.com/no-image.jpg",
    promoter_passport_url: "https://placeholder.com/no-image.jpg"
  }
  
  console.log("\n📊 Testing different response formats:")
  
  const responses = [
    { name: "Empty strings", data: mockResponseWithEmptyString },
    { name: "Null values", data: mockResponseWithNull },
    { name: "Placeholder URLs", data: mockResponseWithPlaceholder }
  ]
  
  responses.forEach(response => {
    console.log(`\n${response.name}:`)
    const url = response.data.promoter_id_card_url
    
    // Simulate the filter condition
    const exists = url !== null && url !== undefined
    const hasLength = exists && typeof url === 'string' && url.length > 0
    const wouldPassFilter = exists && hasLength
    
    console.log(`  Value: ${typeof url}: '${url}'`)
    console.log(`  Exists: ${exists}`)
    console.log(`  Has length > 0: ${hasLength}`)
    console.log(`  Would pass filter: ${wouldPassFilter ? '✅' : '❌'}`)
    
    if (wouldPassFilter && typeof url === 'string') {
      try {
        const split = url.split('.')
        console.log(`  .split('.') works: ✅ [${split.join(', ')}]`)
      } catch (error) {
        console.log(`  .split('.') fails: ❌ ${error.message}`)
      }
    }
  })
}

testMakeComFilterLogic()
