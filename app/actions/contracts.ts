"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { makeIntegration } from "@/lib/make-integration"
import { getTemplateById } from "@/lib/contract-templates"

// Export the ContractInsert type
export type ContractInsert = {
  first_party_id: string
  second_party_id: string
  promoter_id?: string | null
  contract_start_date: string
  contract_end_date: string
  contract_value?: number | null
  job_title?: string | null
  work_location?: string | null
  template_id?: string | null
  metadata?: Record<string, any>
  status?: string
  contract_name?: string
  contract_type?: string
  terms?: string
  department?: string
  currency?: string
  duration?: string
}

export type ContractUpdate = Partial<ContractInsert>

/**
 * Generate a unique contract number
 */
async function generateContractNumber(): Promise<string> {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")

  const supabase = await createClient()

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
  try {
    const supabase = await createClient()

    // Verify auth is available
    if (!supabase.auth) {
      throw new Error("Supabase auth is not available")
    }

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error("Auth error:", userError)
      throw new Error(`Authentication error: ${userError.message}`)
    }

    if (!user) {
      throw new Error("Authentication required - no user found")
    }

    // Generate contract number
    const contractNumber = await generateContractNumber()

    // Prepare contract data - ensure empty strings are converted to null
    const contractData = {
      ...data,
      promoter_id: data.promoter_id || null, // Convert empty string to null
      contract_number: contractNumber,
      status: data.status || "draft",
      user_id: user.id, // Use user_id instead of created_by
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Insert contract
    const { data: contract, error } = await supabase.from("contracts").insert(contractData).select().single()

    if (error) {
      console.error("Contract creation error:", error)
      throw new Error("Failed to create contract")
    }

    // If template is specified, trigger document generation
    if (data.template_id) {
      const template = getTemplateById(data.template_id)

      if (template?.makeScenarioId) {
        // Fetch related data for document generation
        const [firstParty, secondParty] = await Promise.all([
          supabase.from("parties").select("*").eq("id", data.first_party_id).single(),
          supabase.from("parties").select("*").eq("id", data.second_party_id).single(),
        ])

        // Only fetch promoter if promoter_id is provided
        let promoter = null
        if (data.promoter_id) {
          const promoterResult = await supabase.from("promoters").select("*").eq("id", data.promoter_id).single()
          promoter = promoterResult.data
        }

        if (firstParty.data && secondParty.data) {
          // Trigger Make.com webhook
          const result = await makeIntegration.generateDocument(
            contract.id,
            data.template_id,
            contract,
            {
              first: firstParty.data,
              second: secondParty.data,
            },
            promoter,
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

    // Ensure we return serializable data
    return JSON.parse(JSON.stringify(contract))
  } catch (error) {
    console.error("Error in createContract:", error)
    // Return a proper error response instead of throwing
    if (error instanceof Error) {
      throw new Error(error.message)
    }
    throw new Error("An unexpected error occurred while creating the contract")
  }
}

/**
 * Update an existing contract
 */
export async function updateContract(id: string, data: ContractUpdate) {
  const supabase = await createClient()

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
  const supabase = await createClient()

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
      updated_at: new Date().toISOString(),
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
  const supabase = await createClient()

  // Get contract and related data
  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .select(
      `
      *,
      first_party:parties!contracts_first_party_id_fkey(*),
      second_party:parties!contracts_second_party_id_fkey(*),
      promoter:promoters(*)
    `,
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
    contract.promoter,
  )

  if (!result.success) {
    throw new Error(result.error || "Document generation failed")
  }

  // Update contract status
  await supabase
    .from("contracts")
    .update({
      status: "processing",
      updated_at: new Date().toISOString(),
    })
    .eq("id", contractId)

  return result
}

export async function getContractById(contractId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("contracts")
    .select(
      `id,
       created_at,
       job_title,
       contract_start_date,
       contract_end_date,
       status,
       pdf_url,
       contract_number,
       contract_value,
       email,
       first_party_id,
       second_party_id,
       promoter_id,
       first_party:parties!contracts_first_party_id_fkey (id, name_en, name_ar, crn, type),
       second_party:parties!contracts_second_party_id_fkey (id, name_en, name_ar, crn, type),
       promoters (id, name_en, name_ar, id_card_number, id_card_url, passport_url, status)`,
    )
    .eq("id", contractId)
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw new Error(`Contract with id ${contractId} not found.`)
  return data
}
