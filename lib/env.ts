// Centralized environment variable validation for Next.js/Supabase

function getEnvVar(name: string, required = true): string {
  const value = process.env[name]
  if (required && (!value || value.trim() === "")) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Missing required environment variable: ${name}`)
    }
    // Return empty string for development/build time
    return ""
  }
  return value as string
}

// Named exports that the codebase expects
export const NEXT_PUBLIC_SUPABASE_URL = getEnvVar("NEXT_PUBLIC_SUPABASE_URL", false)
export const SUPABASE_SERVICE_ROLE_KEY = getEnvVar("SUPABASE_SERVICE_ROLE_KEY", false)
export const NEXT_PUBLIC_SUPABASE_ANON_KEY = getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY", false)

// Additional environment variables
export const NODE_ENV = process.env.NODE_ENV || "development"
export const VERCEL_URL = process.env.VERCEL_URL || ""
export const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-for-development"
export const NEXTAUTH_URL = process.env.NEXTAUTH_URL || "http://localhost:3000"

// Environment object for convenience
export const env = {
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NODE_ENV,
  VERCEL_URL,
  NEXTAUTH_SECRET,
  NEXTAUTH_URL,
}

// Validation function
export function validateEnv() {
  const required = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]
  const missing = required.filter((key) => !env[key as keyof typeof env])

  if (missing.length > 0 && process.env.NODE_ENV === "production") {
    console.warn(`Missing required environment variables: ${missing.join(", ")}`)
  }

  return missing.length === 0
}

// Check if we're in a build environment
export const isBuildTime = process.env.NODE_ENV === "production" && !process.env.VERCEL_URL
