import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
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
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white dark:bg-gray-900 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Reset your password</h2>
      <label className="block mb-2 text-sm font-medium">Email address</label>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        className="w-full px-3 py-2 mb-4 border rounded"
        placeholder="you@example.com"
      />
      <Button type="submit" disabled={loading || sent} className="w-full mb-2">
        {sent ? 'Reset Email Sent!' : loading ? 'Sending...' : 'Send Reset Email'}
      </Button>
      {error && <div className="text-red-600 mt-2">{error}</div>}
      {sent && <div className="text-green-600 mt-2">Check your inbox for a password reset link.</div>}
    </form>
  )
}
