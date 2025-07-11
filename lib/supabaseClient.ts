import { getSupabaseBrowserClient } from "./supabase/singleton"

// Export the singleton instance
export const supabase = getSupabaseBrowserClient()
