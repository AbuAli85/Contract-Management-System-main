"use client"

import { useState, useEffect, createContext, useContext, ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import type { User, Session } from "@supabase/supabase-js"

interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  role?: 'admin' | 'manager' | 'user'
  department?: string
  phone?: string
  timezone?: string
  language?: string
  email_notifications?: boolean
  push_notifications?: boolean
  two_factor_enabled?: boolean
  last_login?: string
  created_at?: string
  updated_at?: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  isAuthenticated: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error?: string }>
  updatePassword: (newPassword: string) => Promise<{ error?: string }>
  resetPassword: (email: string) => Promise<{ error?: string }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          return
        }

        if (mounted) {
          setSession(currentSession)
          setUser(currentSession?.user ?? null)
          
          if (currentSession?.user) {
            await fetchUserProfile(currentSession.user.id)
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return

        setSession(currentSession)
        setUser(currentSession?.user ?? null)
        
        if (currentSession?.user) {
          await fetchUserProfile(currentSession.user.id)
          
          // Update last login
          if (event === 'SIGNED_IN') {
            await updateLastLogin(currentSession.user.id)
          }
        } else {
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Fetch user profile from database
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error)
        return
      }

      if (data) {
        setProfile(data)
      } else {
        // Create profile if it doesn't exist
        await createUserProfile(userId)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  // Create user profile
  const createUserProfile = async (userId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user

      if (!user) return

      const newProfile: Partial<UserProfile> = {
        id: userId,
        email: user.email!,
        full_name: user.user_metadata?.full_name || '',
        role: 'user',
        email_notifications: true,
        push_notifications: true,
        two_factor_enabled: false,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: 'en',
        created_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single()

      if (error) {
        console.error('Error creating profile:', error)
        return
      }

      setProfile(data)
    } catch (error) {
      console.error('Error creating user profile:', error)
    }
  }

  // Update last login timestamp
  const updateLastLogin = async (userId: string) => {
    try {
      await supabase
        .from('profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userId)
    } catch (error) {
      console.error('Error updating last login:', error)
    }
  }

  // Sign in
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { error: error.message }
      }

      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      })

      return {}
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      return { error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  // Sign up
  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || ''
          }
        }
      })

      if (error) {
        return { error: error.message }
      }

      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      })

      return {}
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      return { error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true)
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        })
        return
      }

      setUser(null)
      setProfile(null)
      setSession(null)

      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      })
    } catch (error) {
      console.error('Error signing out:', error)
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Update profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      if (!user) {
        return { error: 'No user logged in' }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        return { error: error.message }
      }

      // Update local profile state
      setProfile(prev => prev ? { ...prev, ...updates } : null)

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })

      return {}
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile'
      return { error: errorMessage }
    }
  }

  // Update password
  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        return { error: error.message }
      }

      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      })

      return {}
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update password'
      return { error: errorMessage }
    }
  }

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        return { error: error.message }
      }

      toast({
        title: "Reset email sent",
        description: "Check your email for password reset instructions.",
      })

      return {}
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email'
      return { error: errorMessage }
    }
  }

  // Refresh profile
  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id)
    }
  }

  const value: AuthContextType = {
    user,
    profile,
    session,
    isAuthenticated: !!user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    updatePassword,
    resetPassword,
    refreshProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use auth context
export function useEnhancedAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useEnhancedAuth must be used within an AuthProvider')
  }
  return context
}

// HOC for protected routes
interface RequireAuthProps {
  children: ReactNode
  fallback?: ReactNode
  requiredRole?: 'admin' | 'manager' | 'user'
}

export function RequireAuth({ children, fallback, requiredRole }: RequireAuthProps) {
  const { isAuthenticated, loading, profile } = useEnhancedAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-muted-foreground">Please sign in to access this page.</p>
        </div>
      </div>
    )
  }

  // Check role if required
  if (requiredRole && profile?.role) {
    const roleHierarchy = { user: 1, manager: 2, admin: 3 }
    const userLevel = roleHierarchy[profile.role]
    const requiredLevel = roleHierarchy[requiredRole]

    if (userLevel < requiredLevel) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to access this page.</p>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}

// User avatar component
interface UserAvatarProps {
  user?: UserProfile | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function UserAvatar({ user, size = 'md', className = '' }: UserAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  }

  const initials = user?.full_name
    ?.split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'

  if (user?.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.full_name || user.email || 'User'}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      />
    )
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium ${className}`}>
      {initials}
    </div>
  )
}

// User role badge
interface UserRoleBadgeProps {
  role?: string
  className?: string
}

export function UserRoleBadge({ role, className = '' }: UserRoleBadgeProps) {
  if (!role) return null

  const roleColors = {
    admin: 'bg-red-100 text-red-800',
    manager: 'bg-blue-100 text-blue-800',
    user: 'bg-gray-100 text-gray-800'
  }

  const colorClass = roleColors[role as keyof typeof roleColors] || roleColors.user

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass} ${className}`}>
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  )
}