import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"
import { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, isEnvConfigured } from "@/lib/env"

export async function createServerComponentClient() {
  if (!isEnvConfigured()) {
    console.warn("Supabase environment variables not configured")
    return null
  }

  try {
    const cookieStore = await cookies()

    return createServerClient<Database>(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    })
  } catch (error) {
    console.error("Error creating server component client:", error)
    return null
  }
}

export async function createServerActionClient() {
  if (!isEnvConfigured()) {
    console.warn("Supabase environment variables not configured")
    return null
  }

  try {
    const cookieStore = await cookies()

    return createServerClient<Database>(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    })
  } catch (error) {
    console.error("Error creating server action client:", error)
    return null
  }
}
