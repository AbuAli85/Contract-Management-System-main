"use client"

import React from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Users, BarChart3, Settings, Plus, Search, TrendingUp } from "lucide-react" // Removed LogIn from the import
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useTheme } from "next-themes"
import { useTranslations } from "next-intl"
import { useAuth } from "@/hooks/use-auth"
import AuthStatus from "@/components/auth-status"

interface Stats {
  contracts: number
  parties: number
  promoters: number
  activeContracts: number
}

interface HomePageContentProps {
  locale: string
}

const getQuickActions = (
  t: ReturnType<typeof useTranslations>,
  locale: string,
  isAuthenticated: boolean
) => {
  const actions = [
    {
      title: t("generateContract"),
      description: t("generateContractDesc"),
      icon: <Plus className="h-6 w-6" />,
      href: `/${locale}/generate-contract`,
      color: "bg-blue-500",
      requiresAuth: true,
    },
    {
      title: t("manageParties"),
      description: t("managePartiesDesc"),
      icon: <Users className="h-6 w-6" />,
      href: `/${locale}/manage-parties`,
      color: "bg-green-500",
      requiresAuth: true,
    },
    {
      title: t("viewReports"),
      description: t("viewReportsDesc"),
      icon: <BarChart3 className="h-6 w-6" />,
      href: `/${locale}/reports`,
      color: "bg-purple-500",
      requiresAuth: true,
    },
    {
      title: t("searchContracts"),
      description: t("searchContractsDesc"),
      icon: <Search className="h-6 w-6" />,
      href: `/${locale}/contracts`,
      color: "bg-orange-500",
      requiresAuth: true,
    },
  ]

  // Filter actions based on authentication
  if (!isAuthenticated) {
    return actions.map((action) => ({
      ...action,
      href: `/${locale}/auth/signin?redirect=${encodeURIComponent(action.href)}`,
    }))
  }

  return actions
}

export function HomePageContent({ locale }: HomePageContentProps) {
  const t = useTranslations("Home")
  const { theme, setTheme } = useTheme()
  const { user, profile, loading: authLoading, error: authError } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({
    contracts: 0,
    parties: 0,
    promoters: 0,
    activeContracts: 0,
  })
  const [loading, setLoading] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function fetchStats() {
      if (!user || !profile) {
        setLoading(false)
        return
      }

      // Only fetch stats if user is admin or premium
      if (profile.role === "admin" || profile.is_premium) {
        try {
          const [contractsResult, partiesResult, promotersResult, activeContractsResult] =
            await Promise.all([
              supabase.from("contracts").select("*", { count: "exact", head: true }),
              supabase.from("parties").select("*", { count: "exact", head: true }),
              supabase.from("promoters").select("*", { count: "exact", head: true }),
              supabase
                .from("contracts")
                .select("*", { count: "exact", head: true })
                .eq("status", "active"),
            ])

          if (isMounted) {
            setStats({
              contracts: contractsResult.count || 0,
              parties: partiesResult.count || 0,
              promoters: promotersResult.count || 0,
              activeContracts: activeContractsResult.count || 0,
            })
            setStatsError(null)
          }
        } catch (error) {
          console.error("Error fetching stats:", error)
          if (isMounted) {
            setStatsError("Failed to load statistics.")
          }
        }
      }

      if (isMounted) {
        setLoading(false)
      }
    }

    if (!authLoading) {
      fetchStats()
    }

    return () => {
      isMounted = false
    }
  }, [user, profile, authLoading])

  // Simple approach - directly use the translations without try-catch
  const quickActions = React.useMemo(() => {
    return getQuickActions(t, locale, !!user)
  }, [t, locale, user])

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <AuthStatus />
      </div>

      <div className="space-y-8">
        <div className="text-center">
          <h1 className="mb-2 text-4xl font-bold">{t("welcome")}</h1>
          <p className="mb-8 text-xl text-muted-foreground">{t("subtitle")}</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Card className="cursor-pointer transition-shadow hover:shadow-lg">
                <CardHeader className="pb-3">
                  <div
                    className={`h-12 w-12 rounded-lg ${action.color} mb-3 flex items-center justify-center text-white`}
                  >
                    {action.icon}
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                  <CardDescription>
                    {action.description}
                    {action.requiresAuth && !user && (
                      <span className="mt-1 block text-xs text-muted-foreground">
                        (Requires login)
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        {/* Stats Section - Only show if user has access */}
        {user && profile && (profile.role === "admin" || profile.is_premium) && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : stats.contracts}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Parties</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : stats.parties}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Promoters</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : stats.promoters}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : stats.activeContracts}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {statsError && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-red-600">
                <p>{statsError}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
