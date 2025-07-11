import { getSupabaseBrowserClient } from "./singleton"

export function createClient() {
  return getSupabaseBrowserClient()
}
