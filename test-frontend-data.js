// Test what the frontend hooks are returning
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

console.log('🔍 Starting frontend data test...')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Environment check:')
console.log('- SUPABASE_URL exists:', !!supabaseUrl)
console.log('- SUPABASE_KEY exists:', !!supabaseKey)

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('Available env vars:', Object.keys(process.env).filter(key => key.includes('SUPABASE')))
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testFrontendData() {
  console.log('🔍 Testing frontend data queries...')
  
  // Test the exact query from useContract hook
  console.log('\n1. Testing useContract query (new schema)...')
  try {
    const { data, error } = await supabase
      .from("contracts")
      .select(
        `
        *,
        first_party:parties!contracts_first_party_id_fkey(id,name_en,name_ar,crn,type),
        second_party:parties!contracts_second_party_id_fkey(id,name_en,name_ar,crn,type),
        promoters(id,name_en,name_ar,id_card_number,id_card_url,passport_url,status)
      `,
      )
      .limit(1)
      .single()

    if (error) {
      console.log('❌ New schema failed:', error.message)
      
      // Try old schema
      console.log('Trying old schema...')
      const { data: oldData, error: oldError } = await supabase
        .from("contracts")
        .select(
          `
          *,
          first_party:parties!contracts_employer_id_fkey(id,name_en,name_ar,crn,type),
          second_party:parties!contracts_client_id_fkey(id,name_en,name_ar,crn,type),
          promoters(id,name_en,name_ar,id_card_number,id_card_url,passport_url,status)
        `,
        )
        .limit(1)
        .single()
      
      if (oldError) {
        console.log('❌ Both schemas failed:', oldError.message)
        return
      }
      
      console.log('✅ Old schema worked!')
      console.log('📊 Sample data structure:')
      console.log('Job Title:', oldData.job_title)
      console.log('Department:', oldData.department)
      console.log('Contract Type:', oldData.contract_type)
      console.log('First Party ID:', oldData.first_party_id)
      console.log('Second Party ID:', oldData.second_party_id)
      console.log('First Party:', oldData.first_party)
      console.log('Second Party:', oldData.second_party)
      
    } else {
      console.log('✅ New schema worked!')
      console.log('📊 Sample data structure:')
      console.log('Job Title:', data.job_title)
      console.log('Department:', data.department)
      console.log('Contract Type:', data.contract_type)
      console.log('First Party ID:', data.first_party_id)
      console.log('Second Party ID:', data.second_party_id)
      console.log('First Party:', data.first_party)
      console.log('Second Party:', data.second_party)
    }
    
  } catch (err) {
    console.error('❌ Test failed:', err.message)
  }
}

testFrontendData().catch(console.error)
