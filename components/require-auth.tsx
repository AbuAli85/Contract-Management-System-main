"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.replace("/login")
        setLoading(false)
        return
      }
      // Check if email is confirmed
      if (session.user && !session.user.email_confirmed_at) {
        router.replace("/verify-email")
        setLoading(false)
        return
      }
      setAuthenticated(true)
      setLoading(false)
    }
    checkAuth()
  }, [router])

  if (loading) return <div>Loading...</div>
  if (!authenticated) return null
  return <>{children}</>
}
