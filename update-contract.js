require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function updateContract() {
  console.log('🔄 Updating contract: 841caf76-9429-4845-adc9-4475c02778ce')
  
  try {
    const { data, error } = await supabase
      .from('contracts')
      .update({
        job_title: 'Senior Software Engineer',
        department: 'Technology',
        contract_type: 'Full-time',
        contract_start_date: '2025-01-01',
        contract_end_date: '2027-01-01',
        work_location: 'Dubai Office - Technology Center',
        email: 'senior.engineer@alamri.com'
      })
      .eq('id', '841caf76-9429-4845-adc9-4475c02778ce')
      .select()
      .single()
    
    if (error) {
      console.error('❌ Error updating contract:', error)
      return
    }
    
    console.log('✅ Contract updated successfully!')
    console.log('📋 Updated fields:')
    console.log('- job_title:', data.job_title)
    console.log('- department:', data.department)
    console.log('- contract_type:', data.contract_type)
    console.log('- contract_start_date:', data.contract_start_date)
    console.log('- contract_end_date:', data.contract_end_date)
    console.log('- work_location:', data.work_location)
    console.log('- email:', data.email)
    
  } catch (err) {
    console.error('❌ Script error:', err)
  }
}

updateContract()
