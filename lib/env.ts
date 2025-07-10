// Centralized environment variable validation for Next.js/Supabase

function getEnvVar(name: string, required = true): string {
  const value = process.env[name]
  if (required && (!value || value.trim() === '')) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value as string
}

export const NEXT_PUBLIC_SUPABASE_URL = getEnvVar('NEXT_PUBLIC_SUPABASE_URL')
export const SUPABASE_SERVICE_ROLE_KEY = getEnvVar('SUPABASE_SERVICE_ROLE_KEY')
export const NEXT_PUBLIC_SUPABASE_ANON_KEY = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY')

// Add more as needed, e.g.:
// export const SOME_API_KEY = getEnvVar('SOME_API_KEY', false)
