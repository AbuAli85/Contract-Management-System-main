const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔧 Fixing contract schema...')

async function fixContractSchema() {
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
  
  try {
    // Check current schema
    console.log('1. Checking current schema...')
    const { data: columns, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'contracts')
    
    if (schemaError) {
      console.error('❌ Schema check failed:', schemaError.message)
      return
    }
    
    const columnNames = columns.map(col => col.column_name)
    console.log('Current columns:', columnNames)
    
    // Check if we need to migrate
    const hasOldColumns = columnNames.includes('employer_id') || columnNames.includes('client_id')
    const hasNewColumns = columnNames.includes('first_party_id') || columnNames.includes('second_party_id')
    
    if (hasOldColumns && !hasNewColumns) {
      console.log('2. Running migration: renaming columns...')
      
      // Rename columns
      if (columnNames.includes('employer_id')) {
        const { error } = await supabase.rpc('exec_sql', { 
          sql: 'ALTER TABLE contracts RENAME COLUMN employer_id TO first_party_id;' 
        })
        if (error) {
          console.error('❌ Failed to rename employer_id:', error.message)
        } else {
          console.log('✅ Renamed employer_id to first_party_id')
        }
      }
      
      if (columnNames.includes('client_id')) {
        const { error } = await supabase.rpc('exec_sql', { 
          sql: 'ALTER TABLE contracts RENAME COLUMN client_id TO second_party_id;' 
        })
        if (error) {
          console.error('❌ Failed to rename client_id:', error.message)
        } else {
          console.log('✅ Renamed client_id to second_party_id')
        }
      }
      
    } else if (hasNewColumns) {
      console.log('✅ Schema already uses new column names')
    } else {
      console.log('⚠️  Neither old nor new columns found - may need to create them')
    }
    
    // Test a simple query
    console.log('3. Testing contract query...')
    const { data: testData, error: testError } = await supabase
      .from('contracts')
      .select('id, first_party_id, second_party_id, promoter_id')
      .limit(1)
    
    if (testError) {
      console.error('❌ Test query failed:', testError.message)
    } else {
      console.log('✅ Test query successful:', testData[0])
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

fixContractSchema()
