import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User, Session } from "@supabase/supabase-js"

interface AuthState {
  user: User | null
  session: Session | null
  isAuthenticated: boolean
  loading: boolean
  initialized: boolean
}

// Global auth state to prevent multiple instances
let globalAuthState: AuthState = {
  user: null,
  session: null,
  isAuthenticated: false,
  loading: true,
  initialized: false,
}

let globalListeners: Set<(state: AuthState) => void> = new Set()
let authSubscription: any = null
let isInitialized = false

// Initialize auth state once
const initializeAuth = async () => {
  if (isInitialized) return
  isInitialized = true

  const supabase = createClient()

  try {
    // Get initial session
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error("Error getting initial session:", error)
      updateGlobalState(null)
      return
    }

    if (session) {
      // Verify session is valid
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error("Initial session invalid:", userError)
        updateGlobalState(null)
      } else {
        updateGlobalState({ ...session, user })
      }
    } else {
      updateGlobalState(null)
    }

    // Set up auth state listener (only once)
    if (!authSubscription) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("Auth state change:", event, !!session)

        switch (event) {
          case "SIGNED_IN":
          case "TOKEN_REFRESHED":
            if (session) {
              try {
                const {
                  data: { user },
                  error,
                } = await supabase.auth.getUser()
                if (error || !user) {
                  console.error("Session verification failed:", error)
                  updateGlobalState(null)
                } else {
                  updateGlobalState({ ...session, user })
                }
              } catch (error) {
                console.error("Error verifying session:", error)
                updateGlobalState(null)
              }
            } else {
              updateGlobalState(null)
            }
            break

          case "SIGNED_OUT":
            updateGlobalState(null)
            break

          case "USER_UPDATED":
            if (session) {
              updateGlobalState(session)
            }
            break

          default:
            // For other events, just update with the session
            updateGlobalState(session)
        }
      })
      authSubscription = subscription
    }
  } catch (error) {
    console.error("Error initializing auth:", error)
    updateGlobalState(null)
  }
}

const updateGlobalState = (session: Session | null) => {
  globalAuthState = {
    user: session?.user ?? null,
    session: session,
    isAuthenticated: !!session?.user,
    loading: false,
    initialized: true,
  }

  // Notify all listeners
  globalListeners.forEach((listener) => listener(globalAuthState))
}

export function useAuth() {
  // Always call useState - never conditionally
  const [authState, setAuthState] = useState<AuthState>(globalAuthState)

  // Always call useEffect - never conditionally
  useEffect(() => {
    const listener = (newState: AuthState) => {
      setAuthState(newState)
    }

    globalListeners.add(listener)

    // Initialize auth if not already done
    if (!isInitialized) {
      initializeAuth()
    } else {
      // If already initialized, use current global state
      setAuthState(globalAuthState)
    }

    return () => {
      globalListeners.delete(listener)
    }
  }, [])

  // Always call useCallback - never conditionally
  const refresh = useCallback(async () => {
    const supabase = createClient()

    try {
      setAuthState((prev) => ({ ...prev, loading: true }))

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error("Error refreshing session:", error)
        updateGlobalState(null)
        return
      }

      if (session) {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          console.error("Session invalid during refresh:", userError)
          updateGlobalState(null)
        } else {
          updateGlobalState({ ...session, user })
        }
      } else {
        updateGlobalState(null)
      }
    } catch (error) {
      console.error("Error during refresh:", error)
      updateGlobalState(null)
    }
  }, [])

  return {
    user: authState.user,
    session: authState.session,
    isAuthenticated: authState.isAuthenticated,
    loading: authState.loading,
    initialized: authState.initialized,
    refresh,
  }
}

// Improved error handling for fetching user profile
const fetchUserProfile = async (userId: string) => {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("role,is_premium")
      .eq("id", userId)
      .single()

    if (error) {
      console.error("Profile fetch error:", error)
      return { role: "user", is_premium: false } // Default values
    }
    return data
  } catch (err) {
    console.error("Unexpected error fetching profile:", err)
    return { role: "user", is_premium: false } // Default values
  }
}

// Cleanup function for when the app unmounts
export const cleanupAuth = () => {
  if (authSubscription) {
    authSubscription.unsubscribe()
    authSubscription = null
  }
  globalListeners.clear()
  isInitialized = false
}
