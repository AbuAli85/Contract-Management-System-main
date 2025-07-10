"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import RequireAuth from "@/components/require-auth"

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
        setFullName(data?.full_name || "")
      }
      setLoading(false)
    }
    fetchUser()
  }, [])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)
    if (user) {
      // Update full name
      await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id)
      // Update password if provided
      if (password) {
        if (password !== confirm) {
          setError('Passwords do not match.')
          setSaving(false)
          return
        }
        const { error } = await supabase.auth.updateUser({ password })
        if (error) setError(error.message)
        else setMessage('Password updated!')
      }
    }
    setSaving(false)
    router.refresh()
  }

  if (loading) return <div>Loading...</div>
  if (!user) return <div>Please log in to view your profile.</div>

  return (
    <RequireAuth>
      <Card className="w-full max-w-md mx-auto mt-12">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>View and update your profile information.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleUpdate}>
            <div>
              <label htmlFor="email">Email</label>
              <Input id="email" value={user.email} disabled />
            </div>
            <div>
              <label htmlFor="fullName">Full Name</label>
              <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} />
            </div>
            <div>
              <label htmlFor="password">New Password</label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <div>
              <label htmlFor="confirm">Confirm Password</label>
              <Input id="confirm" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} />
            </div>
            {error && <div className="text-red-600 mt-2">{error}</div>}
            {message && <div className="text-green-600 mt-2">{message}</div>}
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </form>
        </CardContent>
      </Card>
    </RequireAuth>
  )
}
