import { supabase } from "./supabase"
import type { Promoter } from "./types"

/**
 * Fetch promoters with their active contract counts
 */
export async function fetchPromotersWithContractCount(): Promise<Promoter[]> {
  try {
    // Fetch promoters
    const { data: promotersData, error: promotersError } = await supabase
      .from("promoters")
      .select("*")
      .order("name_en")

    if (promotersError) {
      throw new Error(`Error fetching promoters: ${promotersError.message}`)
    }

    // Fetch contract counts for each promoter
    const enhancedData = await Promise.all(
      (promotersData || []).map(async (promoter) => {
        try {
          const { count: contractCount, error: contractError } = await supabase
            .from("contracts")
            .select("*", { count: "exact", head: true })
            .eq("promoter_id", promoter.id)
            .eq("status", "active")

          if (contractError) {
            console.warn(`Error fetching contracts for promoter ${promoter.id}:`, contractError)
          }

          return {
            ...promoter,
            active_contracts_count: contractCount || 0
          }
        } catch (error) {
          console.warn(`Error processing promoter ${promoter.id}:`, error)
          return {
            ...promoter,
            active_contracts_count: 0
          }
        }
      })
    )

    return enhancedData
  } catch (error) {
    console.error("Error in fetchPromotersWithContractCount:", error)
    throw error
  }
}

/**
 * Delete multiple promoters by IDs
 */
export async function deletePromoters(promoterIds: string[]): Promise<void> {
  const { error } = await supabase
    .from("promoters")
    .delete()
    .in("id", promoterIds)

  if (error) {
    throw new Error(`Error deleting promoters: ${error.message}`)
  }
}

/**
 * Update promoter status
 */
export async function updatePromoterStatus(
  promoterId: string, 
  status: string
): Promise<void> {
  const { error } = await supabase
    .from("promoters")
    .update({ status })
    .eq("id", promoterId)

  if (error) {
    throw new Error(`Error updating promoter status: ${error.message}`)
  }
}

/**
 * Bulk update promoter statuses
 */
export async function bulkUpdatePromoterStatus(
  promoterIds: string[], 
  status: string
): Promise<void> {
  const { error } = await supabase
    .from("promoters")
    .update({ status })
    .in("id", promoterIds)

  if (error) {
    throw new Error(`Error bulk updating promoter status: ${error.message}`)
  }
}

/**
 * Get promoters with expiring documents
 */
export async function getPromotersWithExpiringDocuments(
  daysAhead: number = 30
): Promise<Promoter[]> {
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + daysAhead)
  
  const { data, error } = await supabase
    .from("promoters")
    .select("*")
    .or(`id_card_expiry_date.lte.${futureDate.toISOString()},passport_expiry_date.lte.${futureDate.toISOString()}`)
    .order("id_card_expiry_date", { ascending: true })

  if (error) {
    throw new Error(`Error fetching promoters with expiring documents: ${error.message}`)
  }

  return data || []
}

/**
 * Search promoters by text
 */
export async function searchPromoters(searchTerm: string): Promise<Promoter[]> {
  const { data, error } = await supabase
    .from("promoters")
    .select("*")
    .or(`name_en.ilike.%${searchTerm}%,name_ar.ilike.%${searchTerm}%,id_card_number.ilike.%${searchTerm}%`)
    .order("name_en")

  if (error) {
    throw new Error(`Error searching promoters: ${error.message}`)
  }

  return data || []
}

/**
 * Get promoter activity summary
 */
export async function getPromoterActivitySummary(promoterId: string) {
  try {
    // Get contracts count
    const { count: contractsCount, error: contractsError } = await supabase
      .from("contracts")
      .select("*", { count: "exact", head: true })
      .eq("promoter_id", promoterId)

    if (contractsError) {
      console.warn("Error fetching contracts count:", contractsError)
    }

    // Get recent contracts
    const { data: recentContracts, error: recentError } = await supabase
      .from("contracts")
      .select("id, created_at, status, first_party_name_en, second_party_name_en")
      .eq("promoter_id", promoterId)
      .order("created_at", { ascending: false })
      .limit(5)

    if (recentError) {
      console.warn("Error fetching recent contracts:", recentError)
    }

    return {
      contracts_count: contractsCount || 0,
      recent_contracts: recentContracts || [],
    }
  } catch (error) {
    console.error("Error getting promoter activity summary:", error)
    return {
      contracts_count: 0,
      recent_contracts: [],
    }
  }
}
