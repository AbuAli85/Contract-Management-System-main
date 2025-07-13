// Environment variables with fallbacks for build time
export const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
export const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key"
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key"

// Additional environment variables
export const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL || ""
export const GOOGLE_DOCS_API_KEY = process.env.GOOGLE_DOCS_API_KEY || ""

// Validation function for runtime
export function validateEnv() {
  const requiredEnvVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value || value.includes("placeholder"))
    .map(([key]) => key)

  if (missingVars.length > 0) {
    console.warn(`Missing environment variables: ${missingVars.join(", ")}`)
  }

  return missingVars.length === 0
}

// Runtime check for server-side environment variables
export function validateServerEnv() {
  const serverEnvVars = {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }

  const missingServerVars = Object.entries(serverEnvVars)
    .filter(([_, value]) => !value || value.includes("placeholder"))
    .map(([key]) => key)

  if (missingServerVars.length > 0) {
    throw new Error(`Missing server environment variables: ${missingServerVars.join(", ")}`)
  }

  return true
}

// Environment object for easier access
export const env = {
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  MAKE_WEBHOOK_URL,
  GOOGLE_DOCS_API_KEY,
}
