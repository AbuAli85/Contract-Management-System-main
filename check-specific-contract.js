require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkSpecificContract() {
  console.log('🔍 Checking specific contract: 841caf76-9429-4845-adc9-4475c02778ce')
  
  try {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', '841caf76-9429-4845-adc9-4475c02778ce')
      .single()
    
    if (error) {
      console.error('❌ Error:', error)
      return
    }
    
    if (!data) {
      console.log('❌ No contract found')
      return
    }
    
    console.log('📋 Contract Field Analysis:')
    console.log('- job_title:', JSON.stringify(data.job_title), `(${typeof data.job_title})`)
    console.log('- department:', JSON.stringify(data.department), `(${typeof data.department})`)
    console.log('- contract_type:', JSON.stringify(data.contract_type), `(${typeof data.contract_type})`)
    console.log('- contract_start_date:', JSON.stringify(data.contract_start_date), `(${typeof data.contract_start_date})`)
    console.log('- contract_end_date:', JSON.stringify(data.contract_end_date), `(${typeof data.contract_end_date})`)
    console.log('- pdf_url:', JSON.stringify(data.pdf_url), `(${typeof data.pdf_url})`)
    console.log('- first_party_id:', JSON.stringify(data.first_party_id), `(${typeof data.first_party_id})`)
    console.log('- second_party_id:', JSON.stringify(data.second_party_id), `(${typeof data.second_party_id})`)
    
    console.log('\n📋 Full Contract Data:')
    console.log(JSON.stringify(data, null, 2))
    
  } catch (err) {
    console.error('❌ Script error:', err)
  }
}

checkSpecificContract()
