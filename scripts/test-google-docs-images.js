/**
 * Test Google Docs compatible image URLs
 * These URLs should be accessible by Google's servers
 */

const testGoogleDocsImageUrls = async () => {
  console.log("🔍 Testing Google Docs compatible image URLs...\n");

  // Test URLs that should work with Google Docs API
  const testUrls = {
    id_card: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=400&fit=crop&auto=format",
    passport: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop&auto=format",
    // Alternative working URLs
    id_card_alt: "https://via.placeholder.com/600x400/2563eb/ffffff?text=ID+CARD",
    passport_alt: "https://via.placeholder.com/600x400/059669/ffffff?text=PASSPORT"
  };

  console.log("📋 RECOMMENDED IMAGE URLS FOR GOOGLE DOCS:");
  console.log("==========================================");
  
  for (const [type, url] of Object.entries(testUrls)) {
    console.log(`${type.toUpperCase()}: ${url}`);
    
    try {
      // Test if URL is accessible
      const response = await fetch(url, { method: 'HEAD' });
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      
      console.log(`  Status: ${response.status} ${response.ok ? '✅' : '❌'}`);
      console.log(`  Type: ${contentType}`);
      console.log(`  Size: ${contentLength ? Math.round(contentLength/1024) + 'KB' : 'Unknown'}`);
      console.log("");
      
    } catch (error) {
      console.log(`  Error: ${error.message} ❌\n`);
    }
  }

  console.log("🔧 IMMEDIATE FIX FOR MAKE.COM:");
  console.log("==============================");
  console.log("Update your Google Docs module with these URLs:");
  console.log("");
  console.log("ID_CARD_IMAGE:");
  console.log(testUrls.id_card);
  console.log("");
  console.log("PASSPORT_IMAGE:");
  console.log(testUrls.passport);
  console.log("");
  
  console.log("📊 WEBHOOK TEST:");
  console.log("================");
  
  try {
    // Test the webhook with no image URLs to trigger fallbacks
    const testPayload = {
      contract_number: "CON-IMGTEST-001",
      promoter_name_en: "Image Test User",
      first_party_name_en: "Test Company",
      second_party_name_en: "Test Corp",
      first_party_crn: "1111111111",
      second_party_crn: "2222222222",
      start_date: "2024-01-01",
      end_date: "2024-12-31",
      job_title: "Test Position",
      work_location: "Test Location",
      contract_value: "40000",
      email: "imagetest@example.com"
      // No image URLs provided - should trigger fallbacks
    };

    console.log("📤 Testing webhook with new fallback URLs...");
    
    const response = await fetch('http://localhost:3000/api/webhook/makecom', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log("✅ Webhook working with new image URLs:");
      console.log(`ID Card: ${result.promoter_id_card_url}`);
      console.log(`Passport: ${result.promoter_passport_url}`);
      
      // Verify the URLs are the new working ones
      const hasWorkingUrls = result.promoter_id_card_url.includes('unsplash') && 
                           result.promoter_passport_url.includes('unsplash');
                           
      console.log(`\n${hasWorkingUrls ? '🎉' : '⚠️'} Using ${hasWorkingUrls ? 'NEW working' : 'old problematic'} URLs`);
      
    } else {
      console.log("❌ Webhook error:", result.error);
    }

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log("⚠️ Development server not running. Start with: npm run dev");
    } else {
      console.log("❌ Webhook test error:", error.message);
    }
  }
};

// Run the test
testGoogleDocsImageUrls();
