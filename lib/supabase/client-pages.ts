import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from "@/types/supabase"

// This client is safe to use in pages/ directory components
export function createClientForPages() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials')
  }
  
  return createSupabaseClient<Database>(supabaseUrl, supabaseKey)
}
