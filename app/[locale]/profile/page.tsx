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
    if (user) {
      await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id)
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
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </form>
        </CardContent>
      </Card>
    </RequireAuth>
  )
}
