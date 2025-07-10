"use client"
import { useEffect, useState } from "react"
import DashboardLayout from "@/components/dashboard/dashboard-layout"
import SummaryWidget from "@/components/dashboard/summary-widget"
import ChartsSection from "@/components/dashboard/charts-section"
import ContractReportsTable from "@/components/dashboard/contract-reports-table"
import ReviewPanel from "@/components/dashboard/review-panel"
import NotificationSystem from "@/components/dashboard/notification-system"
import AdminTools from "@/components/dashboard/admin-tools"
import { EnhancedAnalytics } from "@/components/dashboard/enhanced-analytics"
import { SmartTemplateManager } from "@/components/dashboard/smart-template-manager"
import { WorkflowManager } from "@/components/dashboard/workflow-manager"
import { NotificationCenter } from "@/components/dashboard/notification-center"
import { IntegrationManager } from "@/components/dashboard/integration-manager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { devLog } from "@/lib/dev-log"
import type { SummaryWidgetData, ContractStats } from "@/lib/dashboard-types"
import { 
  FileText, 
  FileCheck, 
  FileX, 
  CalendarClock, 
  Users, 
  Building, 
  BarChart3,
  Workflow,
  Bell,
  Settings,
  Zap,
  File
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DashboardContentProps {
  locale?: string
}

const initialStats: ContractStats = {
  totalContracts: 0,
  activeContracts: 0,
  expiredContracts: 0,
  expiringSoonContracts: 0,
  totalPromoters: 0,
  totalCompanies: 0,
}

export default function DashboardContent({ locale }: DashboardContentProps) {
  const [stats, setStats] = useState<ContractStats>(initialStats)
  const [loadingStats, setLoadingStats] = useState(true)
  const { toast } = useToast()
  // Removed useTranslations for now to fix context issue
  // const t = useTranslations("DashboardContent")

  useEffect(() => {
    let isMounted = true

    const fetchInitialStats = async () => {
      if (!isMounted) return
      
      setLoadingStats(true)
      try {
        const [
          { count: totalContractsCount, error: totalError },
          { count: activeContractsCount, error: activeError },
          { count: expiredContractsCount, error: expiredError },
          { count: expiringSoonContractsCount, error: expiringSoonError },
          { count: totalPromotersCount, error: promotersError },
          { count: totalCompaniesCount, error: partiesError },
        ] = await Promise.all([
          supabase.from("contracts").select("id", { count: "exact", head: true }),
          supabase
            .from("contracts")
            .select("id", { count: "exact", head: true })
            .eq("status", "Active"),
          supabase
            .from("contracts")
            .select("id", { count: "exact", head: true })
            .eq("status", "Expired"),
          supabase
            .from("contracts")
            .select("id", { count: "exact", head: true })
            .eq("status", "Soon-to-Expire"),
          supabase.from("promoters").select("id", { count: "exact", head: true }),
          supabase.from("parties").select("id", { count: "exact", head: true }),
        ])

        if (totalError) throw totalError
        if (activeError) throw activeError
        if (expiredError) throw expiredError
        if (expiringSoonError) throw expiringSoonError
        if (promotersError) throw promotersError
        if (partiesError) throw partiesError

        if (isMounted) {
          setStats({
            totalContracts: totalContractsCount || 0,
            activeContracts: activeContractsCount || 0,
            expiredContracts: expiredContractsCount || 0,
            expiringSoonContracts: expiringSoonContractsCount || 0,
            totalPromoters: totalPromotersCount || 0,
            totalCompanies: totalCompaniesCount || 0,
          })
          setLoadingStats(false)
        }
      } catch (error) {
        console.error("Dashboard stats fetch error:", error)
        devLog("Dashboard stats fetch error:", error)
        
        if (isMounted) {
          toast({
            title: "Error loading dashboard",
            description: "Failed to fetch dashboard statistics. Please try refreshing the page.",
            variant: "destructive",
          })
          setLoadingStats(false)
        }
      }
    }

    fetchInitialStats()

    return () => {
      isMounted = false
    }
  }, [toast])

  const summaryData: SummaryWidgetData[] = [
    {
      title: "Total Contracts",
      titleAr: "إجمالي العقود",
      value: stats.totalContracts.toString(),
      icon: FileText,
      color: "text-blue-600",
    },
    {
      title: "Active Contracts",
      titleAr: "العقود النشطة", 
      value: stats.activeContracts.toString(),
      icon: FileCheck,
      color: "text-green-600",
    },
    {
      title: "Expired Contracts",
      titleAr: "العقود المنتهية",
      value: stats.expiredContracts.toString(),
      icon: FileX,
      color: "text-red-600",
    },
    {
      title: "Expiring Soon",
      titleAr: "تنتهي قريباً",
      value: stats.expiringSoonContracts.toString(),
      icon: CalendarClock,
      color: "text-yellow-600",
    },
    {
      title: "Total Promoters",
      titleAr: "إجمالي المروجين",
      value: stats.totalPromoters.toString(),
      icon: Users,
      color: "text-purple-600",
    },
    {
      title: "Total Companies",
      titleAr: "إجمالي الشركات",
      value: stats.totalCompanies.toString(),
      icon: Building,
      color: "text-indigo-600",
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Enhanced Dashboard Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Comprehensive contract management and analytics
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              {stats.totalContracts} {stats.totalContracts === 1 ? 'Contract' : 'Contracts'}
            </Badge>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </Button>
          </div>
        </div>

        {/* Enhanced Tabbed Interface */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center space-x-2">
              <File className="h-4 w-4" />
              <span>Templates</span>
            </TabsTrigger>
            <TabsTrigger value="workflows" className="flex items-center space-x-2">
              <Workflow className="h-4 w-4" />
              <span>Workflows</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>Integrations</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Summary Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {summaryData.map((data, index) => (
                <SummaryWidget key={index} data={data} isLoading={loadingStats} />
              ))}
            </div>
            
            {/* Charts and Reports */}
            <ChartsSection />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ContractReportsTable />
              </div>
              <div className="space-y-6">
                <ReviewPanel />
                <NotificationSystem />
                <AdminTools />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <EnhancedAnalytics 
              data={{
                totalContracts: stats.totalContracts,
                activeContracts: stats.activeContracts,
                pendingContracts: 0,
                completedContracts: 0,
                failedContracts: 0,
                monthlyGrowth: 12,
                totalRevenue: 125000,
                averageContractValue: 5000,
                averageProcessingTime: 3.5,
                successRate: 94,
                monthlyTargets: {
                  target: 50,
                  achieved: 42,
                  percentage: 84
                },
                recentTrends: {
                  contracts: 15,
                  revenue: 8,
                  efficiency: 5
                }
              }}
            />
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <SmartTemplateManager
              templates={[]}
              onCreateTemplate={(template) => console.log("Creating template:", template)}
              onUpdateTemplate={(id, updates) => console.log("Updating template:", id, updates)}
              onDeleteTemplate={(id) => console.log("Deleting template:", id)}
              onUseTemplate={(templateId) => console.log("Using template:", templateId)}
            />
          </TabsContent>

          <TabsContent value="workflows" className="space-y-6">
            <WorkflowManager
              workflows={[]}
              onApproveStep={(workflowId, stepId, notes) => console.log("Approving step:", workflowId, stepId, notes)}
              onRejectStep={(workflowId, stepId, notes) => console.log("Rejecting step:", workflowId, stepId, notes)}
              onSkipStep={(workflowId, stepId, notes) => console.log("Skipping step:", workflowId, stepId, notes)}
              onAddComment={(workflowId, message) => console.log("Adding comment:", workflowId, message)}
              onPauseWorkflow={(workflowId) => console.log("Pausing workflow:", workflowId)}
              onResumeWorkflow={(workflowId) => console.log("Resuming workflow:", workflowId)}
              onCancelWorkflow={(workflowId) => console.log("Cancelling workflow:", workflowId)}
            />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <NotificationCenter
              notifications={[]}
              settings={{
                email_notifications: true,
                push_notifications: true,
                slack_notifications: false,
                notification_types: {
                  contract_updates: true,
                  payment_reminders: true,
                  deadline_alerts: true,
                  workflow_updates: true,
                  system_updates: false
                },
                quiet_hours: {
                  enabled: false,
                  start_time: "22:00",
                  end_time: "08:00"
                }
              }}
              onMarkAsRead={(notificationId) => console.log("Marking as read:", notificationId)}
              onMarkAllAsRead={() => console.log("Marking all as read")}
              onDeleteNotification={(notificationId) => console.log("Deleting notification:", notificationId)}
              onUpdateSettings={(settings) => console.log("Updating settings:", settings)}
            />
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <IntegrationManager
              integrations={[]}
              templates={[]}
              onCreateIntegration={(template, config) => console.log("Creating integration:", template, config)}
              onUpdateIntegration={(id, updates) => console.log("Updating integration:", id, updates)}
              onDeleteIntegration={(id) => console.log("Deleting integration:", id)}
              onTestIntegration={(id) => console.log("Testing integration:", id)}
              onSyncIntegration={(id) => console.log("Syncing integration:", id)}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
