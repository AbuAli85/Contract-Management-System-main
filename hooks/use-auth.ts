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
    let authSubscription: any

    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          // Add caching to prevent repeated queries
          const cacheKey = `profile_${session.user.id}`
          const cachedProfile = sessionStorage.getItem(cacheKey)

          if (cachedProfile) {
            const profile = JSON.parse(cachedProfile)
            setState((prev) => ({
              ...prev,
              user: session.user,
              profile,
              loading: false,
              error: null,
            }))
            return { user: session.user, profile }
          }

          // Only query if not in cache
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

          if (error && error.code === "PGRST116") {
            // Profile doesn't exist, create it
            const { data: newProfile, error: createError } = await supabase
              .from("profiles")
              .insert([
                {
                  id: session.user.id,
                  email: session.user.email,
                  full_name: session.user.user_metadata?.full_name || null,
                  avatar_url: session.user.user_metadata?.avatar_url || null,
                  role: "user",
                  status: "active",
                },
              ])
              .select()
              .single()

            if (!createError) {
              profile = newProfile
            }
          }

          // Cache the profile
          if (profile) {
            sessionStorage.setItem(cacheKey, JSON.stringify(profile))
          }

          setState((prev) => ({
            ...prev,
            user: session.user,
            profile,
            loading: false,
            error: null,
          }))
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

    // Optimize auth state change listener
    authSubscription = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return

      // Clear cache on logout
      if (event === "SIGNED_OUT") {
        sessionStorage.removeItem(`profile_${session?.user?.id}`)
      }

      if (session?.user) {
        // Use cached profile if available
        const cacheKey = `profile_${session.user.id}`
        const cachedProfile = sessionStorage.getItem(cacheKey)

        if (cachedProfile) {
          setState((prev) => ({
            ...prev,
            user: session.user,
            profile: JSON.parse(cachedProfile),
            loading: false,
            error: null,
          }))
          return
        }

        // Only fetch if not cached
        const { data: profile } = await supabase
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

        if (profile) {
          sessionStorage.setItem(cacheKey, JSON.stringify(profile))
        }

        setState((prev) => ({
          ...prev,
          user: session.user,
          profile,
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

    getSession()

    return () => {
      isMounted = false
      authSubscription?.subscription?.unsubscribe()
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
