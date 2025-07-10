import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

export async function createServerComponentClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase URL or Anon Key is missing. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.",
    )
  }

  // Use the async cookies() function directly in the cookie handlers
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      async get(name: string) {
        const cookieStore = await cookies()
        return cookieStore.get(name)?.value
      },
      async set(name: string, value: string, options) {
        const cookieStore = await cookies()
        cookieStore.set({ name, value, ...options })
      },
      async remove(name: string, options) {
        const cookieStore = await cookies()
        cookieStore.delete({ name, ...options })
      },
    },
  })
}
