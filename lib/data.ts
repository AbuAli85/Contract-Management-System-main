import type { ContractWithRelations } from "@/hooks/use-contracts"
import { supabase } from "@/lib/supabase"

export const getContract = async (contractId: string): Promise<ContractWithRelations | null> => {
  if (!contractId) {
    console.warn("getContract called with no contractId")
    return null
  }

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
    .eq("id", contractId)
    .single()

  if (error) {
    console.error("Error fetching contract:", error.message)
    // Consider how to handle errors. Throwing might be appropriate for React Query's error state.
    // If the error is because the contract doesn't exist (e.g., RLS or actual missing row),
    // Supabase often returns a specific error code or null data.
    if (error.code === "PGRST116") {
      // PGRST116: "The result contains 0 rows"
      return null // Contract not found
    }
    throw error
  }
  return data as ContractWithRelations | null
}
