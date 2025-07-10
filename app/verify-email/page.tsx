"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function VerifyEmailPage() {
  const [resent, setResent] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleResend = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user && user.email) {
      await supabase.auth.resend({ type: "signup", email: user.email })
      setResent(true)
    }
    setLoading(false)
  }

  useEffect(() => {
    // Optionally, poll for email confirmation and redirect
    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email_confirmed_at) {
        router.replace("/profile")
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [router])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="bg-white dark:bg-gray-900 p-8 rounded shadow max-w-md w-full">
        <h1 className="text-2xl font-bold mb-2">Verify your email</h1>
        <p className="mb-4">Please check your inbox and click the verification link. This page will update automatically once your email is verified.</p>
        <Button onClick={handleResend} disabled={loading || resent} className="w-full">
          {resent ? "Verification Email Sent!" : loading ? "Resending..." : "Resend Verification Email"}
        </Button>
      </div>
    </div>
  )
}
