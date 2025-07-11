"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Promoter } from "@/lib/types"

export async function getPromoters(): Promise<Promoter[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("promoters")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching promoters:", error)
    return []
  }

  return data || []
}

export async function getPromoterById(id: string): Promise<Promoter | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("promoters").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching promoter:", error)
    return null
  }

  return data
}

export async function createPromoter(promoterData: Omit<Promoter, "id" | "created_at">) {
  const supabase = await createClient()

  const { data, error } = await supabase.from("promoters").insert(promoterData).select().single()

  if (error) {
    console.error("Error creating promoter:", error)
    throw new Error("Failed to create promoter")
  }

  revalidatePath("/manage-promoters")
  return data
}

export async function updatePromoter(id: string, promoterData: Partial<Promoter>) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("promoters")
    .update(promoterData)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating promoter:", error)
    throw new Error("Failed to update promoter")
  }

  revalidatePath("/manage-promoters")
  revalidatePath(`/manage-promoters/${id}`)
  return data
}

export async function deletePromoter(id: string): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient()

  const { error } = await supabase.from("promoters").delete().eq("id", id)

  if (error) {
    console.error("Error deleting promoter:", error)
    return { success: false, message: "Failed to delete promoter" }
  }

  revalidatePath("/manage-promoters")
  return { success: true, message: "Promoter deleted successfully" }
}
