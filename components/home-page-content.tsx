'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Users, 
  BarChart3, 
  Settings,
  Plus,
  Search,
  TrendingUp
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useTheme } from 'next-themes'
import { useTranslations } from 'next-intl'
import AuthStatus from "@/components/auth-status"

interface HomePageContentProps {
  locale: string
}

interface Stats {
  contracts: number
  parties: number
  promoters: number
  activeContracts: number
}

export function HomePageContent({ locale }: HomePageContentProps) {
  const t = useTranslations('Home')
  const { theme, setTheme } = useTheme()
  const [stats, setStats] = useState<Stats>({
    contracts: 0,
    parties: 0,
    promoters: 0,
    activeContracts: 0
  })
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isPremium, setIsPremium] = useState<boolean>(false)

  useEffect(() => {
    let isMounted = true

    async function fetchUserAndStats() {
      // Fetch user session
      const { data: { session } } = await supabase.auth.getSession()
      const currentUser = session?.user
      setUser(currentUser)

      if (!currentUser) {
        setUserRole(null)
        setIsPremium(false)
        setLoading(false)
        return
      }

      // Fetch user profile from 'profiles' table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, is_premium')
        .eq('id', currentUser.id)
        .single()

      if (error || !profile) {
        setUserRole(null)
        setIsPremium(false)
        setLoading(false)
        return
      }

      setUserRole(profile.role)
      setIsPremium(!!profile.is_premium)

      // Fetch stats if user is admin or premium
      if (profile.role === 'admin' || profile.is_premium) {
        try {
          const { count: contractsCount } = await supabase
            .from('contracts')
            .select('*', { count: 'exact', head: true })
          const { count: partiesCount } = await supabase
            .from('parties')
            .select('*', { count: 'exact', head: true })
          const { count: promotersCount } = await supabase
            .from('promoters')
            .select('*', { count: 'exact', head: true })
          const { count: activeContractsCount } = await supabase
            .from('contracts')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active')
          if (isMounted) {
            setStats({
              contracts: contractsCount || 0,
              parties: partiesCount || 0,
              promoters: promotersCount || 0,
              activeContracts: activeContractsCount || 0
            })
            setLoading(false)
          }
        } catch (error) {
          console.error('Error fetching stats:', error)
          if (isMounted) setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }

    fetchUserAndStats()
    return () => { isMounted = false }
  }, [])

  const quickActions = [
    {
      title: t('generateContract'),
      description: t('generateContractDesc'),
      icon: <Plus className="h-6 w-6" />,
      href: `/${locale}/generate-contract`,
      color: 'bg-blue-500'
    },
    {
      title: t('viewContracts'),
      description: t('viewContractsDesc'),
      icon: <FileText className="h-6 w-6" />,
      href: `/${locale}/contracts`,
      color: 'bg-green-500'
    },
    {
      title: t('manageParties'),
      description: t('managePartiesDesc'),
      icon: <Users className="h-6 w-6" />,
      href: `/${locale}/manage-parties`,
      color: 'bg-purple-500'
    },
    {
      title: t('analytics'),
      description: t('analyticsDesc'),
      icon: <BarChart3 className="h-6 w-6" />,
      href: `/${locale}/dashboard`,
      color: 'bg-orange-500'
    }
  ]

  const statsCards = [
    {
      title: t('totalContracts'),
      value: stats.contracts,
      icon: <FileText className="h-8 w-8 text-blue-600" />,
      description: t('allContracts')
    },
    {
      title: t('activeContracts'),
      value: stats.activeContracts,
      icon: <TrendingUp className="h-8 w-8 text-green-600" />,
      description: t('currentlyActive')
    },
    {
      title: t('totalParties'),
      value: stats.parties,
      icon: <Users className="h-8 w-8 text-purple-600" />,
      description: t('registeredParties')
    },
    {
      title: t('promoters'),
      value: stats.promoters,
      icon: <Users className="h-8 w-8 text-orange-600" />,
      description: t('activePromoters')
    }
  ]

  if (loading) {
    // Skeleton loader for stats
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-32 w-full flex flex-col justify-center items-center">
              <div className="h-8 w-8 bg-gray-300 rounded-full mb-2" aria-hidden="true"></div>
              <div className="h-4 w-1/2 bg-gray-300 rounded mb-1" aria-hidden="true"></div>
              <div className="h-3 w-1/3 bg-gray-200 rounded" aria-hidden="true"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!user || (userRole !== 'admin' && !isPremium)) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[60vh]">
        <AuthStatus />
        <div className="mt-8 p-6 bg-yellow-100 border border-yellow-300 rounded-lg text-yellow-800 text-center max-w-lg">
          <h2 className="text-2xl font-bold mb-2">Premium Access Required</h2>
          <p className="mb-4">You must have a <span className="font-semibold">premium</span> or <span className="font-semibold">admin</span> account to access the contract management features.</p>
          <p>If you believe this is a mistake or want to upgrade, please contact support.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* AuthStatus: show user info and role at the top */}
      <div className="mb-6">
        <AuthStatus />
      </div>
      {/* Dark mode toggle */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label={theme === 'dark' ? t('lightMode') : t('darkMode')}
        >
          {theme === 'dark' ? t('lightMode') : t('darkMode')}
        </button>
      </div>
      {/* Header */}
      <header className="mb-8" aria-label="Page header">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t('title')}</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">{t('subtitle')}</p>
      </header>

      {/* Stats Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" aria-label="System statistics">
        {statsCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow dark:bg-gray-800" tabIndex={0} aria-label={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value.toLocaleString()}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Quick Actions */}
      <section className="mb-8" aria-label="Quick actions">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">{t('quickActions')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href} aria-label={action.title} tabIndex={0}>
              <Card className="hover:shadow-lg transition-all hover:scale-105 cursor-pointer focus:ring-2 focus:ring-blue-400 focus:outline-none dark:bg-gray-800" tabIndex={-1}>
                <CardHeader>
                  <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center text-white mb-4`} aria-hidden="true">
                    {action.icon}
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section aria-label="System overview">
        <Card className="dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />{t('systemOverview')}</CardTitle>
            <CardDescription>{t('getStarted')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <h4 className="font-medium">{t('contractGeneration')}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('contractGenerationDesc')}</p>
                </div>
                <Link href={`/${locale}/generate-contract`} aria-label={t('getStartedContractGeneration')}>
                  <Button>{t('getStarted')}</Button>
                </Link>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <h4 className="font-medium">{t('partyManagement')}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('partyManagementDesc')}</p>
                </div>
                <Link href={`/${locale}/manage-parties`} aria-label={t('manageContractParties')}>
                  <Button variant="outline">{t('manage')}</Button>
                </Link>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <h4 className="font-medium">{t('analyticsDashboard')}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('analyticsDashboardDesc')}</p>
                </div>
                <Link href={`/${locale}/dashboard`} aria-label={t('viewAnalyticsDashboard')}>
                  <Button variant="outline">{t('viewAnalytics')}</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
