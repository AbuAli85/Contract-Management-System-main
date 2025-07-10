import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function debugDatabase() {
  console.log('🔍 Debugging database structure...')

  try {
    // Check contracts table
    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select('*')
      .limit(1)

    console.log('📋 Contracts table sample:', contracts)
    console.log('❌ Contracts error:', contractsError)

    // Check companies table
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .limit(5)

    console.log('🏢 Companies table sample:', companies)
    console.log('❌ Companies error:', companiesError)

    // Check promoters table
    const { data: promoters, error: promotersError } = await supabase
      .from('promoters')
      .select('*')
      .limit(5)

    console.log('👤 Promoters table sample:', promoters)
    console.log('❌ Promoters error:', promotersError)

    // Check relationships
    if (contracts && contracts.length > 0) {
      const contract = contracts[0]
      console.log('🔗 Contract relationships:', {
        employer_company_id: contract.employer_company_id,
        client_company_id: contract.client_company_id,
        promoter_id: contract.promoter_id
      })
    }

  } catch (error) {
    console.error('💥 Database debug error:', error)
  }
}

// Run the debug function
debugDatabase()