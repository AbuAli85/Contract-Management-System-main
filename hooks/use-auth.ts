"use client"

import { useEffect, useState } from "react"
import { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

interface Profile {
  id: string
  // Remove user_id - it doesn't exist in your database
  full_name: string | null
  email: string | null
  role: string | null
  is_premium: boolean | null
  created_at: string | null
  // Add other fields that exist in your database
  status: string | null
  avatar_url: string | null
  org_id: string | null
  last_login: string | null
  permissions: string[] | null
  plan: string | null
  is_active: boolean | null
  email_verified_at: string | null
  phone: string | null
  phone_verified_at: string | null
  last_sign_in_at: string | null
  sign_in_count: number | null
  failed_attempts: number | null
  locked_at: string | null
  metadata: any | null
  password_changed_at: string | null
  password_history: any | null
  security_questions: any | null
  recovery_email: string | null
  recovery_phone: string | null
  login_ip_whitelist: string[] | null
  two_factor_backup_email: string | null
  account_locked_until: string | null
  last_password_reset_at: string | null
  terms_accepted_at: string | null
  privacy_accepted_at: string | null
  marketing_consent: boolean | null
  timezone: string | null
  locale: string | null
  theme: string | null
}

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  error: string | null
  isHydrated: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
    isHydrated: false,
  })

  useEffect(() => {
    // Mark as hydrated on client side
    setState((prev) => ({ ...prev, isHydrated: true }))

    let isMounted = true

    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          // Change user_id to id - this is likely the issue
          let { data: profile, error } = await supabase
            .from("profiles")
            .select(
              `
              id,
              full_name,
              email,
              role,
              is_premium,
              created_at,
              avatar_url,
              status,
              is_active,
              plan
            `
            )
            .eq("id", session.user.id)
            .single()

          // If profile doesn't exist, create it
          if (error && error.code === "PGRST116") {
            const { data: newProfile, error: createError } = await supabase
              .from("profiles")
              .insert([
                {
                  id: session.user.id,
                  email: session.user.email,
                  full_name: session.user.user_metadata?.full_name || null,
                  avatar_url: session.user.user_metadata?.avatar_url || null,
                  role: "user",
                  // Don't set is_premium - it has a default of false
                  // Don't set is_active - it has a default of true
                  status: "active",
                },
              ])
              .select()
              .single()

            if (createError) {
              console.error("Profile creation error:", createError)
              // Continue with user but no profile
              setState((prev) => ({
                ...prev,
                user: session.user,
                profile: null,
                loading: false,
                error: "Profile creation failed but user authenticated",
              }))
            } else {
              profile = newProfile
              setState((prev) => ({
                ...prev,
                user: session.user,
                profile: profile || null,
                loading: false,
                error: null,
              }))
            }
          } else if (error) {
            // Handle cases where error might be null or malformed
            const errorInfo = {
              message: error?.message || "Unknown error",
              details: error?.details || "No details available",
              hint: error?.hint || "No hint available",
              code: error?.code || "Unknown code",
              fullError: JSON.stringify(error, null, 2),
            }

            console.error("Profile fetch error details:", errorInfo)

            // Set a meaningful error message
            setState((prev) => ({
              ...prev,
              user: session.user,
              profile: null,
              loading: false,
              error: `Profile fetch failed: ${errorInfo.message}`,
            }))
            return { user: session.user, profile: null } // Return early to prevent duplicate setState
          } else {
            // Profile exists and loaded successfully
            setState((prev) => ({
              ...prev,
              user: session.user,
              profile: profile || null,
              loading: false,
              error: null,
            }))
          }

          return { user: session.user, profile }
        }

        setState((prev) => ({
          ...prev,
          user: null,
          profile: null,
          loading: false,
          error: null,
        }))
        return { user: null, profile: null }
      } catch (error) {
        console.error("Session error:", error)
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Failed to get session",
        }))
        return { user: null, profile: null }
      }
    }

    getSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return

      console.log("Auth state change:", event, !!session)

      if (session?.user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select(
            `
            id,
            full_name,
            email,
            role,
            is_premium,
            created_at,
            avatar_url,
            status,
            is_active,
            plan
          `
          )
          .eq("id", session.user.id)
          .single()

        if (profileError && profileError.code !== "PGRST116") {
          console.error("Profile fetch error:", profileError)
        }

        setState((prev) => ({
          ...prev,
          user: session.user,
          profile: profile || null,
          loading: false,
          error: null,
        }))
      } else {
        setState((prev) => ({
          ...prev,
          user: null,
          profile: null,
          loading: false,
          error: null,
        }))
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setState((prev) => ({
        ...prev,
        user: null,
        profile: null,
        error: null,
      }))
    } catch (error) {
      console.error("Sign out error:", error)
      setState((prev) => ({
        ...prev,
        error: "Failed to sign out",
      }))
    }
  }

  return {
    ...state,
    signOut,
  }
}
