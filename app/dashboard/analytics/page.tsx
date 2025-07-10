"use client"
import { useEffect, useState } from "react"
import DashboardLayout from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend } from "recharts"
import { Loader2 } from "lucide-react"

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE", "#FFBB28"]

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalContracts: 0,
    activeContracts: 0,
    expiredContracts: 0,
    expiringSoonContracts: 0,
    totalPromoters: 0,
    totalCompanies: 0,
  })
  const [statusData, setStatusData] = useState<{ name: string; value: number }[]>([])
  const [monthlyData, setMonthlyData] = useState<{ month: string; value: number }[]>([])
  const [promoterData, setPromoterData] = useState<{ name: string; value: number }[]>([])

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true)
      // Contracts stats
      const { data: contracts } = await supabase
        .from("contracts")
        .select("id, contract_end_date, created_at, status, promoter_id")
      const now = new Date()
      let active = 0, expired = 0, expSoon = 0
      const statusCount: Record<string, number> = {}
      const monthCount: Record<string, number> = {}
      const promoterCount: Record<string, number> = {}
      contracts?.forEach((c) => {
        // Status
        const status = c.status || "Unknown"
        statusCount[status] = (statusCount[status] || 0) + 1
        // Dates
        if (c.contract_end_date) {
          const end = new Date(c.contract_end_date)
          if (end >= now && (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) <= 30) expSoon++
          if (end >= now) active++
          if (end < now) expired++
        }
        // Monthly
        if (c.created_at) {
          const month = c.created_at.slice(0, 7) // YYYY-MM
          monthCount[month] = (monthCount[month] || 0) + 1
        }
        // Promoter
        if (c.promoter_id) {
          promoterCount[c.promoter_id] = (promoterCount[c.promoter_id] || 0) + 1
        }
      })
      // Promoters
      const { count: totalPromoters } = await supabase
        .from("promoters")
        .select("id", { count: "exact", head: true })
      // Companies
      const { count: totalCompanies } = await supabase
        .from("parties")
        .select("id", { count: "exact", head: true })
      setStats({
        totalContracts: contracts?.length || 0,
        activeContracts: active,
        expiredContracts: expired,
        expiringSoonContracts: expSoon,
        totalPromoters: totalPromoters || 0,
        totalCompanies: totalCompanies || 0,
      })
      setStatusData(Object.entries(statusCount).map(([name, value]) => ({ name, value })))
      setMonthlyData(Object.entries(monthCount).map(([month, value]) => ({ month, value })))
      // Fetch promoter names
      const promoterIds = Object.keys(promoterCount)
      let promoterNames: Record<string, string> = {}
      if (promoterIds.length > 0) {
        const { data: promoters } = await supabase
          .from("promoters")
          .select("id, name_en")
          .in("id", promoterIds)
        promoterNames = Object.fromEntries(promoters?.map((p) => [p.id, p.name_en]) || [])
      }
      setPromoterData(
        Object.entries(promoterCount).map(([id, value]) => ({
          name: promoterNames[id] || id,
          value,
        }))
      )
      setLoading(false)
    }
    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[calc(100vh-150px)] items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg">Loading analytics...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 mb-8">
        <StatCard label="Total Contracts" value={stats.totalContracts} />
        <StatCard label="Active Contracts" value={stats.activeContracts} />
        <StatCard label="Expired Contracts" value={stats.expiredContracts} />
        <StatCard label="Expiring Soon" value={stats.expiringSoonContracts} />
        <StatCard label="Total Promoters" value={stats.totalPromoters} />
        <StatCard label="Total Companies" value={stats.totalCompanies} />
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contracts by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Contracts Created per Month</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Bar dataKey="value" fill="#8884d8" />
                <RechartsTooltip />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Promoter Performance (Contracts per Promoter)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={promoterData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Bar dataKey="value" fill="#82ca9d" />
                <RechartsTooltip />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-6">
        <span className="text-3xl font-bold">{value}</span>
        <span className="text-muted-foreground mt-2 text-sm">{label}</span>
      </CardContent>
    </Card>
  )
}
