"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import type { Database } from "@/types/database.types"

type Contract = Database["public"]["Tables"]["contracts"]["Row"]
type ContractUpdate = Database["public"]["Tables"]["contracts"]["Update"]

// Export the ContractInsert type
export type ContractInsert = Database["public"]["Tables"]["contracts"]["Insert"]

const contractSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  contract_type: z.enum(["employment", "service", "partnership", "freelance"]),
  status: z.enum(["draft", "pending", "active", "completed", "cancelled"]).default("draft"),
  party_a_id: z.string().uuid("Invalid party A ID"),
  party_b_id: z.string().uuid("Invalid party B ID"),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  value: z.number().optional(),
  currency: z.string().default("USD"),
  terms: z.string().optional(),
  template_id: z.string().optional(),
})

export async function createContract(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/signin")
  }

  const validatedFields = contractSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    contract_type: formData.get("contract_type"),
    status: formData.get("status") || "draft",
    party_a_id: formData.get("party_a_id"),
    party_b_id: formData.get("party_b_id"),
    start_date: formData.get("start_date"),
    end_date: formData.get("end_date"),
    value: formData.get("value") ? Number(formData.get("value")) : undefined,
    currency: formData.get("currency") || "USD",
    terms: formData.get("terms"),
    template_id: formData.get("template_id"),
  })

  if (!validatedFields.success) {
    throw new Error("Invalid form data")
  }

  const { data, error } = await supabase
    .from("contracts")
    .insert({
      ...validatedFields.data,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create contract: ${error.message}`)
  }

  revalidatePath("/contracts")
  redirect(`/contracts/${data.id}`)
}

export async function updateContract(id: string, formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/signin")
  }

  const validatedFields = contractSchema.partial().safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    contract_type: formData.get("contract_type"),
    status: formData.get("status"),
    party_a_id: formData.get("party_a_id"),
    party_b_id: formData.get("party_b_id"),
    start_date: formData.get("start_date"),
    end_date: formData.get("end_date"),
    value: formData.get("value") ? Number(formData.get("value")) : undefined,
    currency: formData.get("currency"),
    terms: formData.get("terms"),
    template_id: formData.get("template_id"),
  })

  if (!validatedFields.success) {
    throw new Error("Invalid form data")
  }

  const { error } = await supabase
    .from("contracts")
    .update({
      ...validatedFields.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    throw new Error(`Failed to update contract: ${error.message}`)
  }

  revalidatePath("/contracts")
  revalidatePath(`/contracts/${id}`)
}

export async function deleteContract(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/signin")
  }

  const { error } = await supabase.from("contracts").delete().eq("id", id)

  if (error) {
    throw new Error(`Failed to delete contract: ${error.message}`)
  }

  revalidatePath("/contracts")
  redirect("/contracts")
}

export async function getContracts() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from("contracts")
    .select(`
      *,
      party_a:parties!contracts_party_a_id_fkey(id, name, email),
      party_b:parties!contracts_party_b_id_fkey(id, name, email)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching contracts:", error)
    return []
  }

  return data || []
}

export async function getContractById(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from("contracts")
    .select(`
      *,
      party_a:parties!contracts_party_a_id_fkey(id, name, email, type),
      party_b:parties!contracts_party_b_id_fkey(id, name, email, type)
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching contract:", error)
    return null
  }

  return data
}

export async function generateContractDocument(contractId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/signin")
  }

  // Get contract details
  const contract = await getContractById(contractId)
  if (!contract) {
    throw new Error("Contract not found")
  }

  // Here you would integrate with your document generation service
  // For now, we'll just update the status to indicate generation started
  const { error } = await supabase
    .from("contracts")
    .update({
      status: "pending",
      updated_at: new Date().toISOString(),
    })
    .eq("id", contractId)

  if (error) {
    throw new Error(`Failed to update contract status: ${error.message}`)
  }

  revalidatePath(`/contracts/${contractId}`)

  return { success: true, message: "Contract generation started" }
}
