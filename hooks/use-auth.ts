import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User, Session } from "@supabase/supabase-js"

interface AuthState {
  user: User | null
  session: Session | null
  isAuthenticated: boolean
  loading: boolean
  initialized: boolean
  profile: { role: string; is_premium: boolean } | null
  error: string | null
}

// Global auth state to prevent multiple instances
let globalAuthState: AuthState = {
  user: null,
  session: null,
  isAuthenticated: false,
  loading: true,
  initialized: false,
  profile: null,
  error: null,
}

let globalListeners: Set<(state: AuthState) => void> = new Set()
let authSubscription: any = null
let isInitialized = false

// Improved profile fetching with error handling
const fetchUserProfile = async (userId: string) => {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("role,is_premium")
      .eq("id", userId)
      .maybeSingle() // Use maybeSingle instead of single to avoid errors when no row exists

    if (error) {
      console.error("Profile fetch error:", error)
      // Create profile if it doesn't exist
      const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .insert([
          {
            id: userId,
            role: "user",
            is_premium: false,
          },
        ])
        .select("role,is_premium")
        .single()

      if (insertError) {
        console.error("Profile creation error:", insertError)
        return { role: "user", is_premium: false }
      }
      return newProfile || { role: "user", is_premium: false }
    }

    return data || { role: "user", is_premium: false }
  } catch (err) {
    console.error("Unexpected error fetching profile:", err)
    return { role: "user", is_premium: false }
  }
}

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
      updateGlobalState(null, null, `Session error: ${error.message}`)
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
        updateGlobalState(null, null, "Invalid session")
      } else {
        // Fetch user profile
        const profile = await fetchUserProfile(user.id)
        updateGlobalState({ ...session, user }, profile, null)
      }
    } else {
      updateGlobalState(null, null, null)
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
                  updateGlobalState(null, null, "Session verification failed")
                } else {
                  const profile = await fetchUserProfile(user.id)
                  updateGlobalState({ ...session, user }, profile, null)
                }
              } catch (error) {
                console.error("Error verifying session:", error)
                updateGlobalState(null, null, "Session verification error")
              }
            } else {
              updateGlobalState(null, null, null)
            }
            break

          case "SIGNED_OUT":
            updateGlobalState(null, null, null)
            break

          case "USER_UPDATED":
            if (session) {
              const profile = await fetchUserProfile(session.user.id)
              updateGlobalState(session, profile, null)
            }
            break

          default:
            // For other events, just update with the session
            if (session) {
              const profile = await fetchUserProfile(session.user.id)
              updateGlobalState(session, profile, null)
            } else {
              updateGlobalState(null, null, null)
            }
        }
      })
      authSubscription = subscription
    }
  } catch (error) {
    console.error("Error initializing auth:", error)
    updateGlobalState(null, null, `Initialization error: ${error}`)
  }
}

const updateGlobalState = (
  session: Session | null,
  profile: { role: string; is_premium: boolean } | null,
  error: string | null
) => {
  globalAuthState = {
    user: session?.user ?? null,
    session: session,
    isAuthenticated: !!session?.user,
    loading: false,
    initialized: true,
    profile: profile,
    error: error,
  }

  // Notify all listeners
  globalListeners.forEach((listener) => listener(globalAuthState))
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(globalAuthState)

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
        updateGlobalState(null, null, `Refresh error: ${error.message}`)
        return
      }

      if (session) {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          console.error("Session invalid during refresh:", userError)
          updateGlobalState(null, null, "Invalid session during refresh")
        } else {
          const profile = await fetchUserProfile(user.id)
          updateGlobalState({ ...session, user }, profile, null)
        }
      } else {
        updateGlobalState(null, null, null)
      }
    } catch (error) {
      console.error("Error during refresh:", error)
      updateGlobalState(null, null, `Refresh error: ${error}`)
    }
  }, [])

  return {
    user: authState.user,
    session: authState.session,
    isAuthenticated: authState.isAuthenticated,
    loading: authState.loading,
    initialized: authState.initialized,
    profile: authState.profile,
    error: authState.error,
    refresh,
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
