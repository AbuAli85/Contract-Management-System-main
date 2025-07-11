"use client"

import { useAuth } from "@/hooks/use-auth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { User, LogOut, RefreshCw, AlertTriangle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

interface AuthStatusProps {
  showDetails?: boolean
  compact?: boolean
}

export function AuthStatus({ showDetails = false, compact = false }: AuthStatusProps) {
  const { user, isAuthenticated, loading, initialized, refresh } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant={isAuthenticated ? "default" : "destructive"}>
          {loading ? "Loading..." : isAuthenticated ? "Authenticated" : "Not Authenticated"}
        </Badge>
        {isAuthenticated && user && (
          <span className="text-sm text-muted-foreground">{user.email}</span>
        )}
      </div>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="font-medium">Authentication Status</span>
          </div>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Badge variant={isAuthenticated ? "default" : "destructive"}>
              {loading ? "Loading..." : isAuthenticated ? "Authenticated" : "Not Authenticated"}
            </Badge>
          </div>

          {!loading && !initialized && (
            <div className="flex items-center gap-2 text-sm text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              <span>Authentication not initialized</span>
            </div>
          )}

          {isAuthenticated && user && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Email:</span>
                <span className="font-mono text-sm">{user.email}</span>
              </div>

              {showDetails && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">User ID:</span>
                  <span className="rounded bg-gray-100 px-2 py-1 font-mono text-xs">
                    {user.id.slice(0, 8)}...
                  </span>
                </div>
              )}
            </>
          )}

          {isAuthenticated && (
            <div className="pt-2">
              <Button variant="outline" size="sm" onClick={handleSignOut} className="w-full">
                <LogOut className="mr-2 h-3 w-3" />
                Sign Out
              </Button>
            </div>
          )}

          {!isAuthenticated && !loading && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/login")}
                className="w-full"
              >
                Sign In
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
