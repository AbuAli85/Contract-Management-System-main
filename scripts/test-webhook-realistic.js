#!/usr/bin/env node

/**
 * Test script to send realistic contract data to Make.com webhook
 * This helps debug automatic execution issues
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

console.log('🔧 Testing Make.com webhook with realistic contract data...');
console.log('URL:', webhookUrl);

// Realistic contract payload that matches your application
const realisticPayload = {
  contract_id: `test-${Date.now()}`,
  first_party_name_en: 'Saudi Technology Solutions Co.',
  first_party_name_ar: 'شركة الحلول التقنية السعودية',
  first_party_crn: '4030000001',
  second_party_name_en: 'Riyadh Development Company',
  second_party_name_ar: 'شركة تطوير الرياض',
  second_party_crn: '4030000002',
  promoter_name_en: 'Ahmed Al-Rashid',
  promoter_name_ar: 'أحمد الراشد',
  job_title: 'Senior Software Engineer',
  work_location: 'Riyadh, Kingdom of Saudi Arabia',
  email: 'ahmed.alrashid@example.com',
  start_date: '2024-01-15',
  end_date: '2024-12-31',
  contract_number: `CONTRACT-${Date.now()}`,
  id_card_number: '1234567890',
  promoter_id_card_url: 'https://example.com/documents/id-card-ahmed.jpg',
  promoter_passport_url: 'https://example.com/documents/passport-ahmed.jpg',
  pdf_url: 'https://example.com/contracts/contract-template.pdf',
  // Additional fields that might be expected
  contract_type: 'Employment Contract',
  contract_value: 150000,
  payment_terms: 'Monthly',
  content_english: 'This is a sample employment contract...',
  content_spanish: 'Este es un contrato de empleo de muestra...',
  // Metadata
  created_at: new Date().toISOString(),
  test_mode: true,
  source: 'contract-generator-test'
};

const headers = {
  'Content-Type': 'application/json',
  'User-Agent': 'Contract-Generator-App/1.0',
  'X-Trigger-Source': 'contract-generator',
  'X-Contract-ID': realisticPayload.contract_id,
  'X-Timestamp': new Date().toISOString(),
  'X-Test-Mode': 'true'
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

    req.write(JSON.stringify(realisticPayload));
    req.end();
  });
}

async function testRealisticWebhook() {
  try {
    console.log('\n📤 Sending realistic contract data...');
    console.log('Contract ID:', realisticPayload.contract_id);
    console.log('Contract Number:', realisticPayload.contract_number);
    
    const response = await makeRequest();
    
    console.log('\n✅ Webhook test completed!');
    console.log('Status Code:', response.statusCode);
    console.log('Response Body:', response.body);
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      console.log('\n🎉 Webhook accepted the realistic data!');
      console.log('✅ Check your Make.com scenario execution history.');
      console.log('✅ Look for an execution with this contract ID:', realisticPayload.contract_id);
      
      if (response.body.toLowerCase().includes('accepted')) {
        console.log('✅ Make.com confirmed acceptance of the request.');
      }
      
      console.log('\n📋 Next Steps:');
      console.log('1. Go to your Make.com scenario');
      console.log('2. Check the "Execution history" tab');
      console.log('3. Look for an execution with timestamp:', new Date().toLocaleString());
      console.log('4. If you see an execution, the automatic trigger is working');
      console.log('5. If no execution appears, follow the troubleshooting guide');
      
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
testRealisticWebhook();
