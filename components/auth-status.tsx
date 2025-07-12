"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { LogInIcon, LogOutIcon, UserCircle } from "lucide-react"
import { BadgeCheck, ShieldCheck, Calendar, User as UserIcon } from "lucide-react"

export default function AuthStatus() {
  const { user, isAuthenticated, loading } = useAuth()
  const [userDetails, setUserDetails] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Memoize user details to prevent unnecessary re-renders
  const memoizedUserDetails = useMemo(() => {
    if (!user) return null

    return {
      role: user.role || "user",
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      email_confirmed_at: user.email_confirmed_at,
    }
  }, [user])

  useEffect(() => {
    setUserDetails(memoizedUserDetails)
  }, [memoizedUserDetails])

  const handleLogout = useCallback(async () => {
    // Clear all caches on logout
    sessionStorage.clear()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }, [router])

  // Show loading state until component is mounted to prevent hydration mismatch
  if (!mounted || loading) {
    return <div className="h-10 w-24 animate-pulse rounded-md bg-muted/50" />
  }

  return (
    <>
      {isAuthenticated && user ? (
        <div className="flex flex-col gap-2 border-b p-4">
          <div className="flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">{user.email}</span>
            {userDetails?.email_confirmed_at && (
              <BadgeCheck className="h-4 w-4 text-green-500" aria-label="Email Verified" />
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            <span>
              Role: <span className="font-semibold capitalize">{userDetails?.role}</span>
            </span>
            <Calendar className="ml-4 h-4 w-4" />
            <span>
              Created:{" "}
              {userDetails?.created_at
                ? new Date(userDetails.created_at).toLocaleDateString()
                : "-"}
            </span>
            <UserIcon className="ml-4 h-4 w-4" />
            <span>
              Last Sign In:{" "}
              {userDetails?.last_sign_in_at
                ? new Date(userDetails.last_sign_in_at).toLocaleString()
                : "-"}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="mt-2">
            <LogOutIcon className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      ) : null}
    </>
  )
}
