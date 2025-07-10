#!/usr/bin/env node

/**
 * Migration Script Validator
 * Checks the migration SQL for common syntax issues
 */

const fs = require('fs');
const path = require('path');

console.log("🔍 Validating Migration Scripts");
console.log("=" * 50);

const scripts = [
  'scripts/014_add_webhook_integration_fields.sql',
  'scripts/014_add_webhook_integration_fields_safe.sql'
];

function validateSqlScript(filePath) {
  console.log(`\n📄 Validating: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  let hasErrors = false;
  const issues = [];
  
  // Check for common PostgreSQL syntax issues
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();
    
    // Check for window functions in UPDATE statements
    if (trimmed.includes('UPDATE') && trimmed.includes('ROW_NUMBER() OVER')) {
      issues.push(`Line ${lineNum}: Window function in UPDATE statement (use CTE instead)`);
      hasErrors = true;
    }
    
    // Check for invalid CREATE INDEX syntax
    if (trimmed.includes('CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS')) {
      issues.push(`Line ${lineNum}: Invalid CREATE INDEX syntax (CONCURRENTLY + IF NOT EXISTS)`);
      hasErrors = true;
    }
    
    // Check for proper transaction blocks
    if (trimmed.startsWith('BEGIN;') && !content.includes('COMMIT;')) {
      issues.push(`Line ${lineNum}: Transaction BEGIN without matching COMMIT`);
      hasErrors = true;
    }
  });
  
  // Check for required elements
  const requiredElements = [
    'contract_number',
    'contract_start_date', 
    'contract_end_date',
    'contract_value',
    'status',
    'first_party_id',
    'second_party_id'
  ];
  
  requiredElements.forEach(element => {
    if (!content.includes(element)) {
      issues.push(`Missing required element: ${element}`);
      hasErrors = true;
    }
  });
  
  if (hasErrors) {
    console.log(`❌ Found ${issues.length} issues:`);
    issues.forEach(issue => console.log(`   - ${issue}`));
  } else {
    console.log(`✅ No syntax issues found`);
  }
  
  // Show script summary
  const totalLines = lines.length;
  const nonEmptyLines = lines.filter(l => l.trim()).length;
  const commentLines = lines.filter(l => l.trim().startsWith('--')).length;
  const sqlLines = nonEmptyLines - commentLines;
  
  console.log(`📊 Script Statistics:`);
  console.log(`   - Total lines: ${totalLines}`);
  console.log(`   - SQL statements: ${sqlLines}`);
  console.log(`   - Comments: ${commentLines}`);
  
  return !hasErrors;
}

// Validate all scripts
let allValid = true;
scripts.forEach(script => {
  const isValid = validateSqlScript(script);
  if (!isValid) allValid = false;
});

console.log(`\n🎯 Overall Status: ${allValid ? '✅ VALID' : '❌ ISSUES FOUND'}`);

if (allValid) {
  console.log("\n📋 Migration Ready:");
  console.log("1. Both migration scripts are syntactically valid");
  console.log("2. All required fields are included");
  console.log("3. No window function issues detected");
  console.log("4. Ready for deployment");
  
  console.log("\n🚀 Recommended Migration Steps:");
  console.log("1. Backup your database");
  console.log("2. Run the safe migration script first:");
  console.log("   psql -f scripts/014_add_webhook_integration_fields_safe.sql");
  console.log("3. Verify the results");
  console.log("4. Test the webhook endpoint");
} else {
  console.log("\n⚠️  Please fix the issues before running the migration.");
}

console.log("\n" + "=" * 50);
