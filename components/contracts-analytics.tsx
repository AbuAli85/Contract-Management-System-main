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
  recentActivity: Array<{ date: string; action: string; contractId: string }>
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

      setAnalytics({
        totalContracts: contracts.length,
        activeContracts: statusCounts.active || 0,
        expiredContracts: statusCounts.expired || 0,
        draftContracts: statusCounts.draft || 0,
        statusDistribution,
        monthlyTrends: monthlyData,
        recentActivity: [], // TODO: Implement activity tracking
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

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
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
      </div>
    </div>
  )
}
