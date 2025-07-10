#!/usr/bin/env node

/**
 * Comprehensive webhook debugging script
 * This helps identify what's preventing full automation
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

console.log('🔍 Comprehensive Webhook Debugging...');
console.log('URL:', webhookUrl);
console.log('Secret configured:', !!webhookSecret);

// Test different payload variations to identify the issue
const testPayloads = [
  {
    name: 'Minimal Payload',
    data: {
      test: 'minimal',
      timestamp: new Date().toISOString()
    }
  },
  {
    name: 'Basic Contract Data',
    data: {
      contract_id: `debug-${Date.now()}`,
      first_party_name_en: 'Test Client',
      second_party_name_en: 'Test Employer',
      promoter_name_en: 'Test Promoter',
      email: 'test@example.com',
      contract_number: `CONTRACT-${Date.now()}`,
      start_date: '2024-01-01',
      end_date: '2024-12-31'
    }
  },
  {
    name: 'Full Contract Data (No Arabic)',
    data: {
      contract_id: `debug-full-${Date.now()}`,
      first_party_name_en: 'Saudi Technology Solutions Co.',
      first_party_crn: '4030000001',
      second_party_name_en: 'Riyadh Development Company',
      second_party_crn: '4030000002',
      promoter_name_en: 'Ahmed Al-Rashid',
      job_title: 'Senior Software Engineer',
      work_location: 'Riyadh, Kingdom of Saudi Arabia',
      email: 'ahmed.alrashid@example.com',
      start_date: '2024-01-15',
      end_date: '2024-12-31',
      contract_number: `CONTRACT-${Date.now()}`,
      id_card_number: '1234567890',
      promoter_id_card_url: 'https://example.com/id-card.jpg',
      promoter_passport_url: 'https://example.com/passport.jpg',
      pdf_url: 'https://example.com/contract.pdf',
      contract_type: 'Employment Contract',
      contract_value: 150000,
      payment_terms: 'Monthly'
    }
  },
  {
    name: 'Full Contract Data (With Arabic)',
    data: {
      contract_id: `debug-arabic-${Date.now()}`,
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
      promoter_id_card_url: 'https://example.com/id-card.jpg',
      promoter_passport_url: 'https://example.com/passport.jpg',
      pdf_url: 'https://example.com/contract.pdf',
      contract_type: 'Employment Contract',
      contract_value: 150000,
      payment_terms: 'Monthly',
      content_english: 'This is a sample employment contract...',
      content_spanish: 'Este es un contrato de empleo de muestra...'
    }
  }
];

const headers = {
  'Content-Type': 'application/json',
  'User-Agent': 'Contract-Generator-App/1.0',
  'X-Trigger-Source': 'contract-generator',
  'X-Timestamp': new Date().toISOString(),
  'X-Debug-Mode': 'true'
};

if (webhookSecret) {
  headers['X-Webhook-Secret'] = webhookSecret;
}

function makeRequest(payload, testName) {
  return new Promise((resolve, reject) => {
    const url = new URL(webhookUrl);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestHeaders = { ...headers };
    if (payload.contract_id) {
      requestHeaders['X-Contract-ID'] = payload.contract_id;
    }
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers: requestHeaders,
      timeout: 30000
    };

    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          testName,
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          payload: payload
        });
      });
    });

    req.on('error', (error) => {
      reject({ testName, error });
    });

    req.on('timeout', () => {
      req.destroy();
      reject({ testName, error: new Error('Request timeout') });
    });

    req.write(JSON.stringify(payload));
    req.end();
  });
}

async function runDebugTests() {
  console.log('\n🔬 Running comprehensive webhook tests...\n');
  
  const results = [];
  
  for (const test of testPayloads) {
    try {
      console.log(`📤 Testing: ${test.name}`);
      console.log(`   Contract ID: ${test.data.contract_id || 'N/A'}`);
      
      const result = await makeRequest(test.data, test.name);
      results.push(result);
      
      console.log(`   ✅ Status: ${result.statusCode}`);
      console.log(`   📄 Response: ${result.body.substring(0, 100)}${result.body.length > 100 ? '...' : ''}`);
      
      // Wait 2 seconds between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.error.message}`);
      results.push({ testName: test.name, error: error.error });
    }
    
    console.log('');
  }
  
  // Analyze results
  console.log('📊 Analysis Results:');
  console.log('===================');
  
  const successfulTests = results.filter(r => !r.error && r.statusCode >= 200 && r.statusCode < 300);
  const failedTests = results.filter(r => r.error || (r.statusCode < 200 || r.statusCode >= 300));
  
  console.log(`✅ Successful tests: ${successfulTests.length}/${results.length}`);
  console.log(`❌ Failed tests: ${failedTests.length}/${results.length}`);
  
  if (successfulTests.length > 0) {
    console.log('\n🎯 Recommendations:');
    console.log('==================');
    
    // Check if minimal payload works but full payload doesn't
    const minimalWorks = successfulTests.some(r => r.testName === 'Minimal Payload');
    const basicWorks = successfulTests.some(r => r.testName === 'Basic Contract Data');
    const fullWorks = successfulTests.some(r => r.testName === 'Full Contract Data (No Arabic)');
    const arabicWorks = successfulTests.some(r => r.testName === 'Full Contract Data (With Arabic)');
    
    if (minimalWorks && !fullWorks) {
      console.log('⚠️  Issue: Make.com scenario may have data validation issues');
      console.log('💡 Solution: Check Make.com scenario for required field validation');
    }
    
    if (fullWorks && !arabicWorks) {
      console.log('⚠️  Issue: Arabic characters may be causing problems');
      console.log('💡 Solution: Check Make.com scenario for character encoding issues');
    }
    
    if (basicWorks && !fullWorks) {
      console.log('⚠️  Issue: Some fields in the full payload may be causing issues');
      console.log('💡 Solution: Check which specific fields are causing problems');
    }
    
    console.log('\n🔍 Next Steps:');
    console.log('1. Check Make.com execution history for each test');
    console.log('2. Look for any error messages in Make.com logs');
    console.log('3. Verify which payload format works best');
    console.log('4. Update your application to use the working payload format');
  }
  
  if (failedTests.length > 0) {
    console.log('\n❌ Failed Tests Details:');
    failedTests.forEach(test => {
      console.log(`   - ${test.testName}: ${test.error?.message || `Status ${test.statusCode}`}`);
    });
  }
  
  console.log('\n📋 Manual Check Required:');
  console.log('1. Go to your Make.com scenario');
  console.log('2. Check "Execution history" for each test');
  console.log('3. Look for any error messages or failed executions');
  console.log('4. Note which tests triggered automatic execution');
}

// Run the debug tests
runDebugTests();
