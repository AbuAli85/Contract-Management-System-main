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

    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          // Try to fetch profile first
          let { data: profile, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", session.user.id)
            .single()

          // If profile doesn't exist, create it
          if (error && error.code === "PGRST116") {
            const { data: newProfile, error: createError } = await supabase
              .from("profiles")
              .insert([
                {
                  user_id: session.user.id,
                  email: session.user.email,
                  full_name: session.user.user_metadata?.full_name || "",
                  avatar_url: session.user.user_metadata?.avatar_url || "",
                },
              ])
              .select()
              .single()

            if (createError) {
              console.error("Profile creation error:", createError)
            } else {
              profile = newProfile
            }
          } else if (error) {
            console.error("Profile fetch error:", error)
          }

          setUser(session.user)
          setProfile(profile)
          setLoading(false)
          return { user: session.user, profile }
        }

        setUser(null)
        setProfile(null)
        setLoading(false)
        return { user: null, profile: null }
      } catch (error) {
        console.error("Session error:", error)
        setLoading(false)
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
