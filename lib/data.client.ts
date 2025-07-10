import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from "@/types/supabase"

export async function getContractsData() {
  const supabase = createClientComponentClient<Database>()
  const { data, error } = await supabase.from('contracts').select('*')
  if (error) {
    return { success: false, message: error.message, data: null }
  }
  return { success: true, data }
}