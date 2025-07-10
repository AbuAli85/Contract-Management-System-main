/**
 * Test script to verify exact webhook response structure for Make.com
 * This will show you the EXACT field names available for mapping
 */

const testWebhookResponse = async () => {
  console.log("🔍 Testing Make.com webhook response structure...\n");

  try {
    // Test payload with sample data
    const testPayload = {
      contract_number: "CON-2024-001",
      promoter_name_en: "John Doe",
      promoter_name_ar: "جون دو",
      promoter_id_card_url: "https://vcjhdguxbmlqtzzllkki.supabase.co/storage/v1/object/public/promoter-documents/promoter_id_cards/1736025061969_id-card.jpg",
      promoter_passport_url: "https://vcjhdguxbmlqtzzllkki.supabase.co/storage/v1/object/public/promoter-documents/promoter_passports/1736025062016_passport.jpg",
      first_party_name_en: "ABC Company",
      first_party_name_ar: "شركة ABC",
      first_party_crn: "1234567890",
      second_party_name_en: "XYZ Corp",
      second_party_name_ar: "شركة XYZ",
      second_party_crn: "0987654321",
      id_card_number: "123456789",
      start_date: "2024-01-01",
      end_date: "2024-12-31",
      job_title: "Marketing Specialist",
      work_location: "Riyadh",
      contract_value: "50000",
      email: "john.doe@example.com"
    };

    console.log("📤 Sending test payload to webhook...");
    
    const response = await fetch('http://localhost:3000/api/webhook/makecom', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });

    const result = await response.json();
    
    console.log("📨 Webhook Response Status:", response.status);
    console.log("📨 Webhook Response:");
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      console.log("\n✅ SUCCESS! Webhook is working correctly.");
      console.log("\n📋 EXACT FIELD NAMES FOR MAKE.COM MAPPING:");
      console.log("==========================================");
      
      // Extract and display all field names
      const fields = Object.keys(result).filter(key => key !== 'images_processed');
      
      fields.forEach(field => {
        const value = result[field];
        const type = typeof value;
        console.log(`${field}: ${type} - "${value}"`);
      });

      console.log("\n🖼️ IMAGE URL FIELDS (for Google Docs module):");
      console.log("==============================================");
      console.log(`promoter_id_card_url: "${result.promoter_id_card_url}"`);
      console.log(`promoter_passport_url: "${result.promoter_passport_url}"`);

      console.log("\n📝 USE THESE EXACT FIELD NAMES IN GOOGLE DOCS MODULE:");
      console.log("====================================================");
      console.log("ID_CARD_IMAGE placeholder → {{promoter_id_card_url}}");
      console.log("PASSPORT_IMAGE placeholder → {{promoter_passport_url}}");

      console.log("\n🔗 TEST THESE URLs IN BROWSER:");
      console.log("==============================");
      console.log("ID Card:", result.promoter_id_card_url);
      console.log("Passport:", result.promoter_passport_url);

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
    }
  }
};

// Run the test
testWebhookResponse();
