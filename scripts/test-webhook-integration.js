#!/usr/bin/env node

/**
 * End-to-end test for Make.com webhook integration
 * This script tests the actual webhook endpoint with a sample payload
 */

const https = require('https');
const http = require('http');

console.log("🚀 Make.com Webhook Integration End-to-End Test");
console.log("=" * 60);

// Test payload matching the Make.com blueprint
const testPayload = {
  contract_number: `TEST-${Date.now()}`,
  promoter_name_en: "Ahmed Hassan",
  promoter_name_ar: "أحمد حسن",
  promoter_id_card_url: "https://via.placeholder.com/600x400/0066cc/ffffff?text=ID+Card",
  promoter_passport_url: "https://via.placeholder.com/600x400/cc0066/ffffff?text=Passport",
  first_party_name_en: "Tech Solutions LLC",
  first_party_name_ar: "شركة الحلول التقنية ذ.م.م",
  first_party_crn: "CN-1234567",
  second_party_name_en: "Digital Innovations Corp",
  second_party_name_ar: "شركة الابتكارات الرقمية",
  second_party_crn: "CN-7654321",
  id_card_number: "784-1234-5678901-2",
  start_date: "2025-02-01",
  end_date: "2025-12-31",
  job_title: "Senior Software Developer",
  work_location: "Dubai Internet City, Dubai, UAE",
  contract_value: 180000.00,
  email: "ahmed.hassan@techsolutions.ae",
  status: "active"
};

console.log("📤 Sending test payload:");
console.log(JSON.stringify(testPayload, null, 2));

async function testWebhook() {
  try {
    // Test with localhost development server
    const testUrls = [
      'http://localhost:3000/api/webhook/makecom',
      'http://127.0.0.1:3000/api/webhook/makecom'
    ];

    for (const url of testUrls) {
      console.log(`\n🔗 Testing webhook at: ${url}`);
      
      try {
        const response = await makeRequest(url, testPayload);
        console.log("✅ Webhook Response:");
        console.log(JSON.stringify(response, null, 2));
        
        // Validate response format
        validateResponse(response);
        break; // Success, no need to try other URLs
        
      } catch (error) {
        console.log(`❌ Failed to connect to ${url}:`, error.message);
        if (url === testUrls[testUrls.length - 1]) {
          console.log("\n⚠️  Local development server not running.");
          console.log("To test the webhook:");
          console.log("1. Start the Next.js development server: npm run dev");
          console.log("2. Run this test script again");
          console.log("3. Or deploy to production and test with the live URL");
        }
      }
    }
    
  } catch (error) {
    console.error("🚨 Test failed:", error);
  }
}

function makeRequest(url, payload) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const httpModule = isHttps ? https : http;
    
    const postData = JSON.stringify(payload);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Make.com-Test/1.0'
      },
      timeout: 30000
    };

    const req = httpModule.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          response._statusCode = res.statusCode;
          response._headers = res.headers;
          resolve(response);
        } catch (e) {
          reject(new Error(`Invalid JSON response: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

function validateResponse(response) {
  console.log("\n🔍 Validating response format...");
  
  const requiredFields = ['success', 'contract_id'];
  const missingFields = requiredFields.filter(field => !(field in response));
  
  if (missingFields.length > 0) {
    console.log(`❌ Missing required fields: ${missingFields.join(', ')}`);
    return false;
  }
  
  console.log("✅ Response validation:");
  console.log(`  - success: ${response.success} (${typeof response.success})`);
  console.log(`  - contract_id: ${response.contract_id} (${typeof response.contract_id})`);
  console.log(`  - pdf_url: ${response.pdf_url} (${typeof response.pdf_url})`);
  
  if (response.images_processed) {
    console.log(`  - images_processed.id_card: ${response.images_processed.id_card}`);
    console.log(`  - images_processed.passport: ${response.images_processed.passport}`);
  }
  
  if (response._statusCode) {
    console.log(`  - HTTP Status: ${response._statusCode}`);
  }
  
  // Check if response matches Make.com blueprint expectations
  const isValidMakeComResponse = 
    typeof response.success === 'boolean' &&
    typeof response.contract_id === 'string' &&
    (response.pdf_url === null || typeof response.pdf_url === 'string');
    
  if (isValidMakeComResponse) {
    console.log("✅ Response format is compatible with Make.com blueprint!");
  } else {
    console.log("❌ Response format does not match Make.com expectations");
  }
  
  return isValidMakeComResponse;
}

// Run the test
testWebhook().then(() => {
  console.log("\n🎯 Test completed!");
  console.log("\n📋 Next steps for Make.com integration:");
  console.log("1. Deploy your application to production");
  console.log("2. Update Make.com webhook URL to: https://your-domain.com/api/webhook/makecom");
  console.log("3. Configure the Make.com scenario with your production credentials");
  console.log("4. Test the full PDF generation workflow");
}).catch(console.error);
