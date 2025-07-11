"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

export default function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  // Supabase will route the user here with an access_token in the URL
  const access_token = searchParams?.get("access_token")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }
    setLoading(true)
    // Supabase automatically uses the access_token from the URL/session
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) setError(error.message)
    else {
      setSuccess(true)
      setTimeout(() => router.push("/login"), 2000)
    }
  }

  if (!access_token) {
    return <div className="mt-8 text-center text-red-600">Invalid or missing reset token.</div>
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-md rounded bg-white p-6 shadow dark:bg-gray-900"
    >
      <h2 className="mb-4 text-2xl font-bold">Set a new password</h2>
      <label className="mb-2 block text-sm font-medium">New password</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="mb-4 w-full rounded border px-3 py-2"
        placeholder="New password"
      />
      <label className="mb-2 block text-sm font-medium">Confirm password</label>
      <input
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
        className="mb-4 w-full rounded border px-3 py-2"
        placeholder="Confirm password"
      />
      <Button type="submit" disabled={loading || success} className="mb-2 w-full">
        {success ? "Password Updated!" : loading ? "Updating..." : "Update Password"}
      </Button>
      {error && <div className="mt-2 text-red-600">{error}</div>}
      {success && (
        <div className="mt-2 text-green-600">Password updated! Redirecting to login...</div>
      )}
    </form>
  )
}
