const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testContractData() {
  console.log('🔍 Testing contract data structure...\n')
  
  try {
    // Test 1: Basic contracts query
    console.log('1. Testing basic contracts query...')
    const { data: basicContracts, error: basicError } = await supabase
      .from('contracts')
      .select('*')
      .limit(1)
    
    if (basicError) {
      console.error('❌ Basic contracts query failed:', basicError.message)
      return
    }
    
    console.log('✅ Basic contracts query successful')
    console.log('Sample contract fields:', Object.keys(basicContracts[0] || {}))
    console.log('Sample contract data:', basicContracts[0])
    console.log()

    // Test 2: Contracts with relations
    console.log('2. Testing contracts with relations...')
    const { data: relationContracts, error: relationError } = await supabase
      .from('contracts')
      .select(`
        *,
        first_party:parties!contracts_first_party_id_fkey(id,name_en,name_ar,crn,type),
        second_party:parties!contracts_second_party_id_fkey(id,name_en,name_ar,crn,type),
        promoters(id,name_en,name_ar,id_card_number,id_card_url,passport_url,status)
      `)
      .limit(1)
    
    if (relationError) {
      console.error('❌ Relations query failed:', relationError.message)
      console.error('Error details:', relationError)
      
      // Test individual tables
      console.log('\n3. Testing individual tables...')
      
      const { data: parties, error: partiesError } = await supabase
        .from('parties')
        .select('*')
        .limit(2)
      
      if (partiesError) {
        console.error('❌ Parties table error:', partiesError.message)
      } else {
        console.log('✅ Parties table accessible, sample:', parties[0])
      }
      
      const { data: promoters, error: promotersError } = await supabase
        .from('promoters')
        .select('*')
        .limit(2)
      
      if (promotersError) {
        console.error('❌ Promoters table error:', promotersError.message)
      } else {
        console.log('✅ Promoters table accessible, sample:', promoters[0])
      }
      
      return
    }
    
    console.log('✅ Relations query successful')
    console.log('Sample contract with relations:', relationContracts[0])
    
    // Check what relations actually contain
    if (relationContracts[0]) {
      const contract = relationContracts[0]
      console.log('\n📋 Relationship data:')
      console.log('- first_party:', contract.first_party)
      console.log('- second_party:', contract.second_party)
      console.log('- promoters:', contract.promoters)
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

testContractData()
