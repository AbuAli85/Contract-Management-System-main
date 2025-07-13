import { createClient } from "@supabase/supabase-js"
import { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, isEnvConfigured } from "@/lib/env"

export async function getUsers() {
  try {
    // Check if environment is configured
    if (!isEnvConfigured()) {
      return { users: [], error: null }
    }

    // Create Supabase client
    const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching users:", error)
      return { users: [], error: error.message }
    }

    return { users: data || [], error: null }
  } catch (err: any) {
    console.error("Get users error:", err)
    return { users: [], error: err.message || "Internal server error" }
  }
}

export async function createUser(userData: {
  email: string
  full_name: string
  role: string
}) {
  try {
    // Check if environment is configured
    if (!isEnvConfigured()) {
      return { user: null, error: "Supabase not configured" }
    }

    // Create Supabase client
    const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Create user in auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      email_confirm: true,
    })

    if (authError) {
      console.error("Error creating auth user:", authError)
      return { user: null, error: authError.message }
    }

    // Create profile
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: authData.user.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
      })
      .select()
      .single()

    if (profileError) {
      console.error("Error creating profile:", profileError)
      // Try to clean up auth user
      await supabase.auth.admin.deleteUser(authData.user.id)
      return { user: null, error: profileError.message }
    }

    return { user: profileData, error: null }
  } catch (err: any) {
    console.error("Create user error:", err)
    return { user: null, error: err.message || "Internal server error" }
  }
}

export async function updateUser(
  id: string,
  userData: {
    email?: string
    full_name?: string
    role?: string
    is_active?: boolean
  },
) {
  try {
    // Check if environment is configured
    if (!isEnvConfigured()) {
      return { user: null, error: "Supabase not configured" }
    }

    // Create Supabase client
    const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data, error } = await supabase
      .from("profiles")
      .update({
        ...userData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating user:", error)
      return { user: null, error: error.message }
    }

    return { user: data, error: null }
  } catch (err: any) {
    console.error("Update user error:", err)
    return { user: null, error: err.message || "Internal server error" }
  }
}

export async function deleteUser(id: string) {
  try {
    // Check if environment is configured
    if (!isEnvConfigured()) {
      return { success: false, error: "Supabase not configured" }
    }

    // Create Supabase client
    const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Delete profile
    const { error: profileError } = await supabase.from("profiles").delete().eq("id", id)

    if (profileError) {
      console.error("Error deleting profile:", profileError)
      return { success: false, error: profileError.message }
    }

    // Delete auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(id)

    if (authError) {
      console.error("Error deleting auth user:", authError)
      // Profile is already deleted, so we'll continue
    }

    return { success: true, error: null }
  } catch (err: any) {
    console.error("Delete user error:", err)
    return { success: false, error: err.message || "Internal server error" }
  }
}

export async function getUserById(id: string) {
  try {
    // Check if environment is configured
    if (!isEnvConfigured()) {
      return { user: null, error: "Supabase not configured" }
    }

    // Create Supabase client
    const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching user:", error)
      return { user: null, error: error.message }
    }

    return { user: data, error: null }
  } catch (err: any) {
    console.error("Get user by ID error:", err)
    return { user: null, error: err.message || "Internal server error" }
  }
}
