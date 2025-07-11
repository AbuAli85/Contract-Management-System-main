"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from "recharts"
import { 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  DollarSign,
  Calendar,
  Users
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { CONTRACT_STATUSES } from "./enhanced-status-badge"

interface ContractAnalytics {
  totalContracts: number
  activeContracts: number
  expiredContracts: number
  draftContracts: number
  statusDistribution: Array<{ name: string; value: number; color: string }>
  monthlyTrends: Array<{ month: string; contracts: number; value?: number }>
  recentActivity: Array<{ 
    id: string
    date: string
    action: string
    contractId: string
    contractTitle?: string
    userName?: string
    details?: string
  }>
  upcomingExpirations: number
  averageContractValue: number
  totalContractValue: number
}

export function ContractsAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<ContractAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      // Fetch contracts data
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select('*')

      if (error) throw error

      const now = new Date()
      const getTimeRangeDate = () => {
        const date = new Date()
        switch (timeRange) {
          case '7d': return new Date(date.setDate(date.getDate() - 7))
          case '30d': return new Date(date.setDate(date.getDate() - 30))
          case '90d': return new Date(date.setDate(date.getDate() - 90))
          case '1y': return new Date(date.setFullYear(date.getFullYear() - 1))
          default: return new Date(date.setDate(date.getDate() - 30))
        }
      }

      const rangeStart = getTimeRangeDate()
      const recentContracts = contracts.filter(contract => 
        new Date(contract.created_at) >= rangeStart
      )

      // Calculate status distribution
      const statusCounts = CONTRACT_STATUSES.reduce((acc, status) => {
        acc[status.value] = contracts.filter(c => c.status === status.value).length
        return acc
      }, {} as Record<string, number>)

      const statusDistribution = CONTRACT_STATUSES
        .filter(status => statusCounts[status.value] > 0)
        .map(status => ({
          name: status.label,
          value: statusCounts[status.value],
          color: getStatusColor(status.value)
        }))

      // Calculate monthly trends
      const monthlyData = generateMonthlyTrends(recentContracts)

      // Calculate upcoming expirations (next 30 days)
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      
      const upcomingExpirations = contracts.filter(contract => {
        if (!contract.end_date) return false
        const endDate = new Date(contract.end_date)
        return endDate <= thirtyDaysFromNow && endDate >= now
      }).length

      // Calculate contract values (if available)
      const contractsWithValue = contracts.filter(c => c.contract_value && c.contract_value > 0)
      const totalValue = contractsWithValue.reduce((sum, c) => sum + (c.contract_value || 0), 0)
      const averageValue = contractsWithValue.length > 0 ? totalValue / contractsWithValue.length : 0

      // Generate recent activity data
      const recentActivity = await generateRecentActivity(contracts, rangeStart)

      setAnalytics({
        totalContracts: contracts.length,
        activeContracts: statusCounts.active || 0,
        expiredContracts: statusCounts.expired || 0,
        draftContracts: statusCounts.draft || 0,
        statusDistribution,
        monthlyTrends: monthlyData,
        recentActivity,
        upcomingExpirations,
        averageContractValue: averageValue,
        totalContractValue: totalValue
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateMonthlyTrends = (contracts: any[]) => {
    const months = []
    const now = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = date.toLocaleDateString('en-US', { month: 'short' })
      const monthContracts = contracts.filter(contract => {
        const createdDate = new Date(contract.created_at)
        return createdDate.getMonth() === date.getMonth() && 
               createdDate.getFullYear() === date.getFullYear()
      })
      
      months.push({
        month: monthName,
        contracts: monthContracts.length,
        value: monthContracts.reduce((sum, c) => sum + (c.contract_value || 0), 0)
      })
    }
    
    return months
  }

  const getStatusColor = (status: string) => {
    const statusConfig = CONTRACT_STATUSES.find(s => s.value === status)
    const colorMap: Record<string, string> = {
      'draft': '#6B7280',
      'pending_review': '#F59E0B',
      'active': '#10B981',
      'expired': '#EF4444',
      'terminated': '#EF4444',
      'suspended': '#F97316',
      'archived': '#6B7280',
      'unknown': '#9CA3AF'
    }
    return colorMap[status] || '#9CA3AF'
  }

  const generateRecentActivity = async (contracts: any[], rangeStart: Date) => {
    const activities = []
    
    // Generate activity from recent contracts
    const recentContracts = contracts
      .filter(contract => new Date(contract.created_at) >= rangeStart)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10) // Get latest 10 activities

    for (const contract of recentContracts) {
      const createdDate = new Date(contract.created_at)
      const now = new Date()
      const diffInDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
      
      let timeAgo = ''
      if (diffInDays === 0) {
        const diffInHours = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60))
        timeAgo = diffInHours === 0 ? 'Just now' : `${diffInHours}h ago`
      } else if (diffInDays === 1) {
        timeAgo = 'Yesterday'
      } else {
        timeAgo = `${diffInDays} days ago`
      }

      // Contract creation activity
      activities.push({
        id: `create-${contract.id}`,
        date: timeAgo,
        action: 'Contract Created',
        contractId: contract.id,
        contractTitle: contract.job_title || `Contract #${contract.id.slice(0, 8)}`,
        userName: 'System', // In a real app, this would come from user data
        details: `New ${contract.status || 'draft'} contract created`
      })

      // Status change activities (simulated based on current status)
      if (contract.status === 'active') {
        activities.push({
          id: `activate-${contract.id}`,
          date: timeAgo,
          action: 'Contract Activated',
          contractId: contract.id,
          contractTitle: contract.job_title || `Contract #${contract.id.slice(0, 8)}`,
          userName: 'System',
          details: 'Contract status changed to active'
        })
      }

      // Expiration warnings for contracts ending soon
      if (contract.end_date) {
        const endDate = new Date(contract.end_date)
        const daysUntilExpiry = Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
          activities.push({
            id: `expiry-warning-${contract.id}`,
            date: 'Today',
            action: 'Expiration Warning',
            contractId: contract.id,
            contractTitle: contract.job_title || `Contract #${contract.id.slice(0, 8)}`,
            userName: 'System',
            details: `Contract expires in ${daysUntilExpiry} days`
          })
        }
      }
    }

    // Sort by most recent and limit to 15 activities
    return activities
      .sort((a, b) => {
        // Simple sorting by date string (in a real app, use proper date comparison)
        if (a.date === 'Just now') return -1
        if (b.date === 'Just now') return 1
        if (a.date === 'Today') return -1
        if (b.date === 'Today') return 1
        return 0
      })
      .slice(0, 15)
  }

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!analytics) return null

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-end">
        <div className="flex space-x-2">
          {[
            { key: '7d', label: '7 Days' },
            { key: '30d', label: '30 Days' },
            { key: '90d', label: '90 Days' },
            { key: '1y', label: '1 Year' }
          ].map(range => (
            <button
              key={range.key}
              onClick={() => setTimeRange(range.key as any)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                timeRange === range.key 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalContracts}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3" />
              All time
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analytics.activeContracts}</div>
            <Progress 
              value={(analytics.activeContracts / analytics.totalContracts) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{analytics.upcomingExpirations}</div>
            <p className="text-xs text-muted-foreground">Next 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analytics.totalContractValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg: ${analytics.averageContractValue.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Activity */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Contract Status Distribution</CardTitle>
            <CardDescription>Current status breakdown of all contracts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {analytics.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {analytics.statusDistribution.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Contract Creation Trends</CardTitle>
            <CardDescription>Monthly contract creation over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="contracts" 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest contract activities and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {analytics.recentActivity.length > 0 ? (
                analytics.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 text-sm">
                    <div className="flex-shrink-0">
                      {activity.action === 'Contract Created' && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      )}
                      {activity.action === 'Contract Activated' && (
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      )}
                      {activity.action === 'Expiration Warning' && (
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900 truncate">
                          {activity.action}
                        </p>
                        <p className="text-xs text-gray-500">{activity.date}</p>
                      </div>
                      <p className="text-xs text-gray-600 truncate">
                        {activity.contractTitle}
                      </p>
                      {activity.details && (
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.details}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Clock className="mx-auto h-8 w-8 mb-2" />
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
