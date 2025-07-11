import { useState, useEffect, useCallback, useContext } from "react"
import { supabase } from "@/lib/supabase"
import type { User, Session } from "@supabase/supabase-js"

// Try to import the AuthProvider context
let AuthContext: any = null
try {
  const { useAuthContext } = require("@/components/providers/AuthProvider")
  AuthContext = useAuthContext
} catch (error) {
  // AuthProvider not available, will use standalone implementation
}

interface AuthState {
  user: User | null
  session: Session | null
  isAuthenticated: boolean
  loading: boolean
  initialized: boolean
}

export function useAuth() {
  // Try to use AuthProvider context first
  if (AuthContext) {
    try {
      const context = AuthContext()
      return {
        user: context.user,
        session: context.session,
        isAuthenticated: context.isAuthenticated,
        loading: context.loading,
        initialized: !context.loading,
        refresh: context.refresh
      }
    } catch (error) {
      // Fall back to standalone implementation
      console.warn('AuthProvider context not available, using standalone auth')
    }
  }

  // Standalone implementation (fallback)
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isAuthenticated: false,
    loading: true,
    initialized: false
  })

  const updateAuthState = useCallback((session: Session | null) => {
    setAuthState(prev => ({
      ...prev,
      user: session?.user ?? null,
      session: session,
      isAuthenticated: !!session?.user,
      loading: false,
      initialized: true
    }))
  }, [])

  const refreshSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error("Error getting session:", error)
        updateAuthState(null)
        return
      }

      // If we have a session, verify it's still valid
      if (session) {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.error("Session invalid, user not found:", userError)
          updateAuthState(null)
          return
        }
        
        // Update the session with fresh user data
        const freshSession = { ...session, user }
        updateAuthState(freshSession)
      } else {
        updateAuthState(null)
      }
    } catch (error) {
      console.error("Error refreshing session:", error)
      updateAuthState(null)
    }
  }, [updateAuthState])

  useEffect(() => {
    let mounted = true

    // Initial session check
    const initializeAuth = async () => {
      if (!mounted) return
      
      try {
        // First, try to get the current session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error("Error getting initial session:", error)
          if (mounted) updateAuthState(null)
          return
        }

        if (session) {
          // Verify the session is valid by getting user data
          const { data: { user }, error: userError } = await supabase.auth.getUser()
          
          if (userError || !user) {
            console.error("Initial session invalid:", userError)
            if (mounted) updateAuthState(null)
            return
          }
          
          // Session is valid
          if (mounted) {
            const freshSession = { ...session, user }
            updateAuthState(freshSession)
          }
        } else {
          // No session
          if (mounted) updateAuthState(null)
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
        if (mounted) updateAuthState(null)
      }
    }

    initializeAuth()

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        console.log("Auth state change:", event, !!session)

        switch (event) {
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
            if (session) {
              // Verify the session by getting user data
              try {
                const { data: { user }, error } = await supabase.auth.getUser()
                if (error || !user) {
                  console.error("Session verification failed:", error)
                  updateAuthState(null)
                } else {
                  const freshSession = { ...session, user }
                  updateAuthState(freshSession)
                }
              } catch (error) {
                console.error("Error verifying session:", error)
                updateAuthState(null)
              }
            } else {
              updateAuthState(null)
            }
            break
            
          case 'SIGNED_OUT':
            updateAuthState(null)
            break
            
          case 'USER_UPDATED':
            if (session) {
              updateAuthState(session)
            }
            break
            
          default:
            // For any other events, refresh the session
            if (mounted) {
              await refreshSession()
            }
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [updateAuthState, refreshSession])

  // Provide a manual refresh function
  const refresh = useCallback(async () => {
    setAuthState(prev => ({ ...prev, loading: true }))
    await refreshSession()
  }, [refreshSession])

  return {
    user: authState.user,
    session: authState.session,
    isAuthenticated: authState.isAuthenticated,
    loading: authState.loading,
    initialized: authState.initialized,
    refresh
  }
}