"use client"

import { useAuth } from "@/hooks/use-auth"

export default function DebugAuth() {
  const { user, profile, loading, isAuthenticated } = useAuth()

  return (
    <div className="fixed bottom-4 right-4 max-w-sm rounded-lg bg-black p-4 text-xs text-white">
      <h3 className="mb-2 font-bold">Auth Debug</h3>
      <p>Loading: {loading ? "true" : "false"}</p>
      <p>User: {user ? "✓" : "✗"}</p>
      <p>Profile: {profile ? "✓" : "✗"}</p>
      <p>Authenticated: {isAuthenticated ? "✓" : "✗"}</p>
      <p>User ID: {user?.id || "none"}</p>
      <p>Email: {user?.email || "none"}</p>
      <p>Role: {profile?.role || "none"}</p>
    </div>
  )
}
