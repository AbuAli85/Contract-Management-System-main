"use server"

import { supabase } from "@/lib/supabase"
import { logAudit } from "@/lib/logger"
import { revalidatePath } from "next/cache"

// Contract Insert Type
export interface ContractInsert {
  id?: string
  contract_type: string
  party_a_id: string
  party_b_id: string
  promoter_id: string
  contract_start_date: string
  contract_end_date: string
  contract_value: number
  currency: string
  payment_terms: string
  status: "draft" | "active" | "completed" | "cancelled"
  terms_and_conditions?: string
  special_clauses?: string
  created_by?: string
  created_at?: string
  updated_at?: string
  notes?: string
  document_url?: string
  template_id?: string
  metadata?: Record<string, any>
}

// Get contract by ID
export async function getContractById(id: string) {
  try {
    const { data, error } = await supabase
      .from("contracts")
      .select(`
        *,
        party_a:parties!party_a_id(*),
        party_b:parties!party_b_id(*),
        promoter:promoters(*)
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching contract:", error)
      throw new Error("Failed to fetch contract")
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error in getContractById:", error)
    return { success: false, error: "Failed to fetch contract" }
  }
}

// Create new contract
export async function createContract(contractData: ContractInsert) {
  try {
    const { data, error } = await supabase
      .from("contracts")
      .insert([
        {
          ...contractData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating contract:", error)
      throw new Error("Failed to create contract")
    }

    // Log audit trail
    await logAudit({
      action: "CREATE_CONTRACT",
      resource_type: "contract",
      resource_id: data.id,
      details: { contract_type: contractData.contract_type },
    })

    revalidatePath("/contracts")
    return { success: true, data }
  } catch (error) {
    console.error("Error in createContract:", error)
    return { success: false, error: "Failed to create contract" }
  }
}

// Update contract
export async function updateContract(id: string, contractData: Partial<ContractInsert>) {
  try {
    const { data, error } = await supabase
      .from("contracts")
      .update({
        ...contractData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating contract:", error)
      throw new Error("Failed to update contract")
    }

    // Log audit trail
    await logAudit({
      action: "UPDATE_CONTRACT",
      resource_type: "contract",
      resource_id: id,
      details: contractData,
    })

    revalidatePath("/contracts")
    revalidatePath(`/contracts/${id}`)
    return { success: true, data }
  } catch (error) {
    console.error("Error in updateContract:", error)
    return { success: false, error: "Failed to update contract" }
  }
}

// Delete contract
export async function deleteContract(id: string) {
  try {
    const { error } = await supabase.from("contracts").delete().eq("id", id)

    if (error) {
      console.error("Error deleting contract:", error)
      throw new Error("Failed to delete contract")
    }

    // Log audit trail
    await logAudit({
      action: "DELETE_CONTRACT",
      resource_type: "contract",
      resource_id: id,
      details: {},
    })

    revalidatePath("/contracts")
    return { success: true }
  } catch (error) {
    console.error("Error in deleteContract:", error)
    return { success: false, error: "Failed to delete contract" }
  }
}

// Get all contracts
export async function getContracts(filters?: {
  status?: string
  contract_type?: string
  promoter_id?: string
  limit?: number
  offset?: number
}) {
  try {
    let query = supabase
      .from("contracts")
      .select(`
        *,
        party_a:parties!party_a_id(*),
        party_b:parties!party_b_id(*),
        promoter:promoters(*)
      `)
      .order("created_at", { ascending: false })

    if (filters?.status) {
      query = query.eq("status", filters.status)
    }

    if (filters?.contract_type) {
      query = query.eq("contract_type", filters.contract_type)
    }

    if (filters?.promoter_id) {
      query = query.eq("promoter_id", filters.promoter_id)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching contracts:", error)
      throw new Error("Failed to fetch contracts")
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error in getContracts:", error)
    return { success: false, error: "Failed to fetch contracts" }
  }
}

// Update contract status
export async function updateContractStatus(id: string, status: ContractInsert["status"]) {
  try {
    const { data, error } = await supabase
      .from("contracts")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating contract status:", error)
      throw new Error("Failed to update contract status")
    }

    // Log audit trail
    await logAudit({
      action: "UPDATE_CONTRACT_STATUS",
      resource_type: "contract",
      resource_id: id,
      details: { status },
    })

    revalidatePath("/contracts")
    revalidatePath(`/contracts/${id}`)
    return { success: true, data }
  } catch (error) {
    console.error("Error in updateContractStatus:", error)
    return { success: false, error: "Failed to update contract status" }
  }
}
