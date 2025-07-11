"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { User, Session } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string, mfaCode?: string) => Promise<void>
  signUp: (email: string, password: string, metadata?: any) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  verifyOTP: (token: string, type: "signup" | "recovery" | "invite") => Promise<void>
  resendVerificationEmail: () => Promise<void>
  refreshSession: () => Promise<void>
  checkSession: () => Promise<boolean>
  updateProfile: (data: any) => Promise<void>
  deleteAccount: (password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Session refresh interval
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout

    if (session) {
      // Refresh session every 50 minutes (before 1-hour expiry)
      refreshInterval = setInterval(
        () => {
          refreshSession()
        },
        50 * 60 * 1000
      )
    }

    return () => {
      if (refreshInterval) clearInterval(refreshInterval)
    }
  }, [session])

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession()

        if (currentSession) {
          setSession(currentSession)
          setUser(currentSession.user)

          // Check if email is verified
          const { data: profile } = await supabase
            .from("profiles")
            .select("email_verified_at")
            .eq("id", currentSession.user.id)
            .single()

          if (!profile?.email_verified_at) {
            toast({
              title: "Email not verified",
              description: "Please verify your email to access all features",
              variant: "warning",
            })
          }
        }
      } catch (err) {
        console.error("Auth initialization error:", err)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession)
      setUser(currentSession?.user ?? null)

      // Handle auth events
      switch (event) {
        case "SIGNED_IN":
          router.push("/dashboard")
          break
        case "SIGNED_OUT":
          router.push("/auth/signin")
          break
        case "TOKEN_REFRESHED":
          console.log("Token refreshed successfully")
          break
        case "USER_UPDATED":
          toast({
            title: "Profile updated",
            description: "Your profile has been updated successfully",
          })
          break
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string, mfaCode?: string) => {
    try {
      setError(null)
      setLoading(true)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        // Check if MFA is required
        const { data: mfaSettings } = await supabase
          .from("mfa_settings")
          .select("totp_enabled")
          .eq("user_id", data.user.id)
          .single()

        if (mfaSettings?.totp_enabled && !mfaCode) {
          // Redirect to MFA verification
          router.push(`/auth/mfa?userId=${data.user.id}&redirect=/dashboard`)
          return
        }

        // Log successful sign in
        await fetch("/api/auth/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "sign_in",
            userId: data.user.id,
            metadata: { method: "password" },
          }),
        })

        toast({
          title: "Welcome back!",
          description: "You have successfully signed in",
        })
      }
    } catch (err: any) {
      setError(err.message)
      toast({
        title: "Sign in failed",
        description: err.message,
        variant: "destructive",
      })
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      setError(null)
      setLoading(true)

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/verify-email`,
        },
      })

      if (error) throw error

      if (data.user) {
        // Send verification email
        await fetch("/api/auth/send-verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: data.user.id, email }),
        })

        toast({
          title: "Account created!",
          description: "Please check your email to verify your account",
        })

        router.push("/auth/verify-email/pending")
      }
    } catch (err: any) {
      setError(err.message)
      toast({
        title: "Sign up failed",
        description: err.message,
        variant: "destructive",
      })
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)

      // Clear all sessions
      if (user) {
        await fetch("/api/auth/signout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        })
      }

      const { error } = await supabase.auth.signOut()
      if (error) throw error

      // Clear local state
      setUser(null)
      setSession(null)

      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      })
    } catch (err: any) {
      setError(err.message)
      toast({
        title: "Sign out failed",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      setError(null)
      setLoading(true)

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      toast({
        title: "Password reset email sent",
        description: "Check your email for the reset link",
      })
    } catch (err: any) {
      setError(err.message)
      toast({
        title: "Password reset failed",
        description: err.message,
        variant: "destructive",
      })
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updatePassword = async (newPassword: string) => {
    try {
      setError(null)
      setLoading(true)

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      // Update password history
      if (user) {
        await fetch("/api/auth/password-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        })
      }

      toast({
        title: "Password updated",
        description: "Your password has been updated successfully",
      })
    } catch (err: any) {
      setError(err.message)
      toast({
        title: "Password update failed",
        description: err.message,
        variant: "destructive",
      })
      throw err
    } finally {
      setLoading(false)
    }
  }

  const verifyOTP = async (token: string, type: "signup" | "recovery" | "invite") => {
    try {
      setError(null)
      setLoading(true)

      const { data, error } = await supabase.auth.verifyOtp({
        token,
        type,
      })

      if (error) throw error

      toast({
        title: "Verification successful",
        description: "Your account has been verified",
      })
    } catch (err: any) {
      setError(err.message)
      toast({
        title: "Verification failed",
        description: err.message,
        variant: "destructive",
      })
      throw err
    } finally {
      setLoading(false)
    }
  }

  const resendVerificationEmail = async () => {
    try {
      if (!user) throw new Error("No user logged in")

      setError(null)
      setLoading(true)

      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, email: user.email }),
      })

      toast({
        title: "Verification email sent",
        description: "Please check your email",
      })
    } catch (err: any) {
      setError(err.message)
      toast({
        title: "Failed to resend email",
        description: err.message,
        variant: "destructive",
      })
      throw err
    } finally {
      setLoading(false)
    }
  }

  const refreshSession = async () => {
    try {
      const {
        data: { session: newSession },
        error,
      } = await supabase.auth.refreshSession()

      if (error) throw error

      if (newSession) {
        setSession(newSession)
        setUser(newSession.user)
      }
    } catch (err) {
      console.error("Session refresh error:", err)
      // Don't show error to user for automatic refreshes
    }
  }

  const checkSession = async (): Promise<boolean> => {
    try {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession()
      return !!currentSession
    } catch {
      return false
    }
  }

  const updateProfile = async (data: any) => {
    try {
      if (!user) throw new Error("No user logged in")

      setError(null)
      setLoading(true)

      const { error } = await supabase.from("profiles").update(data).eq("id", user.id)

      if (error) throw error

      // Refresh user data
      const {
        data: { user: updatedUser },
      } = await supabase.auth.getUser()
      if (updatedUser) setUser(updatedUser)

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })
    } catch (err: any) {
      setError(err.message)
      toast({
        title: "Update failed",
        description: err.message,
        variant: "destructive",
      })
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteAccount = async (password: string) => {
    try {
      if (!user) throw new Error("No user logged in")

      setError(null)
      setLoading(true)

      // Verify password first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password,
      })

      if (signInError) throw new Error("Invalid password")

      // Delete account
      const response = await fetch("/api/auth/delete-account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, password }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete account")
      }

      // Sign out
      await signOut()

      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted",
      })

      router.push("/")
    } catch (err: any) {
      setError(err.message)
      toast({
        title: "Deletion failed",
        description: err.message,
        variant: "destructive",
      })
      throw err
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    verifyOTP,
    resendVerificationEmail,
    refreshSession,
    checkSession,
    updateProfile,
    deleteAccount,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
