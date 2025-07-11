"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import ContractGeneratorForm from "@/components/ContractGeneratorForm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { useSupabase } from "@/components/supabase-provider"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeft,
  FileText,
  Users,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Info,
  Sparkles,
  Clock,
  TrendingUp,
  FileCheck,
  UserCheck,
  Building2,
  Briefcase,
  MapPin,
  Hash,
  Download,
  Eye,
  Copy,
  Share2,
  History,
  Settings,
  HelpCircle,
  ChevronRight,
  Zap,
  Shield,
  Award
} from "lucide-react"
import Link from "next/link"
import type { Contract, Party, Promoter } from "@/lib/types"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface ContractTemplate {
  id: string
  name: string
  description: string
  icon: React.ElementType
  fields: string[]
  popular?: boolean
}

const contractTemplates: ContractTemplate[] = {
  {
    id: "employment",
    name: "Employment Contract",
    description: "Standard employment agreement with salary and benefits",
    icon: Briefcase,
    fields: ["salary", "benefits", "probation", "notice_period"],
    popular: true
  },
  {
    id: "service",
    name: "Service Agreement",
    description: "Professional services contract for consultants",
    icon: FileCheck,
    fields: ["scope", "deliverables", "payment_terms", "milestones"]
  },
  {
    id: "partnership",
    name: "Partnership Agreement",
    description: "Business partnership with profit sharing",
    icon: Users,
    fields: ["profit_share", "responsibilities", "capital", "exit_clause"]
  },
  {
    id: "freelance",
    name: "Freelance Contract",
    description: "Project-based work agreement",
    icon: Zap,
    fields: ["project_scope", "hourly_rate", "deadline", "revisions"]
  }
]

interface RecentContract {
  id: string
  contract_number: string
  first_party: Party
  second_party: Party
  promoter: Promoter
  created_at: string
  status: string
}

export default function GenerateContractPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { supabase } = useSupabase()
  
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [showTemplates, setShowTemplates] = useState(true)
  const [recentContracts, setRecentContracts] = useState<RecentContract[]>([])
  const [loadingRecent, setLoadingRecent] = useState(true)
  const [contractStats, setContractStats] = useState({
    total: 0,
    thisMonth: 0,
    avgProcessingTime: 0,
    successRate: 0
  })

  useEffect(() => {
    fetchRecentContracts()
    fetchContractStats()
  }, [])

  const fetchRecentContracts = async () => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          id,
          contract_number,
          created_at,
          status,
          first_party:parties!contracts_first_party_id_fkey(id, name_en, name_ar),
          second_party:parties!contracts_second_party_id_fkey(id, name_en, name_ar),
          promoter:promoters(id, name_en, name_ar)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error
      setRecentContracts(data || [])
    } catch (error) {
      console.error('Error fetching recent contracts:', error)
    } finally {
      setLoadingRecent(false)
    }
  }

  const fetchContractStats = async () => {
    try {
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select('created_at, status, updated_at')

      if (error) throw error

      if (contracts) {
        const now = new Date()
        const thisMonth = contracts.filter(c => {
          const created = new Date(c.created_at)
          return created.getMonth() === now.getMonth() && 
                 created.getFullYear() === now.getFullYear()
        })

        const completed = contracts.filter(c => c.status === 'completed' || c.status === 'active')
        
        setContractStats({
          total: contracts.length,
          thisMonth: thisMonth.length,
          avgProcessingTime: 2.5, // This would be calculated from actual data
          successRate: contracts.length > 0 ? (completed.length / contracts.length) * 100 : 0
        })
      }
    } catch (error) {
      console.error('Error fetching contract stats:', error)
    }
  }

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    setShowTemplates(false)
    toast({
      title: "Template Selected",
      description: `You've selected the ${contractTemplates.find(t => t.id === templateId)?.name} template.`,
    })
  }

  const handleDuplicateContract = async (contractId: string) => {
    try {
      // Fetch the contract details
      const { data: contract, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', contractId)
        .single()

      if (error) throw error

      // Navigate to generate page with contract data
      router.push(`/generate-contract?duplicate=${contractId}`)
      
      toast({
        title: "Duplicating Contract",
        description: "Creating a new contract based on the selected template.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate contract. Please try again.",
        variant: "destructive"
      })
    }
  }

  if (!showTemplates) {
    return (
      <div className="container max-w-7xl py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTemplates(true)}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <h1 className="text-3xl font-bold">Create New Contract</h1>
            </div>
            <p className="text-muted-foreground">
              Fill in the details below to generate your contract
            </p>
          </div>
          <Badge variant="outline" className="gap-1">
            <Sparkles className="h-3 w-3" />
            {selectedTemplate && contractTemplates.find(t => t.id === selectedTemplate)?.name}
          </Badge>
        </div>

        <ContractGeneratorForm />
      </div>
    )
  }

  return (
    <div className="container max-w-7xl py-8 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight">Contract Generation</h1>
            <p className="text-lg text-muted-foreground">
              Create professional contracts with our intelligent generation system
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/contracts">
              <History className="mr-2 h-4 w-4" />
              View All Contracts
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Contracts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contractStats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                All time
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {contractStats.thisMonth}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                New contracts
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg. Processing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {contractStats.avgProcessingTime}h
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Time to complete
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {contractStats.successRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Completion rate
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="guide">Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          {/* Quick Start */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Quick Start
              </CardTitle>
              <CardDescription>
                Choose how you want to create your contract
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Button
                variant="outline"
                className="h-auto p-6 justify-start"
                onClick={() => {
                  setSelectedTemplate(null)
                  setShowTemplates(false)
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">Blank Contract</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Start from scratch with full customization
                    </p>
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-6 justify-start"
                onClick={() => router.push('/contracts?action=import')}
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <Download className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">Import Contract</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Upload an existing contract document
                    </p>
                  </div>
                </div>
              </Button>
            </CardContent>
          </Card>

          {/* Contract Templates */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Contract Templates</h2>
              <Badge variant="secondary">
                {contractTemplates.length} templates available
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              {contractTemplates.map((template) => {
                const Icon = template.icon
                return (
                  <Card
                    key={template.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]",
                      template.popular && "ring-2 ring-primary"
                    )}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="rounded-lg bg-primary/10 p-3">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        {template.popular && (
                          <Badge variant="default" className="gap-1">
                            <Award className="h-3 w-3" />
                            Popular
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="mt-4">{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {template.fields.slice(0, 3).map((field) => (
                          <Badge key={field} variant="secondary" className="text-xs">
                            {field.replace('_', ' ')}
                          </Badge>
                        ))}
                        {template.fields.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{template.fields.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>Why Use Our Contract Generator?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Legally Compliant</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      All templates follow local regulations and best practices
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Save Time</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Generate contracts in minutes, not hours
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Track Performance</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Monitor contract status and analytics
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Contracts</CardTitle>
              <CardDescription>
                Your recently created contracts for quick reference or duplication
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRecent ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : recentContracts.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold">No contracts yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Create your first contract to see it here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentContracts.map((contract) => (
                    <div
                      key={contract.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{contract.contract_number}</p>
                          <Badge variant={contract.status === 'active' ? 'default' : 'secondary'}>
                            {contract.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {contract.first_party?.name_en} ↔ {contract.second_party?.name_en}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Created {format(new Date(contract.created_at), 'PPp')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/contracts/${contract.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicateContract(contract.id)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guide" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contract Generation Guide</CardTitle>
              <CardDescription>
                Follow these steps to create a professional contract
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {[
                  {
                    step: 1,
                    title: "Choose Your Starting Point",
                    description: "Select a template or start from scratch",
                    icon: FileText
                  },
                  {
                    step: 2,
                    title: "Select Contract Parties",
                    description: "Choose the first and second parties from your registered parties",
                    icon: Users
                  },
                  {
                    step: 3,
                    title: "Assign a Promoter",
                    description: "Select the promoter who will work under this contract",
                    icon: UserCheck
                  },
                  {
                    step: 4,
                    title: "Set Contract Duration",
                    description: "Define the start and end dates for the contract",
                    icon: Calendar
                  },
                  {
                    step: 5,
                    title: "Add Contract Details",
                    description: "Include value, job title, and work location as needed",
                    icon: Briefcase
                  },
                  {
                    step: 6,
                    title: "Review and Generate",
                    description: "Review all details and generate your contract",
                    icon: CheckCircle2
                  }
                ].map((item, index) => {
                  const Icon = item.icon
                  return (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          {item.step}
                        </div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <h4 className="font-medium flex items-center gap-2">
                          {item.title}
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <Separator />

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Pro Tip:</strong> Make sure all parties and promoters are registered in the system before creating a contract. You can add them from the Manage Parties and Manage Promoters sections.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button asChild>
                  <Link href="/manage-parties">
                    <Building2 className="mr-2 h-4 w-4" />
                    Manage Parties
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/manage-promoters">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Promoters
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}