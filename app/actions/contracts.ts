"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { makeIntegration } from "@/lib/make-integration"
import { getTemplateById } from "@/lib/contract-templates"

export type ContractInsert = {
  first_party_id: string
  second_party_id: string
  promoter_id: string
  contract_start_date: string
  contract_end_date: string
  contract_value?: number | null
  job_title?: string | null
  work_location?: string | null
  template_id?: string | null
  metadata?: Record<string, any>
}

export type ContractUpdate = Partial<ContractInsert>

/**
 * Generate a unique contract number
 */
async function generateContractNumber(): Promise<string> {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")

  const supabase = createClient()

  // Get the count of contracts this month
  const startOfMonth = new Date(year, date.getMonth(), 1).toISOString()
  const endOfMonth = new Date(year, date.getMonth() + 1, 0).toISOString()

  const { count } = await supabase
    .from("contracts")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfMonth)
    .lte("created_at", endOfMonth)

  const sequence = String((count || 0) + 1).padStart(4, "0")

  return `CNT-${year}${month}-${sequence}`
}

/**
 * Create a new contract
 */
export async function createContract(data: ContractInsert) {
  const supabase = createClient()

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error("Authentication required")
  }

  // Generate contract number
  const contractNumber = await generateContractNumber()

  // Prepare contract data
  const contractData = {
    ...data,
    contract_number: contractNumber,
    status: "draft",
    created_by: user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  // Insert contract
  const { data: contract, error } = await supabase
    .from("contracts")
    .insert(contractData)
    .select()
    .single()

  if (error) {
    console.error("Contract creation error:", error)
    throw new Error("Failed to create contract")
  }

  // If template is specified, trigger document generation
  if (data.template_id) {
    const template = getTemplateById(data.template_id)

    if (template?.makeScenarioId) {
      // Fetch related data for document generation
      const [firstParty, secondParty, promoter] = await Promise.all([
        supabase.from("parties").select("*").eq("id", data.first_party_id).single(),
        supabase.from("parties").select("*").eq("id", data.second_party_id).single(),
        supabase.from("promoters").select("*").eq("id", data.promoter_id).single(),
      ])

      if (firstParty.data && secondParty.data && promoter.data) {
        // Trigger Make.com webhook
        const result = await makeIntegration.generateDocument(
          contract.id,
          data.template_id,
          contract,
          {
            first: firstParty.data,
            second: secondParty.data,
          },
          promoter.data
        )

        if (!result.success) {
          console.error("Document generation failed:", result.error)
          // Don't throw - contract is created, just document generation failed
        }
      }
    }
  }

  // Revalidate contracts page
  revalidatePath("/contracts")
  revalidatePath("/generate-contract")

  return contract
}

/**
 * Update an existing contract
 */
export async function updateContract(id: string, data: ContractUpdate) {
  const supabase = createClient()

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error("Authentication required")
  }

  // Update contract
  const { data: contract, error } = await supabase
    .from("contracts")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Contract update error:", error)
    throw new Error("Failed to update contract")
  }

  // Log the update
  await supabase.from("contract_history").insert({
    contract_id: id,
    action: "updated",
    changes: data,
    performed_by: user.id,
    performed_at: new Date().toISOString(),
  })

  // Revalidate pages
  revalidatePath("/contracts")
  revalidatePath(`/contracts/${id}`)

  return contract
}

/**
 * Delete a contract
 */
export async function deleteContract(id: string) {
  const supabase = createClient()

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error("Authentication required")
  }

  // Soft delete by updating status
  const { error } = await supabase
    .from("contracts")
    .update({
      status: "deleted",
      deleted_at: new Date().toISOString(),
      deleted_by: user.id,
    })
    .eq("id", id)

  if (error) {
    console.error("Contract deletion error:", error)
    throw new Error("Failed to delete contract")
  }

  // Revalidate pages
  revalidatePath("/contracts")

  return { success: true }
}

/**
 * Generate document for a contract
 */
export async function generateContractDocument(contractId: string, templateId: string) {
  const supabase = createClient()

  // Get contract and related data
  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .select(
      `
      *,
      first_party:parties!contracts_first_party_id_fkey(*),
      second_party:parties!contracts_second_party_id_fkey(*),
      promoter:promoters(*)
    `
    )
    .eq("id", contractId)
    .single()

  if (contractError || !contract) {
    throw new Error("Contract not found")
  }

  // Trigger document generation
  const result = await makeIntegration.generateDocument(
    contractId,
    templateId,
    contract,
    {
      first: contract.first_party,
      second: contract.second_party,
    },
    contract.promoter
  )

  if (!result.success) {
    throw new Error(result.error || "Document generation failed")
  }

  // Update contract status
  await supabase
    .from("contracts")
    .update({
      status: "processing",
      document_generation_started_at: new Date().toISOString(),
    })
    .eq("id", contractId)

  return result
}
