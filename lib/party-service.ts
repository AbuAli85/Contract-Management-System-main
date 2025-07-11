import { supabase } from "./supabase"
import type { Party } from "./types"

/**
 * Fetch parties with their active contract counts
 */
export async function fetchPartiesWithContractCount(): Promise<Party[]> {
  try {
    // Fetch parties
    const { data: partiesData, error: partiesError } = await supabase
      .from("parties")
      .select("*")
      .order("name_en")

    if (partiesError) {
      throw new Error(`Error fetching parties: ${partiesError.message}`)
    }

    // Fetch contract counts for each party
    const enhancedData = await Promise.all(
      (partiesData || []).map(async (party) => {
        try {
          const { count: contractCount, error: contractError } = await supabase
            .from("contracts")
            .select("*", { count: "exact", head: true })
            .or(`first_party_id.eq.${party.id},second_party_id.eq.${party.id}`)
            .eq("status", "active")

          if (contractError) {
            console.warn(`Error fetching contracts for party ${party.id}:`, contractError)
          }

          return {
            ...party,
            contract_count: contractCount || 0,
          }
        } catch (error) {
          console.warn(`Error processing party ${party.id}:`, error)
          return {
            ...party,
            contract_count: 0,
          }
        }
      })
    )

    return enhancedData
  } catch (error) {
    console.error("Error in fetchPartiesWithContractCount:", error)
    throw error
  }
}

/**
 * Delete multiple parties by IDs
 */
export async function deleteParties(partyIds: string[]): Promise<void> {
  const { error } = await supabase.from("parties").delete().in("id", partyIds)

  if (error) {
    throw new Error(`Error deleting parties: ${error.message}`)
  }
}

/**
 * Update party status
 */
export async function updatePartyStatus(
  partyId: string,
  status: "Active" | "Inactive" | "Suspended"
): Promise<void> {
  try {
    const { error } = await supabase.from("parties").update({ status }).eq("id", partyId)

    if (error) {
      throw new Error(`Error updating party status: ${error.message}`)
    }
  } catch (error) {
    console.error("Error updating party status:", error)
    throw error
  }
}

/**
 * Bulk update party statuses
 */
export async function bulkUpdatePartyStatus(
  partyIds: string[],
  status: "Active" | "Inactive" | "Suspended"
): Promise<void> {
  try {
    const { error } = await supabase.from("parties").update({ status }).in("id", partyIds)

    if (error) {
      throw new Error(`Error bulk updating party status: ${error.message}`)
    }
  } catch (error) {
    console.error("Error bulk updating party status:", error)
    throw error
  }
}

/**
 * Get parties with expiring documents
 */
export async function getPartiesWithExpiringDocuments(daysAhead: number = 30): Promise<Party[]> {
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + daysAhead)

  const { data, error } = await supabase
    .from("parties")
    .select("*")
    .or(
      `cr_expiry_date.lte.${futureDate.toISOString()},license_expiry_date.lte.${futureDate.toISOString()}`
    )
    .order("cr_expiry_date", { ascending: true })

  if (error) {
    throw new Error(`Error fetching parties with expiring documents: ${error.message}`)
  }

  return data || []
}

/**
 * Search parties by text
 */
export async function searchParties(searchTerm: string): Promise<Party[]> {
  const { data, error } = await supabase
    .from("parties")
    .select("*")
    .or(
      `name_en.ilike.%${searchTerm}%,name_ar.ilike.%${searchTerm}%,crn.ilike.%${searchTerm}%,contact_person.ilike.%${searchTerm}%`
    )
    .order("name_en")

  if (error) {
    throw new Error(`Error searching parties: ${error.message}`)
  }

  return data || []
}

/**
 * Get party activity summary
 */
export async function getPartyActivitySummary(partyId: string) {
  try {
    // Get contracts count where party is involved
    const { count: contractsCount, error: contractsError } = await supabase
      .from("contracts")
      .select("*", { count: "exact", head: true })
      .or(`first_party_id.eq.${partyId},second_party_id.eq.${partyId}`)

    if (contractsError) {
      console.warn("Error fetching contracts count:", contractsError)
    }

    // Get recent contracts
    const { data: recentContracts, error: recentError } = await supabase
      .from("contracts")
      .select("id, created_at, status, first_party_name_en, second_party_name_en, promoter_name_en")
      .or(`first_party_id.eq.${partyId},second_party_id.eq.${partyId}`)
      .order("created_at", { ascending: false })
      .limit(5)

    if (recentError) {
      console.warn("Error fetching recent contracts:", recentError)
    }

    // Get contracts by status
    const { data: contractsByStatus, error: statusError } = await supabase
      .from("contracts")
      .select("status")
      .or(`first_party_id.eq.${partyId},second_party_id.eq.${partyId}`)

    if (statusError) {
      console.warn("Error fetching contracts by status:", statusError)
    }

    const statusCounts = (contractsByStatus || []).reduce(
      (acc, contract) => {
        acc[contract.status || "unknown"] = (acc[contract.status || "unknown"] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return {
      contracts_count: contractsCount || 0,
      recent_contracts: recentContracts || [],
      status_breakdown: statusCounts,
    }
  } catch (error) {
    console.error("Error getting party activity summary:", error)
    return {
      contracts_count: 0,
      recent_contracts: [],
      status_breakdown: {},
    }
  }
}

/**
 * Get parties by type
 */
export async function getPartiesByType(): Promise<Record<string, number>> {
  try {
    const { data, error } = await supabase.from("parties").select("type")

    if (error) {
      throw new Error(`Error fetching parties by type: ${error.message}`)
    }

    const typeCounts = (data || []).reduce(
      (acc, party) => {
        const type = party.type || "unknown"
        acc[type] = (acc[type] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return typeCounts
  } catch (error) {
    console.error("Error getting parties by type:", error)
    return {}
  }
}

/**
 * Get document expiry alerts
 */
export async function getDocumentExpiryAlerts(daysAhead: number = 30) {
  try {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + daysAhead)

    const { data: crExpiring, error: crError } = await supabase
      .from("parties")
      .select("id, name_en, name_ar, crn, cr_expiry_date")
      .not("cr_expiry_date", "is", null)
      .lte("cr_expiry_date", futureDate.toISOString())
      .order("cr_expiry_date", { ascending: true })

    if (crError) {
      console.warn("Error fetching CR expiry alerts:", crError)
    }

    const { data: licenseExpiring, error: licenseError } = await supabase
      .from("parties")
      .select("id, name_en, name_ar, crn, license_expiry_date")
      .not("license_expiry_date", "is", null)
      .lte("license_expiry_date", futureDate.toISOString())
      .order("license_expiry_date", { ascending: true })

    if (licenseError) {
      console.warn("Error fetching license expiry alerts:", licenseError)
    }

    return {
      cr_expiring: crExpiring || [],
      license_expiring: licenseExpiring || [],
    }
  } catch (error) {
    console.error("Error getting document expiry alerts:", error)
    return {
      cr_expiring: [],
      license_expiring: [],
    }
  }
}

/**
 * Validate unique CRN
 */
export async function validateUniqueCRN(crn: string, excludeId?: string): Promise<boolean> {
  try {
    let query = supabase.from("parties").select("id").eq("crn", crn)

    if (excludeId) {
      query = query.neq("id", excludeId)
    }

    const { data, error } = await query

    if (error) {
      console.warn("Error validating CRN:", error)
      return true // Allow on error to avoid blocking
    }

    return (data || []).length === 0
  } catch (error) {
    console.warn("Error validating CRN:", error)
    return true
  }
}

/**
 * Get party status analytics
 */
export async function getPartyStatusAnalytics() {
  try {
    const { data, error } = await supabase.from("parties").select("status, type, created_at")

    if (error) {
      throw new Error(`Error fetching party status analytics: ${error.message}`)
    }

    const analytics = (data || []).reduce(
      (acc, party) => {
        const status = party.status || "Unknown"
        const type = party.type || "Unknown"

        // Status counts
        acc.statusCounts[status] = (acc.statusCounts[status] || 0) + 1

        // Type breakdown by status
        if (!acc.typeBreakdown[type]) {
          acc.typeBreakdown[type] = {}
        }
        acc.typeBreakdown[type][status] = (acc.typeBreakdown[type][status] || 0) + 1

        // Monthly trends (last 6 months)
        if (party.created_at) {
          const month = new Date(party.created_at).toISOString().slice(0, 7) // YYYY-MM
          if (!acc.monthlyTrends[month]) {
            acc.monthlyTrends[month] = {}
          }
          acc.monthlyTrends[month][status] = (acc.monthlyTrends[month][status] || 0) + 1
        }

        return acc
      },
      {
        statusCounts: {} as Record<string, number>,
        typeBreakdown: {} as Record<string, Record<string, number>>,
        monthlyTrends: {} as Record<string, Record<string, number>>,
      }
    )

    return {
      total: data?.length || 0,
      ...analytics,
    }
  } catch (error) {
    console.error("Error getting party status analytics:", error)
    return {
      total: 0,
      statusCounts: {},
      typeBreakdown: {},
      monthlyTrends: {},
    }
  }
}

/**
 * Get parties requiring attention (inactive with active contracts, etc.)
 */
export async function getPartiesRequiringAttention(): Promise<{
  inactiveWithContracts: Party[]
  suspendedWithContracts: Party[]
  activeWithoutContracts: Party[]
}> {
  try {
    // Get all parties with their contract counts
    const parties = await fetchPartiesWithContractCount()

    const inactiveWithContracts = parties.filter(
      (party) => party.status === "Inactive" && (party.contract_count || 0) > 0
    )

    const suspendedWithContracts = parties.filter(
      (party) => party.status === "Suspended" && (party.contract_count || 0) > 0
    )

    const activeWithoutContracts = parties.filter(
      (party) => party.status === "Active" && (party.contract_count || 0) === 0
    )

    return {
      inactiveWithContracts,
      suspendedWithContracts,
      activeWithoutContracts,
    }
  } catch (error) {
    console.error("Error getting parties requiring attention:", error)
    return {
      inactiveWithContracts: [],
      suspendedWithContracts: [],
      activeWithoutContracts: [],
    }
  }
}

/**
 * Export party status report
 */
export async function exportPartyStatusReport(): Promise<string> {
  try {
    const parties = await fetchPartiesWithContractCount()
    const analytics = await getPartyStatusAnalytics()

    // Create CSV content
    const headers = [
      "ID",
      "Name (EN)",
      "Name (AR)",
      "CRN",
      "Type",
      "Status",
      "Contact Person",
      "Email",
      "Phone",
      "Active Contracts",
      "Created At",
    ]

    const rows = parties.map((party) => [
      party.id,
      party.name_en || "",
      party.name_ar || "",
      party.crn || "",
      party.type || "",
      party.status || "",
      party.contact_person || "",
      party.contact_email || "",
      party.contact_phone || "",
      party.contract_count || 0,
      party.created_at || "",
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n")

    return csvContent
  } catch (error) {
    console.error("Error exporting party status report:", error)
    throw error
  }
}
