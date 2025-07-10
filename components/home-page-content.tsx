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
import { supabase } from '@/lib/supabase'

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
  const [stats, setStats] = useState<Stats>({
    contracts: 0,
    parties: 0,
    promoters: 0,
    activeContracts: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function fetchStats() {
      try {
        // Fetch contracts count
        const { count: contractsCount } = await supabase
          .from('contracts')
          .select('*', { count: 'exact', head: true })

        // Fetch parties count
        const { count: partiesCount } = await supabase
          .from('parties')
          .select('*', { count: 'exact', head: true })

        // Fetch promoters count
        const { count: promotersCount } = await supabase
          .from('promoters')
          .select('*', { count: 'exact', head: true })

        // Fetch active contracts count
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
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchStats()

    return () => {
      isMounted = false
    }
  }, [])

  const quickActions = [
    {
      title: 'Generate Contract',
      description: 'Create a new contract with automated document generation',
      icon: <Plus className="h-6 w-6" />,
      href: `/${locale}/generate-contract`,
      color: 'bg-blue-500'
    },
    {
      title: 'View Contracts',
      description: 'Browse and manage all contracts',
      icon: <FileText className="h-6 w-6" />,
      href: `/${locale}/contracts`,
      color: 'bg-green-500'
    },
    {
      title: 'Manage Parties',
      description: 'Add and manage contract parties',
      icon: <Users className="h-6 w-6" />,
      href: `/${locale}/manage-parties`,
      color: 'bg-purple-500'
    },
    {
      title: 'Analytics',
      description: 'View contract analytics and insights',
      icon: <BarChart3 className="h-6 w-6" />,
      href: `/${locale}/dashboard`,
      color: 'bg-orange-500'
    }
  ]

  const statsCards = [
    {
      title: 'Total Contracts',
      value: stats.contracts,
      icon: <FileText className="h-8 w-8 text-blue-600" />,
      description: 'All contracts in the system'
    },
    {
      title: 'Active Contracts',
      value: stats.activeContracts,
      icon: <TrendingUp className="h-8 w-8 text-green-600" />,
      description: 'Currently active contracts'
    },
    {
      title: 'Total Parties',
      value: stats.parties,
      icon: <Users className="h-8 w-8 text-purple-600" />,
      description: 'Registered parties'
    },
    {
      title: 'Promoters',
      value: stats.promoters,
      icon: <Users className="h-8 w-8 text-orange-600" />,
      description: 'Active promoters'
    }
  ]

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Contract Management System
        </h1>
        <p className="text-xl text-gray-600">
          Streamline your contract generation and management process
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stat.value.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Card className="hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
                <CardHeader>
                  <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center text-white mb-4`}>
                    {action.icon}
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            System Overview
          </CardTitle>
          <CardDescription>
            Get started with contract management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium">Contract Generation</h4>
                <p className="text-sm text-gray-600">
                  Automated document generation with image processing
                </p>
              </div>
              <Link href={`/${locale}/generate-contract`}>
                <Button>Get Started</Button>
              </Link>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium">Party Management</h4>
                <p className="text-sm text-gray-600">
                  Manage contract parties and promoters
                </p>
              </div>
              <Link href={`/${locale}/manage-parties`}>
                <Button variant="outline">Manage</Button>
              </Link>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium">Analytics Dashboard</h4>
                <p className="text-sm text-gray-600">
                  View insights and analytics for your contracts
                </p>
              </div>
              <Link href={`/${locale}/dashboard`}>
                <Button variant="outline">View Analytics</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
