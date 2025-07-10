import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  // Supabase will route the user here with an access_token in the URL
  const access_token = searchParams?.get('access_token')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    // Supabase automatically uses the access_token from the URL/session
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) setError(error.message)
    else {
      setSuccess(true)
      setTimeout(() => router.push('/login'), 2000)
    }
  }

  if (!access_token) {
    return <div className="text-red-600 text-center mt-8">Invalid or missing reset token.</div>
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white dark:bg-gray-900 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Set a new password</h2>
      <label className="block mb-2 text-sm font-medium">New password</label>
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        className="w-full px-3 py-2 mb-4 border rounded"
        placeholder="New password"
      />
      <label className="block mb-2 text-sm font-medium">Confirm password</label>
      <input
        type="password"
        value={confirm}
        onChange={e => setConfirm(e.target.value)}
        required
        className="w-full px-3 py-2 mb-4 border rounded"
        placeholder="Confirm password"
      />
      <Button type="submit" disabled={loading || success} className="w-full mb-2">
        {success ? 'Password Updated!' : loading ? 'Updating...' : 'Update Password'}
      </Button>
      {error && <div className="text-red-600 mt-2">{error}</div>}
      {success && <div className="text-green-600 mt-2">Password updated! Redirecting to login...</div>}
    </form>
  )
}
