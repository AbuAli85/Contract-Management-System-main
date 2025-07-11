import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Support both client and server environments
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase URL or Anon Key is missing. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (for client) or SUPABASE_URL and SUPABASE_ANON_KEY (for server) are set.",
  )
}

// Create a single instance to avoid multiple auth listeners
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? {
      getItem: (key: string) => {
        try {
          return window.localStorage.getItem(key)
        } catch (error) {
          console.warn('Error reading from localStorage:', error)
          return null
        }
      },
      setItem: (key: string, value: string) => {
        try {
          window.localStorage.setItem(key, value)
        } catch (error) {
          console.warn('Error writing to localStorage:', error)
        }
      },
      removeItem: (key: string) => {
        try {
          window.localStorage.removeItem(key)
        } catch (error) {
          console.warn('Error removing from localStorage:', error)
        }
      }
    } : undefined,
    storageKey: 'sb-auth-token',
    debug: false // Disable debug to reduce console noise
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js/2.x',
    },
  },
})

// Utility function to check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return !!session?.user
  } catch (error) {
    console.error("Error checking authentication status:", error)
    return false
  }
}

// Utility function to get current user
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.error("Error getting current user:", error)
      return null
    }
    return user
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

// Utility function to get current session
export const getCurrentSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.error("Error getting current session:", error)
      return null
    }
    return session
  } catch (error) {
    console.error("Error getting current session:", error)
    return null
  }
}

// Utility function to refresh session
export const refreshSession = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession()
    if (error) {
      console.error("Error refreshing session:", error)
      return null
    }
    return data.session
  } catch (error) {
    console.error("Error refreshing session:", error)
    return null
  }
}

// Utility function to sign out
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Error signing out:", error)
      return false
    }
    return true
  } catch (error) {
    console.error("Error signing out:", error)
    return false
  }
}

// Utility function to handle realtime connection errors
export const handleRealtimeError = (error: any, tableName: string) => {
  const message = error?.message ?? "Unknown channel error"
  
  // Check for specific error types
  if (message.includes("JWT") || message.includes("auth") || message.includes("permission")) {
    console.warn(`Authentication error for ${tableName}:`, message)
    return "AUTH_ERROR"
  }
  
  if (message.includes("timeout") || message.includes("TIMED_OUT")) {
    console.warn(`Timeout error for ${tableName}:`, message)
    return "TIMEOUT_ERROR"
  }
  
  if (message.includes("network") || message.includes("connection")) {
    console.warn(`Network error for ${tableName}:`, message)
    return "NETWORK_ERROR"
  }
  
  console.warn(`Unknown error for ${tableName}:`, message)
  return "UNKNOWN_ERROR"
}

// Utility function to safely create a realtime channel
export const createRealtimeChannel = (tableName: string, callback: (payload: any) => void) => {
  try {
    return supabase
      .channel(`public-${tableName}-realtime`)
      .on("postgres_changes", { event: "*", schema: "public", table: tableName }, callback)
  } catch (error) {
    console.error(`Error creating realtime channel for ${tableName}:`, error)
    return null
  }
}

// Utility function to safely subscribe to a channel
export const subscribeToChannel = (channel: any, onStatusChange?: (status: string, error?: any) => void) => {
  if (!channel) return null
  
  try {
    return channel.subscribe((status: string, error?: any) => {
      if (onStatusChange) {
        onStatusChange(status, error)
      }
    })
  } catch (error) {
    console.error("Error subscribing to channel:", error)
    return null
  }
}

// Debug function to log current auth state
export const debugAuthState = async () => {
  if (process.env.NODE_ENV !== 'development') return
  
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    console.log('🔍 Auth Debug:', {
      session: !!session,
      sessionError: sessionError?.message,
      user: !!user,
      userError: userError?.message,
      userId: user?.id,
      userEmail: user?.email,
      sessionExpiry: session?.expires_at ? new Date(session.expires_at * 1000) : null,
      accessToken: session?.access_token ? 'Present' : 'Missing',
      refreshToken: session?.refresh_token ? 'Present' : 'Missing'
    })
  } catch (error) {
    console.error('🔍 Auth Debug Error:', error)
  }
}