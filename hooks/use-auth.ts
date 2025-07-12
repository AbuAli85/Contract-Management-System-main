"use client"

import { useEffect, useState } from "react"
import { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

interface Profile {
  id: string
  user_id: string
  full_name: string | null
  email: string
  role: "admin" | "user"
  is_premium: boolean
  created_at: string
  updated_at: string
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

    async function getSession() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Auth session error:", error)
          if (isMounted) {
            setState((prev) => ({
              ...prev,
              error: error.message,
              loading: false,
            }))
          }
          return
        }

        if (session?.user && isMounted) {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", session.user.id)
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
        } else if (isMounted) {
          setState((prev) => ({
            ...prev,
            user: null,
            profile: null,
            loading: false,
            error: null,
          }))
        }
      } catch (error) {
        console.error("Auth initialization error:", error)
        if (isMounted) {
          setState((prev) => ({
            ...prev,
            error: "Authentication initialization failed",
            loading: false,
          }))
        }
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
          .select("*")
          .eq("user_id", session.user.id)
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
