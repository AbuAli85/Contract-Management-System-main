import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

export default function VerifyEmailNotice({ email }: { email: string }) {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const resend = async () => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.resend({ type: "signup", email })
    setLoading(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div className="mx-auto max-w-lg rounded-lg border border-yellow-300 bg-yellow-100 p-6 text-center text-yellow-800">
      <h2 className="mb-2 text-2xl font-bold">Verify your email</h2>
      <p className="mb-4">
        A verification link was sent to <span className="font-semibold">{email}</span>. Please check
        your inbox and click the link to activate your account.
      </p>
      <Button onClick={resend} disabled={loading || sent} className="mb-2">
        {sent ? "Verification Email Sent!" : loading ? "Sending..." : "Resend Verification Email"}
      </Button>
      {error && <div className="mt-2 text-red-600">{error}</div>}
    </div>
  )
}
