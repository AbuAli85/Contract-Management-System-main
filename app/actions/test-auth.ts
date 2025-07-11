"use server"

export async function testAuth() {
  try {
    console.log("Test auth action called")

    // Check environment variables
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log("Environment check:", { hasUrl, hasAnonKey })

    // Try to import and create client
    const { createClient } = await import("@/lib/supabase/server")
    console.log("createClient imported successfully")

    const supabase = await createClient()
    console.log("Supabase client created:", !!supabase)
    console.log("Supabase auth exists:", !!supabase?.auth)

    if (!supabase?.auth) {
      throw new Error("Supabase auth is not available")
    }

    // Try to get user
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    console.log("User check:", { hasUser: !!user, error: error?.message })

    return {
      success: true,
      hasAuth: true,
      hasUser: !!user,
      userEmail: user?.email || null,
      error: error?.message || null,
    }
  } catch (error) {
    console.error("Test auth error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    }
  }
}
