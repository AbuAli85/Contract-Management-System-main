require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function updateContractSimple() {
  console.log('🔄 Updating contract with basic fields only...')
  
  try {
    // First check the current state
    console.log('📋 Current contract state:')
    const { data: currentData } = await supabase
      .from('contracts')
      .select('id, job_title, department, contract_type, work_location')
      .eq('id', '841caf76-9429-4845-adc9-4475c02778ce')
      .single()
    
    console.log(currentData)
    
    // Update only the essential fields one by one
    console.log('\n🔄 Updating job_title...')
    const { error: error1 } = await supabase
      .from('contracts')
      .update({ job_title: 'Senior Software Engineer' })
      .eq('id', '841caf76-9429-4845-adc9-4475c02778ce')
    
    if (error1) {
      console.error('❌ Error updating job_title:', error1)
      return
    }
    
    console.log('🔄 Updating department...')
    const { error: error2 } = await supabase
      .from('contracts')
      .update({ department: 'Technology' })
      .eq('id', '841caf76-9429-4845-adc9-4475c02778ce')
    
    if (error2) {
      console.error('❌ Error updating department:', error2)
      return
    }
    
    console.log('🔄 Updating contract_type...')
    const { error: error3 } = await supabase
      .from('contracts')
      .update({ contract_type: 'Full-time' })
      .eq('id', '841caf76-9429-4845-adc9-4475c02778ce')
    
    if (error3) {
      console.error('❌ Error updating contract_type:', error3)
      return
    }
    
    console.log('✅ All updates completed successfully!')
    
    // Verify the final state
    console.log('\n📋 Final contract state:')
    const { data: finalData } = await supabase
      .from('contracts')
      .select('id, job_title, department, contract_type, work_location')
      .eq('id', '841caf76-9429-4845-adc9-4475c02778ce')
      .single()
    
    console.log(finalData)
    
  } catch (err) {
    console.error('❌ Script error:', err)
  }
}

updateContractSimple()
