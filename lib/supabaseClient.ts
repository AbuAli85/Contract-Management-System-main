// lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js"

/** 
 * Single shared Supabase client instance.
 * Never recreate this on every render.
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
