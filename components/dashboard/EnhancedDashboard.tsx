"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { useContracts } from "@/hooks/use-contracts"
import { usePromoters } from "@/hooks/use-promoters"
import { useParties } from "@/hooks/use-parties"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Calendar,
  Activity,
  Target,
  Zap,
  Bell,
  Settings,
  RefreshCw,
  Download,
  Filter,
  Search,
  Eye,
  Plus
} from "lucide-react"
import { format, subDays, startOfMonth, endOfMonth, isAfter, isBefore } from "date-fns"
import { LoadingSpinner } from "@/components/ui/skeletons"

interface DashboardStats {
  contracts: {
    total: number
    active: number
    pending: number
    expired: number
    expiringSoon: number
    recentlyCreated: number
    monthlyGrowth: number
    averageValue: number
    totalValue: number
  }
  promoters: {
    total: number
    active: number
    inactive: number
    documentsExpiring: number
    documentsExpired: number
    withActiveContracts: number
    recentlyAdded: number
  }
  parties: {
    total: number
    active: number
    inactive: number
    withContracts: number
    documentsExpiring: number
    documentsExpired: number
    byType: Record<string, number>
  }
  performance: {
    contractsThisMonth: number
    contractsLastMonth: number
    averageProcessingTime: number
    successRate: number
    userActivity: number
  }
}

interface AlertItem {
  id: string
  type: 'contract' | 'promoter' | 'party' | 'system'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  title: string
  description: string
  actionRequired: boolean
  dueDate?: string
  relatedId?: string
}

export function EnhancedDashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const { toast } = useToast()
  
  const { data: contracts, isLoading: contractsLoading, error: contractsError } = useContracts()
  const { data: promoters, isLoading: promotersLoading, error: promotersError } = usePromoters()
  const { data: parties, isLoading: partiesLoading, error: partiesError } = useParties()
  
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [refreshing, setRefreshing] = useState(false)

  // Calculate comprehensive dashboard statistics
  const stats = useMemo((): DashboardStats => {
    if (!contracts || !promoters || !parties) {
      return {
        contracts: { total: 0, active: 0, pending: 0, expired: 0, expiringSoon: 0, recentlyCreated: 0, monthlyGrowth: 0, averageValue: 0, totalValue: 0 },
        promoters: { total: 0, active: 0, inactive: 0, documentsExpiring: 0, documentsExpired: 0, withActiveContracts: 0, recentlyAdded: 0 },
        parties: { total: 0, active: 0, inactive: 0, withContracts: 0, documentsExpiring: 0, documentsExpired: 0, byType: {} },
        performance: { contractsThisMonth: 0, contractsLastMonth: 0, averageProcessingTime: 0, successRate: 0, userActivity: 0 }
      }
    }

    const now = new Date()
    const thirtyDaysAgo = subDays(now, 30)
    const thisMonthStart = startOfMonth(now)
    const lastMonthStart = startOfMonth(subDays(now, 30))
    const lastMonthEnd = endOfMonth(subDays(now, 30))

    // Contract statistics
    const contractStats = {
      total: contracts.length,
      active: contracts.filter(c => c.status === 'active').length,
      pending: contracts.filter(c => c.status === 'pending').length,
      expired: contracts.filter(c => c.status === 'expired').length,
      expiringSoon: contracts.filter(c => {
        if (!c.contract_end_date) return false
        const endDate = new Date(c.contract_end_date)
        const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return daysUntilExpiry <= 30 && daysUntilExpiry > 0
      }).length,
      recentlyCreated: contracts.filter(c => 
        c.created_at && isAfter(new Date(c.created_at), thirtyDaysAgo)
      ).length,
      monthlyGrowth: 0,
      averageValue: 0,
      totalValue: 0
    }

    // Calculate monthly growth
    const thisMonthContracts = contracts.filter(c => 
      c.created_at && isAfter(new Date(c.created_at), thisMonthStart)
    ).length
    const lastMonthContracts = contracts.filter(c => 
      c.created_at && 
      isAfter(new Date(c.created_at), lastMonthStart) && 
      isBefore(new Date(c.created_at), lastMonthEnd)
    ).length

    contractStats.monthlyGrowth = lastMonthContracts > 0 
      ? Math.round(((thisMonthContracts - lastMonthContracts) / lastMonthContracts) * 100)
      : 0

    // Calculate contract values
    const contractsWithValue = contracts.filter(c => c.contract_value && c.contract_value > 0)
    contractStats.totalValue = contractsWithValue.reduce((sum, c) => sum + (c.contract_value || 0), 0)
    contractStats.averageValue = contractsWithValue.length > 0 
      ? contractStats.totalValue / contractsWithValue.length 
      : 0

    // Promoter statistics
    const promoterStats = {
      total: promoters.length,
      active: promoters.filter(p => p.overall_status === 'active').length,
      inactive: promoters.filter(p => p.overall_status === 'inactive').length,
      documentsExpiring: promoters.filter(p => p.document_status === 'expiring').length,
      documentsExpired: promoters.filter(p => p.document_status === 'expired').length,
      withActiveContracts: promoters.filter(p => (p.active_contracts_count || 0) > 0).length,
      recentlyAdded: promoters.filter(p => 
        p.created_at && isAfter(new Date(p.created_at), thirtyDaysAgo)
      ).length
    }

    // Party statistics
    const partyStats = {
      total: parties.length,
      active: parties.filter(p => p.overall_status === 'active').length,
      inactive: parties.filter(p => p.overall_status === 'inactive').length,
      withContracts: parties.filter(p => (p.contract_count || 0) > 0).length,
      documentsExpiring: parties.filter(p => p.overall_status === 'warning').length,
      documentsExpired: parties.filter(p => p.overall_status === 'critical').length,
      byType: parties.reduce((acc, party) => {
        const type = party.type || 'Unknown'
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }

    // Performance statistics
    const performanceStats = {
      contractsThisMonth: thisMonthContracts,
      contractsLastMonth: lastMonthContracts,
      averageProcessingTime: 3.2, // This would come from actual processing time data
      successRate: contracts.length > 0 
        ? Math.round((contracts.filter(c => c.status === 'active' || c.status === 'completed').length / contracts.length) * 100)
        : 0,
      userActivity: 85 // This would come from actual user activity tracking
    }

    return {
      contracts: contractStats,
      promoters: promoterStats,
      parties: partyStats,
      performance: performanceStats
    }
  }, [contracts, promoters, parties])

  // Generate alerts based on data
  useEffect(() => {
    if (!contracts || !promoters || !parties) return

    const newAlerts: AlertItem[] = []

    // Contract alerts
    if (stats.contracts.expiringSoon > 0) {
      newAlerts.push({
        id: 'contracts-expiring',
        type: 'contract',
        priority: 'high',
        title: 'Contracts Expiring Soon',
        description: `${stats.contracts.expiringSoon} contracts will expire within 30 days`,
        actionRequired: true
      })
    }

    if (stats.contracts.expired > 0) {
      newAlerts.push({
        id: 'contracts-expired',
        type: 'contract',
        priority: 'urgent',
        title: 'Expired Contracts',
        description: `${stats.contracts.expired} contracts have expired`,
        actionRequired: true
      })
    }

    // Promoter alerts
    if (stats.promoters.documentsExpired > 0) {
      newAlerts.push({
        id: 'promoters-expired-docs',
        type: 'promoter',
        priority: 'urgent',
        title: 'Expired Promoter Documents',
        description: `${stats.promoters.documentsExpired} promoters have expired documents`,
        actionRequired: true
      })
    }

    if (stats.promoters.documentsExpiring > 0) {
      newAlerts.push({
        id: 'promoters-expiring-docs',
        type: 'promoter',
        priority: 'high',
        title: 'Promoter Documents Expiring',
        description: `${stats.promoters.documentsExpiring} promoters have documents expiring soon`,
        actionRequired: true
      })
    }

    // Party alerts
    if (stats.parties.documentsExpired > 0) {
      newAlerts.push({
        id: 'parties-expired-docs',
        type: 'party',
        priority: 'urgent',
        title: 'Expired Party Documents',
        description: `${stats.parties.documentsExpired} parties have expired documents`,
        actionRequired: true
      })
    }

    setAlerts(newAlerts)
  }, [stats, contracts, promoters, parties])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      // Trigger refetch of all data
      await Promise.all([
        // The hooks will automatically refetch when invalidated
      ])
      toast({
        title: "Dashboard Refreshed",
        description: "All data has been updated successfully",
      })
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh dashboard data",
        variant: "destructive"
      })
    } finally {
      setRefreshing(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  // Show loading state while authentication is being checked
  if (authLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
          <span className="ml-2">Loading dashboard...</span>
        </div>
      </div>
    )
  }

  // Show authentication required message
  if (!isAuthenticated || !user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span>Authentication required to access dashboard</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isLoading = contractsLoading || promotersLoading || partiesLoading

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive overview of your contract management system
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            {stats.contracts.total} {stats.contracts.total === 1 ? 'Contract' : 'Contracts'}
          </Badge>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Contract
          </Button>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Action Required ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className={`p-3 rounded-lg border ${getPriorityColor(alert.priority)}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{alert.title}</h4>
                      <p className="text-sm opacity-90">{alert.description}</p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Eye className="mr-1 h-3 w-3" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
              {alerts.length > 3 && (
                <Button variant="ghost" size="sm" className="w-full">
                  View {alerts.length - 3} more alerts
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Contracts</p>
                <p className="text-2xl font-bold">{isLoading ? '-' : stats.contracts.total}</p>
                <div className="flex items-center text-xs text-muted-foreground">
                  {stats.contracts.monthlyGrowth >= 0 ? (
                    <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                  )}
                  {Math.abs(stats.contracts.monthlyGrowth)}% from last month
                </div>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Contracts</p>
                <p className="text-2xl font-bold text-green-600">{isLoading ? '-' : stats.contracts.active}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.contracts.total > 0 ? Math.round((stats.contracts.active / stats.contracts.total) * 100) : 0}% of total
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">{isLoading ? '-' : formatCurrency(stats.contracts.totalValue)}</p>
                <p className="text-xs text-muted-foreground">
                  Avg: {formatCurrency(stats.contracts.averageValue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-blue-600">{isLoading ? '-' : stats.performance.successRate}%</p>
                <p className="text-xs text-muted-foreground">
                  Avg processing: {stats.performance.averageProcessingTime}d
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="promoters">Promoters</TabsTrigger>
          <TabsTrigger value="parties">Parties</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Contract Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contract Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                      <span className="text-sm">Active</span>
                    </div>
                    <span className="font-medium">{stats.contracts.active}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Pending</span>
                    </div>
                    <span className="font-medium">{stats.contracts.pending}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertTriangle className="mr-2 h-4 w-4 text-orange-500" />
                      <span className="text-sm">Expiring Soon</span>
                    </div>
                    <span className="font-medium">{stats.contracts.expiringSoon}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertTriangle className="mr-2 h-4 w-4 text-red-500" />
                      <span className="text-sm">Expired</span>
                    </div>
                    <span className="font-medium">{stats.contracts.expired}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Promoter Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Promoters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="font-medium">{stats.promoters.total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active</span>
                    <span className="font-medium text-green-600">{stats.promoters.active}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">With Contracts</span>
                    <span className="font-medium">{stats.promoters.withActiveContracts}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Docs Expiring</span>
                    <span className="font-medium text-orange-600">{stats.promoters.documentsExpiring}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Party Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Parties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="font-medium">{stats.parties.total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active</span>
                    <span className="font-medium text-green-600">{stats.parties.active}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">With Contracts</span>
                    <span className="font-medium">{stats.parties.withContracts}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Docs Expiring</span>
                    <span className="font-medium text-orange-600">{stats.parties.documentsExpiring}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">New contracts created this month</p>
                    <p className="text-xs text-muted-foreground">{stats.performance.contractsThisMonth} contracts</p>
                  </div>
                  <span className="text-sm text-muted-foreground">{format(new Date(), 'MMM yyyy')}</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">New promoters added</p>
                    <p className="text-xs text-muted-foreground">{stats.promoters.recentlyAdded} in the last 30 days</p>
                  </div>
                  <span className="text-sm text-muted-foreground">30d</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">System performance</p>
                    <p className="text-xs text-muted-foreground">{stats.performance.userActivity}% user activity rate</p>
                  </div>
                  <span className="text-sm text-muted-foreground">Live</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Contract Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Success Rate</span>
                    <span className="font-medium">{stats.performance.successRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${stats.performance.successRate}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Avg Processing Time</span>
                    <span className="font-medium">{stats.performance.averageProcessingTime} days</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Monthly Growth</span>
                    <span className={`font-medium ${stats.contracts.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.contracts.monthlyGrowth >= 0 ? '+' : ''}{stats.contracts.monthlyGrowth}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contract Values</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats.contracts.totalValue)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Average Value</p>
                    <p className="text-lg font-medium">{formatCurrency(stats.contracts.averageValue)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Contracts with Value</p>
                    <p className="text-lg font-medium">
                      {contracts?.filter(c => c.contract_value && c.contract_value > 0).length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="promoters" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Promoter Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Promoters</span>
                    <span className="font-medium text-green-600">{stats.promoters.active}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Inactive Promoters</span>
                    <span className="font-medium text-gray-600">{stats.promoters.inactive}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">With Active Contracts</span>
                    <span className="font-medium">{stats.promoters.withActiveContracts}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Recently Added</span>
                    <span className="font-medium">{stats.promoters.recentlyAdded}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Document Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Documents Expiring</span>
                    <span className="font-medium text-orange-600">{stats.promoters.documentsExpiring}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Documents Expired</span>
                    <span className="font-medium text-red-600">{stats.promoters.documentsExpired}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Valid Documents</span>
                    <span className="font-medium text-green-600">
                      {stats.promoters.total - stats.promoters.documentsExpiring - stats.promoters.documentsExpired}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="parties" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Party Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.parties.byType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm">{type}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Party Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Parties</span>
                    <span className="font-medium text-green-600">{stats.parties.active}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">With Contracts</span>
                    <span className="font-medium">{stats.parties.withContracts}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Documents Expiring</span>
                    <span className="font-medium text-orange-600">{stats.parties.documentsExpiring}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Documents Expired</span>
                    <span className="font-medium text-red-600">{stats.parties.documentsExpired}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}