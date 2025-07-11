"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    setLoading(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-md rounded bg-white p-6 shadow dark:bg-gray-900"
    >
      <h2 className="mb-4 text-2xl font-bold">Reset your password</h2>
      <label className="mb-2 block text-sm font-medium">Email address</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="mb-4 w-full rounded border px-3 py-2"
        placeholder="you@example.com"
      />
      <Button type="submit" disabled={loading || sent} className="mb-2 w-full">
        {sent ? "Reset Email Sent!" : loading ? "Sending..." : "Send Reset Email"}
      </Button>
      {error && <div className="mt-2 text-red-600">{error}</div>}
      {sent && (
        <div className="mt-2 text-green-600">Check your inbox for a password reset link.</div>
      )}
    </form>
  )
}
