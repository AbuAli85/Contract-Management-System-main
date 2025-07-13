import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } from "../env"
import type { Database } from "@/types/database.types"

export async function createClient() {
  // Return null if environment variables are missing
  if (!NEXT_PUBLIC_SUPABASE_URL || !NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn("Supabase environment variables not configured")
    return null
  }

  try {
    // Get cookies store
    const cookieStore = await cookies()

    const client = createServerClient<Database>(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
            console.warn("Cookie set error (can be ignored in Server Components):", error)
          }
        },
      },
    })

    return client
  } catch (error) {
    console.error("Failed to create Supabase server client:", error)
    return null
  }
}
