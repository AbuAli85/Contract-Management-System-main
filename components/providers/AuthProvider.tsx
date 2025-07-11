"use client"

import { createContext, useContext, ReactNode } from 'react'
import { useAuth } from '@/hooks/use-auth'
import type { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  isAuthenticated: boolean
  loading: boolean
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth()

  const value: AuthContextType = {
    user: auth.user,
    session: auth.session,
    isAuthenticated: auth.isAuthenticated,
    loading: auth.loading,
    refresh: auth.refresh
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