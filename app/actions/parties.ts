"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Party } from "@/lib/types"

export async function getParties(): Promise<Party[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("parties")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching parties:", error)
    return []
  }

  return data || []
}

export async function getPartyById(id: string): Promise<Party | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("parties").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching party:", error)
    return null
  }

  return data
}

export async function createParty(partyData: Omit<Party, "id" | "created_at">) {
  const supabase = await createClient()

  const { data, error } = await supabase.from("parties").insert(partyData).select().single()

  if (error) {
    console.error("Error creating party:", error)
    throw new Error("Failed to create party")
  }

  revalidatePath("/manage-parties")
  return data
}

export async function updateParty(id: string, partyData: Partial<Party>) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("parties")
    .update(partyData)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating party:", error)
    throw new Error("Failed to update party")
  }

  revalidatePath("/manage-parties")
  return data
}

export async function deleteParty(id: string): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient()

  const { error } = await supabase.from("parties").delete().eq("id", id)

  if (error) {
    console.error("Error deleting party:", error)
    return { success: false, message: "Failed to delete party" }
  }

  revalidatePath("/manage-parties")
  return { success: true, message: "Party deleted successfully" }
}
