import { supabase } from './lib/supabase'

// Simple test function to verify our frontend query works
export async function testContractQuery() {
  console.log('🔍 Testing contract query from frontend...')
  
  try {
    // Use the exact same query as useContract hook
    let { data, error } = await supabase
      .from("contracts")
      .select(
        `
        *,
        first_party:parties!contracts_first_party_id_fkey(id,name_en,name_ar,crn,type),
        second_party:parties!contracts_second_party_id_fkey(id,name_en,name_ar,crn,type),
        promoters(id,name_en,name_ar,id_card_number,id_card_url,passport_url,status)
      `,
      )
      .eq("id", "7c45528c-7082-423e-bb7c-3acaf210dc12")
      .single()

    // If the new schema fails, try the old schema
    if (error && error.message.includes('foreign key')) {
      console.log("New schema failed, trying old schema...")
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
        .eq("id", "7c45528c-7082-423e-bb7c-3acaf210dc12")
        .single()
      
      if (oldError) {
        console.log("Both schemas failed:", oldError)
        return null
      }
      
      data = oldData
      error = null
    }

    if (error) {
      console.log("Query failed:", error)
      return null
    }

    console.log("✅ Query successful!")
    console.log("📊 Contract data received:")
    console.log("- Job Title:", data.job_title)
    console.log("- Department:", data.department)
    console.log("- Contract Type:", data.contract_type)
    console.log("- First Party ID:", data.first_party_id)
    console.log("- Second Party ID:", data.second_party_id)
    console.log("- First Party:", data.first_party)
    console.log("- Second Party:", data.second_party)
    console.log("- Promoters:", data.promoters)
    
    return data
  } catch (err) {
    console.error("❌ Test failed:", err)
    return null
  }
}

// You can call this function from the browser console
window.testContractQuery = testContractQuery
