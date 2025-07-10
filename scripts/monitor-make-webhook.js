#!/usr/bin/env node

/**
 * Make.com Webhook Monitoring Script
 * 
 * This script helps monitor the Make.com webhook execution and PDF generation process.
 * Run this script to test your webhook and track the workflow.
 */

const https = require('https');
const http = require('http');

// Configuration
const WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!WEBHOOK_URL) {
  console.error('❌ MAKE_WEBHOOK_URL environment variable is not set');
  process.exit(1);
}

console.log('🔍 Make.com Webhook Monitor');
console.log('==========================');
console.log(`Webhook URL: ${WEBHOOK_URL}`);
console.log('');

// Test payload
const testPayload = {
  contract_id: `test-${Date.now()}`,
  first_party_name: "Test Company A",
  second_party_name: "Test Company B", 
  promoter_name: "Test Promoter",
  start_date: "2025-01-01",
  end_date: "2026-01-01",
  job_title: "Software Engineer",
  email: "test@example.com"
};

console.log('📤 Sending test payload to Make.com...');
console.log('Payload:', JSON.stringify(testPayload, null, 2));
console.log('');

// Function to make HTTP request
function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = client.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: responseData
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Main monitoring function
async function monitorWebhook() {
  try {
    console.log('⏳ Testing webhook connection...');
    
    const response = await makeRequest(WEBHOOK_URL, JSON.stringify(testPayload));
    
    console.log('📥 Response received:');
    console.log(`Status Code: ${response.statusCode}`);
    console.log(`Content-Type: ${response.headers['content-type']}`);
    console.log(`Response: ${response.data}`);
    console.log('');
    
    if (response.statusCode === 200) {
      console.log('✅ Webhook test successful!');
      
      // Try to parse response
      try {
        const parsedResponse = JSON.parse(response.data);
        console.log('📋 Parsed response:', JSON.stringify(parsedResponse, null, 2));
        
        if (parsedResponse.pdf_url) {
          console.log('🎉 PDF URL found in response!');
          console.log(`PDF URL: ${parsedResponse.pdf_url}`);
        } else if (parsedResponse.success) {
          console.log('✅ Success response received (PDF will be generated asynchronously)');
        }
      } catch (parseError) {
        if (response.data.trim().toLowerCase() === 'accepted') {
          console.log('✅ Make.com accepted the request (PDF will be generated asynchronously)');
        } else {
          console.log('⚠️  Response is not JSON, but webhook was successful');
        }
      }
    } else {
      console.log('❌ Webhook test failed');
      console.log(`Error: ${response.data}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing webhook:', error.message);
  }
}

// Run the monitor
monitorWebhook().then(() => {
  console.log('');
  console.log('📋 Next Steps:');
  console.log('1. Check your Make.com scenario execution logs');
  console.log('2. Verify PDF generation in Google Drive');
  console.log('3. Check Supabase storage for uploaded PDF');
  console.log('4. Verify contract record is updated with PDF URL');
  console.log('');
  console.log('🔗 Useful Links:');
  console.log('- Make.com Dashboard: https://www.make.com/en/');
  console.log('- Supabase Dashboard: https://supabase.com/dashboard');
  console.log('- Google Drive: https://drive.google.com/');
});
