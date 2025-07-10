#!/usr/bin/env node

/**
 * Test script to verify Make.com webhook configuration
 * This script helps ensure the webhook is properly configured for automatic execution
 */

const https = require('https');
const http = require('http');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const webhookUrl = process.env.MAKE_WEBHOOK_URL;
const webhookSecret = process.env.MAKE_WEBHOOK_SECRET;

if (!webhookUrl) {
  console.error('❌ MAKE_WEBHOOK_URL is not configured');
  process.exit(1);
}

console.log('🔧 Testing Make.com webhook configuration...');
console.log('URL:', webhookUrl);
console.log('Secret configured:', !!webhookSecret);

// Test payload
const testPayload = {
  contract_id: 'test-contract-123',
  first_party_name_en: 'Test Client Company',
  first_party_name_ar: 'شركة العميل التجريبية',
  first_party_crn: '123456789',
  second_party_name_en: 'Test Employer Company',
  second_party_name_ar: 'شركة صاحب العمل التجريبية',
  second_party_crn: '987654321',
  promoter_name_en: 'Test Promoter',
  promoter_name_ar: 'المروج التجريبي',
  job_title: 'Software Developer',
  work_location: 'Riyadh, Saudi Arabia',
  email: 'test@example.com',
  start_date: '2024-01-01',
  end_date: '2024-12-31',
  contract_number: 'CONTRACT-2024-001',
  id_card_number: '1234567890',
  promoter_id_card_url: 'https://example.com/id-card.jpg',
  promoter_passport_url: 'https://example.com/passport.jpg',
  pdf_url: 'https://example.com/contract.pdf',
  test_mode: true,
  timestamp: new Date().toISOString()
};

const headers = {
  'Content-Type': 'application/json',
  'User-Agent': 'Contract-Generator-App/1.0',
  'X-Trigger-Source': 'contract-generator',
  'X-Contract-ID': 'test-contract-123',
  'X-Timestamp': new Date().toISOString()
};

if (webhookSecret) {
  headers['X-Webhook-Secret'] = webhookSecret;
}

function makeRequest() {
  return new Promise((resolve, reject) => {
    const url = new URL(webhookUrl);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers: headers,
      timeout: 30000
    };

    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(JSON.stringify(testPayload));
    req.end();
  });
}

async function testWebhook() {
  try {
    console.log('\n📤 Sending test request...');
    const response = await makeRequest();
    
    console.log('\n✅ Webhook test completed!');
    console.log('Status Code:', response.statusCode);
    console.log('Response Headers:', JSON.stringify(response.headers, null, 2));
    console.log('Response Body:', response.body);
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      console.log('\n🎉 Webhook is working correctly!');
      console.log('✅ The webhook should execute automatically without manual intervention.');
      
      if (response.body.toLowerCase().includes('accepted')) {
        console.log('✅ Make.com accepted the webhook request.');
      }
    } else {
      console.log('\n⚠️ Webhook returned non-success status code.');
      console.log('Check your Make.com scenario configuration.');
    }
    
  } catch (error) {
    console.error('\n❌ Webhook test failed:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log('💡 Tip: Check if the webhook URL is correct');
    } else if (error.message.includes('timeout')) {
      console.log('💡 Tip: The webhook might be taking too long to respond');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 Tip: Check if the webhook URL is accessible');
    }
  }
}

// Run the test
testWebhook();
