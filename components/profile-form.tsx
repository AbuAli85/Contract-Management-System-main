import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ProfileForm({ user }: { user: any }) {
  const [email, setEmail] = useState(user?.email || '')
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)
    // Update email
    if (email && email !== user.email) {
      const { error } = await supabase.auth.updateUser({ email })
      if (error) setError(error.message)
      else setMessage('Email updated! Please verify your new email.')
    }
    // Update full name (in profiles table)
    if (fullName && fullName !== user.user_metadata?.full_name) {
      const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id)
      if (error) setError(error.message)
      else setMessage('Profile updated!')
    }
    // Update password
    if (password) {
      if (password !== confirm) {
        setError('Passwords do not match.')
        setLoading(false)
        return
      }
      const { error } = await supabase.auth.updateUser({ password })
      if (error) setError(error.message)
      else setMessage('Password updated!')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleUpdate} className="max-w-md mx-auto p-6 bg-white dark:bg-gray-900 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Update Profile</h2>
      <label className="block mb-2 text-sm font-medium">Email</label>
      <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mb-4" />
      <label className="block mb-2 text-sm font-medium">Full Name</label>
      <Input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="mb-4" />
      <label className="block mb-2 text-sm font-medium">New Password</label>
      <Input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mb-4" />
      <label className="block mb-2 text-sm font-medium">Confirm Password</label>
      <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="mb-4" />
      <Button type="submit" disabled={loading} className="w-full mb-2">{loading ? 'Updating...' : 'Update Profile'}</Button>
      {error && <div className="text-red-600 mt-2">{error}</div>}
      {message && <div className="text-green-600 mt-2">{message}</div>}
    </form>
  )
}
