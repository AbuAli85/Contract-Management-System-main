"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import RequireAuth from "@/components/require-auth"
import { useTranslations } from "next-intl"
import { UserCircleIcon, EnvelopeIcon, UserIcon, ShieldCheckIcon, CalendarIcon, CheckBadgeIcon, KeyIcon, TrashIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/solid"

interface UserProfile {
  id: string
  email: string
  role?: string
  created_at?: string
  last_sign_in_at?: string
  email_confirmed_at?: string
}

function getInitials(email: string) {
  if (!email) return "?"
  const [name] = email.split("@")
  return name.length > 1 ? name[0].toUpperCase() : email[0].toUpperCase()
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
      // Fetch more user details from Supabase auth and profile
      setUser({
        id: String(user.id),
        email: String(user.email),
        role: user.role || "user",
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        email_confirmed_at: user.email_confirmed_at
      })
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

  // Toast feedback (if you have a toast system, replace with your own)
  useEffect(() => {
    if (success) {
      const timeout = setTimeout(() => setSuccess(""), 3000)
      return () => clearTimeout(timeout)
    }
    if (error) {
      const timeout = setTimeout(() => setError(""), 4000)
      return () => clearTimeout(timeout)
    }
  }, [success, error])

  if (loading) return <div className="flex justify-center items-center h-96 animate-pulse">{t("loading")}</div>
  if (!user) return <div className="flex justify-center items-center h-96 text-red-600">{t("error.notLoggedIn")}</div>

  return (
    <RequireAuth>
      <Card className="w-full max-w-2xl mx-auto mt-16 shadow-2xl rounded-2xl border border-gray-200 bg-white/90 backdrop-blur-md transition-all">
        <CardHeader className="flex flex-col items-center gap-2 pb-2">
          <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg mb-2">
            <UserCircleIcon className="w-16 h-16 text-white/80 absolute z-0" />
            <span className="relative z-10 text-3xl font-bold text-white select-none">
              {getInitials(user.email)}
            </span>
          </div>
          <CardTitle className="text-2xl font-extrabold tracking-tight text-gray-900">{t("title")}</CardTitle>
          <CardDescription className="text-gray-500 text-center">{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* User Details Section */}
          <section className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex flex-col md:flex-row gap-4 items-center md:items-start">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 text-gray-700">
                <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                <span className="font-medium">{user.email}</span>
                {user.email_confirmed_at && <CheckBadgeIcon className="w-4 h-4 text-green-500" title={t("emailVerified")}/>} 
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <ShieldCheckIcon className="w-4 h-4 text-gray-400" />
                <span>{t("role")}: <span className="font-medium capitalize">{user.role}</span></span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <CalendarIcon className="w-4 h-4 text-gray-400" />
                <span>{t("createdAt")}: <span className="font-medium">{user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}</span></span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <UserIcon className="w-4 h-4 text-gray-400" />
                <span>{t("lastSignIn")}: <span className="font-medium">{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "-"}</span></span>
              </div>
            </div>
          </section>

          {/* Profile Update Form */}
          <form className="space-y-6" onSubmit={handleUpdate} aria-label={t("formAriaLabel")}> 
            <div className="flex flex-col gap-1">
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                <UserIcon className="w-4 h-4 text-gray-400" /> {t("fullName")}
              </label>
              <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} required aria-required="true" aria-label={t("fullName")}
                className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
              <span className="text-xs text-gray-400 mt-1">{t("fullName") + " " + t("required")}</span>
            </div>
            {error && <div className="text-red-600 text-sm animate-fade-in" role="alert">{error}</div>}
            {success && <div className="text-green-600 text-sm animate-fade-in" role="status">{success}</div>}
            <Button type="submit" disabled={saving} aria-busy={saving} className="w-full font-semibold text-base shadow-md transition-all">
              {saving ? (
                <span className="flex items-center gap-2"><span className="loader border-blue-500"></span>{t("saving")}</span>
              ) : t("save")}
            </Button>
          </form>

          {/* Security Settings Section (placeholder) */}
          <section className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-gray-700 font-semibold">
              <KeyIcon className="w-4 h-4 text-gray-400" /> {t("securitySettings")}
            </div>
            <div className="text-gray-500 text-sm">{t("changePasswordDesc")}</div>
            <Button variant="outline" className="w-fit" disabled>{t("changePassword")}</Button>
            <div className="text-gray-500 text-sm mt-2">{t("twoFactorDesc")}</div>
            <Button variant="outline" className="w-fit" disabled>{t("enable2FA")}</Button>
          </section>

          {/* Account Actions Section */}
          <section className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-gray-700 font-semibold">
              <ArrowRightOnRectangleIcon className="w-4 h-4 text-gray-400" /> {t("signOut")}
            </div>
            <Button variant="destructive" className="w-fit" disabled>{t("signOut")}</Button>
            <div className="flex items-center gap-2 text-red-700 font-semibold mt-4">
              <TrashIcon className="w-4 h-4 text-red-400" /> {t("deleteAccount")}
            </div>
            <Button variant="destructive" className="w-fit" disabled>{t("deleteAccount")}</Button>
          </section>
        </CardContent>
      </Card>
    </RequireAuth>
  )
}
// i18n keys expected in Profile namespace:
// title, description, email, fullName, save, saving, loading, error.notLoggedIn, error.fetchUser, error.fetchProfile, error.fullNameRequired, error.updateFailed, success.updated, formAriaLabel, role, createdAt, lastSignIn, emailVerified, securitySettings, changePassword, enable2FA, signOut, deleteAccount
