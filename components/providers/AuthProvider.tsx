"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  isAuthenticated: boolean
  loading: boolean
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const updateAuthState = (newSession: Session | null) => {
    setSession(newSession)
    setUser(newSession?.user ?? null)
    setLoading(false)
  }

  const refresh = async () => {
    try {
      setLoading(true)
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error refreshing session:', error)
        updateAuthState(null)
        return
      }

      if (session) {
        // Verify the session is still valid
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.error('Session invalid during refresh:', userError)
          updateAuthState(null)
          return
        }
        
        updateAuthState({ ...session, user })
      } else {
        updateAuthState(null)
      }
    } catch (error) {
      console.error('Error during auth refresh:', error)
      updateAuthState(null)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
      }
      updateAuthState(null)
    } catch (error) {
      console.error('Error during sign out:', error)
      updateAuthState(null)
    }
  }

  useEffect(() => {
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting initial session:', error)
          if (mounted) updateAuthState(null)
          return
        }

        if (session && mounted) {
          // Verify session is valid
          const { data: { user }, error: userError } = await supabase.auth.getUser()
          
          if (userError || !user) {
            console.error('Initial session invalid:', userError)
            if (mounted) updateAuthState(null)
          } else {
            if (mounted) updateAuthState({ ...session, user })
          }
        } else {
          if (mounted) updateAuthState(null)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
        if (mounted) updateAuthState(null)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        console.log('Auth state changed:', event)

        if (event === 'SIGNED_OUT' || !session) {
          updateAuthState(null)
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Verify the session
          try {
            const { data: { user }, error } = await supabase.auth.getUser()
            if (error || !user) {
              console.error('Session verification failed:', error)
              updateAuthState(null)
            } else {
              updateAuthState({ ...session, user })
            }
          } catch (error) {
            console.error('Error verifying session:', error)
            updateAuthState(null)
          }
        } else {
          updateAuthState(session)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value: AuthContextType = {
    user,
    session,
    isAuthenticated: !!user,
    loading,
    signOut,
    refresh
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}