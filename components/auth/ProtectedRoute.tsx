"use client"

import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock, LogIn } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: "admin" | "premium" | "user"
  fallback?: React.ReactNode
}

export function ProtectedRoute({ children, requiredRole = "user", fallback }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to login with return URL
      const currentPath = window.location.pathname
      router.push(`/auth/signin?redirect=${encodeURIComponent(currentPath)}`)
    }
  }, [user, loading, router])

  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    )
  }

  // Show unauthorized if no user
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Lock className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 text-lg font-semibold">Access Restricted</h2>
            <p className="mb-4 text-muted-foreground">
              You need to be logged in to access this page.
            </p>
            <Button onClick={() => router.push("/auth/signin")} className="w-full">
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check role requirements
  if (requiredRole === "admin" && profile?.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Lock className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <h2 className="mb-2 text-lg font-semibold">Admin Access Required</h2>
            <p className="mb-4 text-muted-foreground">
              You don't have permission to access this page.
            </p>
            <Button onClick={() => router.push("/")} variant="outline" className="w-full">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (requiredRole === "premium" && !profile?.is_premium && profile?.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Lock className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
            <h2 className="mb-2 text-lg font-semibold">Premium Access Required</h2>
            <p className="mb-4 text-muted-foreground">
              This feature is only available to premium users.
            </p>
            <Button onClick={() => router.push("/pricing")} className="w-full">
              Upgrade to Premium
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // User is authenticated and authorized
  return <>{children}</>
}
