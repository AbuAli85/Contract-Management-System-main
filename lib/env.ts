// Environment variables with fallbacks for build time
export const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
export const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key"
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key"

// Validation function for runtime
export function validateEnv() {
  const requiredEnvVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value || value.startsWith("placeholder"))
    .map(([key]) => key)

  if (missingVars.length > 0) {
    console.warn(`Missing environment variables: ${missingVars.join(", ")}`)
    return false
  }

  return true
}

// Check if we're in a valid environment
export const isValidEnvironment = () => {
  return process.env.NODE_ENV === "development" || validateEnv()
}
