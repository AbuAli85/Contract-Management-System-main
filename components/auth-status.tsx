"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { LogInIcon, LogOutIcon, UserCircle } from "lucide-react"

export default function AuthStatus() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }
    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  // Show loading state until component is mounted to prevent hydration mismatch
  if (!mounted || loading) {
    return <div className="h-10 w-24 animate-pulse rounded-md bg-muted/50" />
  }

  return (
    <div className="flex items-center gap-4 border-b p-4">
      {user ? (
        <>
          <div className="flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">{user.email}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOutIcon className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </>
      ) : (
        <Link href="/login" passHref legacyBehavior>
          <Button variant="default" size="sm">
            <LogInIcon className="mr-2 h-4 w-4" />
            Login / Sign Up
          </Button>
        </Link>
      )}
    </div>
  )
}
