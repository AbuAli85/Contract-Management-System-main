"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import RequireAuth from "@/components/require-auth"
import { useTranslations } from "next-intl"

interface UserProfile {
  id: string
  email: string
}

export default function ProfilePage() {
  const t = useTranslations("Profile")
  const [user, setUser] = useState<UserProfile | null>(null)
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true)
      setError("")
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setUser(null)
        setLoading(false)
        setError(t("error.fetchUser"))
        return
      }
      setUser({ id: String(user.id), email: String(user.email) })
      const { data, error: profileError } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
      if (profileError) {
        setError(t("error.fetchProfile"))
      }
      setFullName(data?.full_name || "")
      setLoading(false)
    }
    fetchUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccess("")
    setError("")
    if (!fullName.trim()) {
      setError(t("error.fullNameRequired"))
      setSaving(false)
      return
    }
    if (user) {
      const { error: updateError } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id)
      if (updateError) {
        setError(t("error.updateFailed"))
      } else {
        setSuccess(t("success.updated"))
        router.refresh()
      }
    }
    setSaving(false)
  }

  if (loading) return <div className="text-center py-12">{t("loading")}</div>
  if (!user) return <div className="text-center py-12 text-red-600">{t("error.notLoggedIn")}</div>

  return (
    <RequireAuth>
      <Card className="w-full max-w-md mx-auto mt-12">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleUpdate} aria-label={t("formAriaLabel")}> 
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">{t("email")}</label>
              <Input id="email" value={user.email} disabled aria-readonly aria-label={t("email")}/>
            </div>
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium mb-1">{t("fullName")}</label>
              <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} required aria-required="true" aria-label={t("fullName")}/>
            </div>
            {error && <div className="text-red-600 text-sm" role="alert">{error}</div>}
            {success && <div className="text-green-600 text-sm" role="status">{success}</div>}
            <Button type="submit" disabled={saving} aria-busy={saving} className="w-full">{saving ? t("saving") : t("save")}</Button>
          </form>
        </CardContent>
      </Card>
    </RequireAuth>
  )
}
// i18n keys expected in Profile namespace:
// title, description, email, fullName, save, saving, loading, error.notLoggedIn, error.fetchUser, error.fetchProfile, error.fullNameRequired, error.updateFailed, success.updated, formAriaLabel
