/**
 * Test webhook with missing image URLs to verify fallback handling
 */

const testMissingImageUrls = async () => {
  console.log("🔍 Testing webhook with MISSING image URLs...\n");

  try {
    // Test payload WITHOUT image URLs (this should trigger fallbacks)
    const testPayload = {
      contract_number: "CON-2024-TEST",
      promoter_name_en: "Test User",
      promoter_name_ar: "مستخدم تجريبي",
      // promoter_id_card_url: NOT PROVIDED
      // promoter_passport_url: NOT PROVIDED  
      first_party_name_en: "Test Company",
      first_party_name_ar: "شركة اختبار",
      first_party_crn: "1111111111",
      second_party_name_en: "Test Corp",
      second_party_name_ar: "شركة اختبار",
      second_party_crn: "2222222222",
      id_card_number: "987654321",
      start_date: "2024-01-01",
      end_date: "2024-12-31",
      job_title: "Test Position",
      work_location: "Test Location",
      contract_value: "30000",
      email: "test@example.com"
    };

    console.log("📤 Sending payload WITHOUT image URLs...");
    console.log("This should trigger fallback URLs in the webhook response.");
    
    const response = await fetch('http://localhost:3000/api/webhook/makecom', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });

    const result = await response.json();
    
    console.log("📨 Response Status:", response.status);
    console.log("📨 Response:");
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      console.log("\n✅ SUCCESS! Webhook returned fallback URLs.");
      
      console.log("\n🖼️ IMAGE URL ANALYSIS:");
      console.log("======================");
      console.log(`ID Card URL: ${result.promoter_id_card_url}`);
      console.log(`Passport URL: ${result.promoter_passport_url}`);
      
      // Check if URLs are valid (not empty)
      const hasValidIdCard = result.promoter_id_card_url && result.promoter_id_card_url.includes('https://');
      const hasValidPassport = result.promoter_passport_url && result.promoter_passport_url.includes('https://');
      
      console.log(`\nID Card URL Valid: ${hasValidIdCard ? '✅' : '❌'}`);
      console.log(`Passport URL Valid: ${hasValidPassport ? '✅' : '❌'}`);
      
      if (hasValidIdCard && hasValidPassport) {
        console.log("\n🎉 PERFECT! Both image URLs are valid.");
        console.log("This should fix the 'Missing value of required parameter url' errors.");
        
        console.log("\n📋 USE THESE FIELD NAMES IN GOOGLE DOCS MODULE:");
        console.log("===============================================");
        console.log("ID_CARD_IMAGE: {{promoter_id_card_url}}");
        console.log("PASSPORT_IMAGE: {{promoter_passport_url}}");
        
      } else {
        console.log("\n⚠️ WARNING: Image URLs are still empty or invalid.");
      }

    } else {
      console.log("\n❌ ERROR: Webhook failed");
      console.log("Error details:", result.error);
    }

  } catch (error) {
    console.error("\n💥 TEST FAILED:");
    console.error("Error:", error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log("\n🚨 Make sure your development server is running:");
      console.log("   npm run dev");
      console.log("\nThen run this test again:");
      console.log("   node scripts/test-missing-image-urls.js");
    }
  }
};

// Run the test
testMissingImageUrls();
