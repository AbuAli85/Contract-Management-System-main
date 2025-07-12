"use client"

import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import {
  FileText,
  Users,
  BarChart3,
  Settings,
  LogOut,
  LogIn,
  User,
  Plus,
  Search,
} from "lucide-react"
import { ClientOnly } from "@/components/ClientOnly"

export function MainNav() {
  const { user, profile, signOut, isHydrated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  const getLocaleFromPath = () => {
    const segments = pathname.split("/")
    return segments[1] || "en"
  }

  const locale = getLocaleFromPath()

  if (!isHydrated) {
    return (
      <nav className="flex items-center justify-between border-b p-4">
        <div className="flex items-center space-x-6">
          <Link href="/" className="text-xl font-bold">
            Contract Management
          </Link>
        </div>
        <div className="h-8 w-24 animate-pulse rounded bg-gray-200"></div>
      </nav>
    )
  }

  return (
    <nav className="flex items-center justify-between border-b p-4">
      <div className="flex items-center space-x-6">
        <Link href={`/${locale}`} className="text-xl font-bold">
          Contract Management
        </Link>

        {user && (
          <div className="flex items-center space-x-4">
            <Link
              href={`/${locale}/contracts`}
              className="flex items-center space-x-2 hover:text-primary"
            >
              <FileText className="h-4 w-4" />
              <span>Contracts</span>
            </Link>
            <Link
              href={`/${locale}/parties`}
              className="flex items-center space-x-2 hover:text-primary"
            >
              <Users className="h-4 w-4" />
              <span>Parties</span>
            </Link>
            <Link
              href={`/${locale}/promoters`}
              className="flex items-center space-x-2 hover:text-primary"
            >
              <Users className="h-4 w-4" />
              <span>Promoters</span>
            </Link>
            <Link
              href={`/${locale}/generate-contract`}
              className="flex items-center space-x-2 hover:text-primary"
            >
              <Plus className="h-4 w-4" />
              <span>Generate</span>
            </Link>
            {(profile?.is_premium || profile?.role === "admin") && (
              <Link
                href={`/${locale}/reports`}
                className="flex items-center space-x-2 hover:text-primary"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Reports</span>
              </Link>
            )}
            {profile?.role === "admin" && (
              <Link
                href={`/${locale}/admin`}
                className="flex items-center space-x-2 hover:text-primary"
              >
                <Settings className="h-4 w-4" />
                <span>Admin</span>
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <ClientOnly>
          {user ? (
            <>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span className="text-sm">{user.email}</span>
                {profile?.role === "admin" && (
                  <span className="rounded bg-red-100 px-2 py-1 text-xs text-red-800">Admin</span>
                )}
                {profile?.is_premium && (
                  <span className="rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
                    Premium
                  </span>
                )}
              </div>
              <Button onClick={handleSignOut} variant="outline" size="sm">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <Button onClick={() => router.push(`/${locale}/auth/signin`)} size="sm">
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          )}
        </ClientOnly>
      </div>
    </nav>
  )
}
