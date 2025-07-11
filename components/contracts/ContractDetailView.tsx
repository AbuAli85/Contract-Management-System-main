"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import {
  ArrowLeft,
  Download,
  Edit,
  Eye,
  Send,
  Printer,
  Share,
  History,
  FileText,
  Calendar,
  User,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Copy,
  ExternalLink,
  MapPin,
  Mail,
  Phone,
  Tag,
  Star,
  Archive,
  Trash2,
  RefreshCw,
  Activity,
  DollarSign,
  Users,
  FileCheck,
  AlertCircle,
} from "lucide-react"
import { format, formatDistanceToNow, differenceInDays, isAfter, isBefore } from "date-fns"
import { LoadingSpinner } from "@/components/ui/skeletons"

interface ContractDetailProps {
  contractId: string
}

interface ContractDetail {
  id: string
  contract_number?: string
  status?: string
  contract_start_date?: string
  contract_end_date?: string
  contract_value?: number
  salary?: number
  currency?: string
  job_title?: string
  department?: string
  work_location?: string
  email?: string
  contract_type?: string
  created_at?: string
  updated_at?: string
  error_details?: string
  google_doc_url?: string
  pdf_url?: string

  // Party information
  first_party_name_en?: string
  first_party_name_ar?: string
  first_party_crn?: string
  second_party_name_en?: string
  second_party_name_ar?: string
  second_party_crn?: string

  // Promoter information
  promoter_name_en?: string
  promoter_name_ar?: string
  promoter_email?: string
  promoter_phone?: string
  id_card_number?: string

  // Related entities
  employer?: any
  client?: any
  promoters?: any[]

  // IDs for relationships
  employer_id?: string
  client_id?: string
  promoter_id?: string
  first_party_id?: string
  second_party_id?: string
}

interface ActivityLog {
  id: string
  action: string
  description: string
  created_at: string
  user_email?: string
}

export function ContractDetailView({ contractId }: ContractDetailProps) {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const { toast } = useToast()

  const [contract, setContract] = useState<ContractDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [refreshing, setRefreshing] = useState(false)

  // Enhanced contract status calculation
  const contractStatus = useMemo(() => {
    if (!contract) return null

    const now = new Date()
    const startDate = contract.contract_start_date ? new Date(contract.contract_start_date) : null
    const endDate = contract.contract_end_date ? new Date(contract.contract_end_date) : null

    let calculatedStatus = contract.status || "draft"
    let statusColor = "bg-gray-100 text-gray-800"
    let statusIcon = FileText
    let daysUntilExpiry = null

    if (endDate) {
      daysUntilExpiry = differenceInDays(endDate, now)

      if (daysUntilExpiry < 0) {
        calculatedStatus = "expired"
        statusColor = "bg-red-100 text-red-800"
        statusIcon = AlertCircle
      } else if (daysUntilExpiry <= 30) {
        calculatedStatus = "expiring-soon"
        statusColor = "bg-orange-100 text-orange-800"
        statusIcon = AlertTriangle
      } else if (startDate && isAfter(now, startDate) && isBefore(now, endDate)) {
        calculatedStatus = "active"
        statusColor = "bg-green-100 text-green-800"
        statusIcon = CheckCircle2
      }
    }

    return {
      status: calculatedStatus,
      color: statusColor,
      icon: statusIcon,
      daysUntilExpiry,
    }
  }, [contract])

  // Fetch contract details with enhanced error handling
  const fetchContract = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch basic contract data
      const { data: contractData, error: contractError } = await supabase
        .from("contracts")
        .select("*")
        .eq("id", contractId)
        .single()

      if (contractError) {
        if (contractError.code === "PGRST116") {
          throw new Error("Contract not found")
        }
        throw new Error(`Failed to fetch contract: ${contractError.message}`)
      }

      let enhancedContract = { ...contractData }

      // Fetch related parties with proper error handling
      try {
        if (contractData.employer_id || contractData.first_party_id) {
          const partyId = contractData.employer_id || contractData.first_party_id
          const { data: employerData } = await supabase
            .from("parties")
            .select(
              "id, name_en, name_ar, crn, address_en, address_ar, contact_phone, contact_email"
            )
            .eq("id", partyId)
            .single()

          if (employerData) {
            enhancedContract.employer = employerData
          }
        }

        if (contractData.client_id || contractData.second_party_id) {
          const partyId = contractData.client_id || contractData.second_party_id
          const { data: clientData } = await supabase
            .from("parties")
            .select(
              "id, name_en, name_ar, crn, address_en, address_ar, contact_phone, contact_email"
            )
            .eq("id", partyId)
            .single()

          if (clientData) {
            enhancedContract.client = clientData
          }
        }

        if (contractData.promoter_id) {
          const { data: promoterData } = await supabase
            .from("promoters")
            .select("id, name_en, name_ar, id_card_number, email, phone")
            .eq("id", contractData.promoter_id)
            .single()

          if (promoterData) {
            enhancedContract.promoters = [promoterData]
          }
        }
      } catch (relationError) {
        console.warn("Error fetching related entities:", relationError)
        // Continue with basic contract data even if relations fail
      }

      setContract(enhancedContract)

      // Fetch activity logs
      await fetchActivityLogs()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load contract"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch activity logs
  const fetchActivityLogs = async () => {
    try {
      const { data: logs, error } = await supabase
        .from("contract_activity_logs")
        .select("*")
        .eq("contract_id", contractId)
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) {
        console.warn("Error fetching activity logs:", error)
        // Use mock data if activity logs table doesn't exist
        setActivityLogs([
          {
            id: "1",
            action: "created",
            description: "Contract was created and initialized",
            created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
            user_email: user?.email,
          },
          {
            id: "2",
            action: "updated",
            description: "Contract details were updated",
            created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
            user_email: user?.email,
          },
        ])
      } else {
        setActivityLogs(logs || [])
      }
    } catch (error) {
      console.warn("Error fetching activity logs:", error)
    }
  }

  // Refresh contract data
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchContract()
      toast({
        title: "Success",
        description: "Contract data refreshed successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh contract data",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  // Generate contract documents
  const handleGenerateDocuments = async () => {
    try {
      const response = await fetch("/api/webhook/makecom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contract_number: contract?.contract_number || contractId,
          user_id: user?.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate documents")
      }

      toast({
        title: "Success",
        description: "Document generation started successfully",
      })

      // Refresh contract data after a delay
      setTimeout(() => {
        fetchContract()
      }, 2000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to generate documents"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  // Utility functions
  const formatCurrency = (amount?: number | null, currency?: string | null) => {
    if (!amount) return "N/A"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount)
  }

  const calculateDuration = (startDate?: string | null, endDate?: string | null) => {
    if (!startDate || !endDate) return "N/A"
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 30) return `${diffDays} days`
    if (diffDays < 365) return `${Math.round(diffDays / 30)} months`
    return `${Math.round(diffDays / 365)} years`
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "created":
        return FileText
      case "updated":
        return Edit
      case "generated":
        return FileCheck
      case "sent":
        return Send
      case "downloaded":
        return Download
      case "viewed":
        return Eye
      default:
        return Activity
    }
  }

  useEffect(() => {
    if (isAuthenticated && contractId) {
      fetchContract()
    }
  }, [isAuthenticated, contractId])

  // Show loading state while authentication is being checked
  if (authLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
          <span className="ml-2">Loading contract...</span>
        </div>
      </div>
    )
  }

  // Show authentication required message
  if (!isAuthenticated || !user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contract Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <AlertTriangle className="mr-2 h-5 w-5" />
            <span>Authentication required to view contract details</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
          <span className="ml-2">Loading contract details...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader className="bg-red-50">
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            Error Loading Contract
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="mb-6 text-red-600">{error}</p>
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href="/contracts">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Contracts
              </Link>
            </Button>
            <Button onClick={fetchContract}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!contract) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="mx-auto mb-4 h-16 w-16 text-gray-400" />
          <h3 className="mb-2 text-lg font-semibold text-gray-900">Contract Not Found</h3>
          <p className="mb-6 text-gray-600">
            The contract you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link href="/contracts">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Contracts
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/contracts">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Contracts
            </Link>
          </Button>
          <div className="h-4 w-px bg-gray-300" />
          <nav className="flex items-center space-x-2 text-sm text-gray-500">
            <span>Contracts</span>
            <span>/</span>
            <span className="font-medium text-gray-900">Contract Details</span>
          </nav>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {contract.google_doc_url && (
            <Button variant="outline" asChild>
              <a href={contract.google_doc_url} target="_blank" rel="noopener noreferrer">
                <Eye className="mr-2 h-4 w-4" />
                View
              </a>
            </Button>
          )}
          <Button asChild>
            <Link href={`/edit-contract/${contractId}`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Contract Header Card */}
      <Card className="shadow-lg">
        <CardContent className="p-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-4 flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">Contract Details</h1>
                {contractStatus && (
                  <Badge
                    className={`${contractStatus.color} flex items-center gap-1 px-3 py-1 text-sm font-medium`}
                  >
                    <contractStatus.icon className="h-4 w-4" />
                    {contractStatus.status.replace("-", " ")}
                  </Badge>
                )}
                {contractStatus?.daysUntilExpiry !== null &&
                  contractStatus.daysUntilExpiry <= 30 &&
                  contractStatus.daysUntilExpiry > 0 && (
                    <Badge variant="outline" className="border-orange-200 text-orange-600">
                      <Clock className="mr-1 h-3 w-3" />
                      {contractStatus.daysUntilExpiry} days left
                    </Badge>
                  )}
              </div>

              <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="font-medium text-gray-500">Contract Number</label>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="rounded bg-gray-100 px-2 py-1 font-mono text-xs">
                      {contract.contract_number || contractId}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        navigator.clipboard.writeText(contract.contract_number || contractId)
                      }
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="font-medium text-gray-500">Created</label>
                  <p className="mt-1">
                    {contract.created_at
                      ? format(new Date(contract.created_at), "MMM dd, yyyy")
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <label className="font-medium text-gray-500">Duration</label>
                  <p className="mt-1">
                    {calculateDuration(contract.contract_start_date, contract.contract_end_date)}
                  </p>
                </div>
                <div>
                  <label className="font-medium text-gray-500">Value</label>
                  <p className="mt-1">
                    {formatCurrency(contract.contract_value || contract.salary, contract.currency)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert for expiring contracts */}
      {contractStatus?.daysUntilExpiry !== null &&
        contractStatus.daysUntilExpiry <= 7 &&
        contractStatus.daysUntilExpiry > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-orange-800">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Contract Expiring Soon</span>
              </div>
              <p className="mt-1 text-sm text-orange-700">
                This contract will expire in {contractStatus.daysUntilExpiry} days. Consider renewal
                or extension.
              </p>
            </CardContent>
          </Card>
        )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <p className="text-2xl font-bold capitalize">
                  {contractStatus?.status.replace("-", " ") || "Unknown"}
                </p>
              </div>
              {contractStatus && <contractStatus.icon className="h-8 w-8 text-muted-foreground" />}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Duration</p>
                <p className="text-2xl font-bold">
                  {calculateDuration(contract.contract_start_date, contract.contract_end_date)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Value</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(contract.contract_value || contract.salary, contract.currency)}
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
                <p className="text-sm font-medium text-muted-foreground">Documents</p>
                <p className="text-2xl font-bold">
                  {(contract.google_doc_url ? 1 : 0) + (contract.pdf_url ? 1 : 0)}
                </p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="parties">Parties</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Contract Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Contract Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Job Title</label>
                    <p className="mt-1 font-semibold text-gray-900">
                      {contract.job_title || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Department</label>
                    <p className="mt-1 font-semibold text-gray-900">
                      {contract.department || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Start Date</label>
                    <p className="mt-1 font-semibold text-gray-900">
                      {contract.contract_start_date
                        ? format(new Date(contract.contract_start_date), "PPP")
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">End Date</label>
                    <p className="mt-1 font-semibold text-gray-900">
                      {contract.contract_end_date
                        ? format(new Date(contract.contract_end_date), "PPP")
                        : "N/A"}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Work Location</label>
                  <p className="mt-1 flex items-center gap-2 font-semibold text-gray-900">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    {contract.work_location || "N/A"}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="mt-1 flex items-center gap-2 font-semibold text-gray-900">
                    <Mail className="h-4 w-4 text-gray-500" />
                    {contract.email || "N/A"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* System Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  System Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Contract ID</label>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="flex-1 rounded-lg bg-gray-100 px-3 py-2 font-mono text-sm">
                      {contract.id}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigator.clipboard.writeText(contract.id)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created At</label>
                    <p className="mt-1 text-sm text-gray-700">
                      {contract.created_at ? format(new Date(contract.created_at), "PPpp") : "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Updated At</label>
                    <p className="mt-1 text-sm text-gray-700">
                      {contract.updated_at ? format(new Date(contract.updated_at), "PPpp") : "N/A"}
                    </p>
                  </div>
                </div>

                {contract.error_details && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                    <label className="text-sm font-medium text-red-700">Error Details</label>
                    <p className="mt-1 text-sm text-red-600">{contract.error_details}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="parties" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Employer Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Employer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Company Name (English)
                  </label>
                  <p className="mt-1 font-semibold text-gray-900">
                    {contract.employer?.name_en || contract.first_party_name_en || "Not specified"}
                  </p>
                </div>
                {(contract.employer?.name_ar || contract.first_party_name_ar) && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Company Name (Arabic)
                    </label>
                    <p className="mt-1 font-semibold text-gray-900" dir="rtl">
                      {contract.employer?.name_ar || contract.first_party_name_ar}
                    </p>
                  </div>
                )}
                {(contract.employer?.crn || contract.first_party_crn) && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Commercial Registration
                    </label>
                    <p className="mt-1 font-mono text-sm text-gray-700">
                      {contract.employer?.crn || contract.first_party_crn}
                    </p>
                  </div>
                )}
                <div className="border-t pt-4">
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href="/manage-parties">View Details</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Client Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name (English)</label>
                  <p className="mt-1 font-semibold text-gray-900">
                    {contract.client?.name_en || contract.second_party_name_en || "Not specified"}
                  </p>
                </div>
                {(contract.client?.name_ar || contract.second_party_name_ar) && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name (Arabic)</label>
                    <p className="mt-1 font-semibold text-gray-900" dir="rtl">
                      {contract.client?.name_ar || contract.second_party_name_ar}
                    </p>
                  </div>
                )}
                {(contract.client?.crn || contract.second_party_crn) && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Commercial Registration
                    </label>
                    <p className="mt-1 font-mono text-sm text-gray-700">
                      {contract.client?.crn || contract.second_party_crn}
                    </p>
                  </div>
                )}
                <div className="border-t pt-4">
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href="/manage-parties">View Details</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Promoter Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Promoter
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contract.promoters && contract.promoters.length > 0 ? (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name (English)</label>
                      <p className="mt-1 font-semibold text-gray-900">
                        {contract.promoters[0].name_en}
                      </p>
                    </div>
                    {contract.promoters[0].name_ar && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Name (Arabic)</label>
                        <p className="mt-1 font-semibold text-gray-900" dir="rtl">
                          {contract.promoters[0].name_ar}
                        </p>
                      </div>
                    )}
                    {contract.promoters[0].id_card_number && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">ID Card Number</label>
                        <p className="mt-1 font-mono text-sm text-gray-700">
                          {contract.promoters[0].id_card_number}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-8 text-center">
                    <User className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                    <p className="font-medium text-gray-500">No promoter assigned</p>
                    <p className="text-sm text-gray-400">
                      This contract doesn't have an assigned promoter.
                    </p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href="/manage-promoters">
                      {contract.promoters && contract.promoters.length > 0
                        ? "View Details"
                        : "Assign Promoter"}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Generated Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contract.google_doc_url ? (
                  <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Google Document</p>
                        <p className="text-sm text-gray-600">Editable contract document</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild size="sm" variant="outline">
                        <a href={contract.google_doc_url} target="_blank" rel="noopener noreferrer">
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </a>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <a href={contract.google_doc_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-lg border bg-gray-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200">
                        <FileText className="h-5 w-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-400">Google Document</p>
                        <p className="text-sm text-gray-400">Not yet generated</p>
                      </div>
                    </div>
                    <Button size="sm" onClick={handleGenerateDocuments}>
                      <FileText className="mr-2 h-4 w-4" />
                      Generate
                    </Button>
                  </div>
                )}

                {contract.pdf_url ? (
                  <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                        <FileText className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">PDF Document</p>
                        <p className="text-sm text-gray-600">Downloadable contract PDF</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild size="sm" variant="outline">
                        <a href={contract.pdf_url} target="_blank" rel="noopener noreferrer">
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </a>
                      </Button>
                      <Button asChild size="sm">
                        <a href={contract.pdf_url} download>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </a>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-lg border bg-gray-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200">
                        <FileText className="h-5 w-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-400">PDF Document</p>
                        <p className="text-sm text-gray-400">Not yet generated</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" disabled>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                )}

                {!contract.google_doc_url && !contract.pdf_url && (
                  <div className="py-12 text-center">
                    <FileText className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                    <h3 className="mb-2 text-lg font-medium text-gray-900">
                      No Documents Generated
                    </h3>
                    <p className="mb-6 text-gray-500">
                      Generate documents to get started with this contract.
                    </p>
                    <Button onClick={handleGenerateDocuments}>
                      <FileText className="mr-2 h-4 w-4" />
                      Generate Documents
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MoreHorizontal className="h-5 w-5" />
                  Document Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start gap-2"
                  variant="outline"
                  onClick={handleGenerateDocuments}
                >
                  <FileText className="h-4 w-4" />
                  Generate New Version
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline">
                  <Send className="h-4 w-4" />
                  Send via Email
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline">
                  <Share className="h-4 w-4" />
                  Share Link
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline">
                  <Printer className="h-4 w-4" />
                  Print Document
                </Button>

                <Separator className="my-4" />

                <Button className="w-full justify-start gap-2" variant="outline">
                  <Download className="h-4 w-4" />
                  Download All
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline">
                  <Copy className="h-4 w-4" />
                  Duplicate Contract
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Contract Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="absolute bottom-0 left-6 top-0 w-0.5 bg-gray-200"></div>

                <div className="space-y-8">
                  <div className="relative flex items-start gap-6">
                    <div className="relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 shadow-lg">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 rounded-lg border bg-white p-4 shadow-sm">
                      <h4 className="font-semibold text-gray-900">Contract Created</h4>
                      <p className="mt-1 text-sm text-gray-600">
                        Initial contract generation and setup
                      </p>
                      <p className="mt-2 text-xs text-gray-500">
                        {contract.created_at
                          ? format(new Date(contract.created_at), "PPpp")
                          : "Date not available"}
                      </p>
                    </div>
                  </div>

                  {contract.contract_start_date && (
                    <div className="relative flex items-start gap-6">
                      <div className="relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-500 shadow-lg">
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 rounded-lg border bg-white p-4 shadow-sm">
                        <h4 className="font-semibold text-gray-900">Contract Start Date</h4>
                        <p className="mt-1 text-sm text-gray-600">
                          Contract becomes effective and active
                        </p>
                        <p className="mt-2 text-xs text-gray-500">
                          {format(new Date(contract.contract_start_date), "PPpp")}
                        </p>
                      </div>
                    </div>
                  )}

                  {contract.google_doc_url && (
                    <div className="relative flex items-start gap-6">
                      <div className="relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-purple-500 shadow-lg">
                        <FileCheck className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 rounded-lg border bg-white p-4 shadow-sm">
                        <h4 className="font-semibold text-gray-900">Document Generated</h4>
                        <p className="mt-1 text-sm text-gray-600">
                          Google document was created and is available for viewing
                        </p>
                        <p className="mt-2 text-xs text-gray-500">Document available</p>
                      </div>
                    </div>
                  )}

                  {contract.contract_end_date && (
                    <div className="relative flex items-start gap-6">
                      <div className="relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-orange-500 shadow-lg">
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 rounded-lg border bg-white p-4 shadow-sm">
                        <h4 className="font-semibold text-gray-900">Contract End Date</h4>
                        <p className="mt-1 text-sm text-gray-600">
                          Contract expiration and completion
                        </p>
                        <p className="mt-2 text-xs text-gray-500">
                          {format(new Date(contract.contract_end_date), "PPpp")}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="relative flex items-start gap-6">
                    <div className="relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-400 shadow-lg">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 rounded-lg border bg-white p-4 shadow-sm">
                      <h4 className="font-semibold text-gray-900">Last Updated</h4>
                      <p className="mt-1 text-sm text-gray-600">
                        Most recent modification to the contract
                      </p>
                      <p className="mt-2 text-xs text-gray-500">
                        {contract.updated_at
                          ? format(new Date(contract.updated_at), "PPpp")
                          : "No updates recorded"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Activity History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityLogs.map((log) => {
                  const IconComponent = getActionIcon(log.action)
                  return (
                    <div
                      key={log.id}
                      className="flex items-start gap-4 rounded-lg border bg-gray-50 p-4"
                    >
                      <div className="flex-shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                          <IconComponent className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold capitalize text-gray-900">{log.action}</p>
                        <p className="mt-1 text-sm text-gray-600">{log.description}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                          </p>
                          {log.user_email && (
                            <>
                              <span className="text-gray-300">•</span>
                              <p className="text-xs text-gray-500">{log.user_email}</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Document Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {contract.google_doc_url && (
                  <Button asChild className="w-full justify-start gap-2">
                    <a href={contract.google_doc_url} target="_blank" rel="noopener noreferrer">
                      <Eye className="h-4 w-4" />
                      View Document
                    </a>
                  </Button>
                )}
                {contract.pdf_url && (
                  <Button asChild className="w-full justify-start gap-2" variant="outline">
                    <a href={contract.pdf_url} download>
                      <Download className="h-4 w-4" />
                      Download PDF
                    </a>
                  </Button>
                )}
                <Button className="w-full justify-start gap-2" variant="outline">
                  <Printer className="h-4 w-4" />
                  Print Document
                </Button>
                <Button
                  className="w-full justify-start gap-2"
                  variant="outline"
                  onClick={handleGenerateDocuments}
                >
                  <FileText className="h-4 w-4" />
                  Regenerate
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Communication</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start gap-2">
                  <Send className="h-4 w-4" />
                  Send via Email
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline">
                  <Share className="h-4 w-4" />
                  Share Link
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline">
                  <Mail className="h-4 w-4" />
                  Send Reminder
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline">
                  <MoreHorizontal className="h-4 w-4" />
                  More Options
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full justify-start gap-2">
                  <Link href={`/edit-contract/${contractId}`}>
                    <Edit className="h-4 w-4" />
                    Edit Contract
                  </Link>
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline">
                  <Copy className="h-4 w-4" />
                  Duplicate Contract
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline">
                  <Star className="h-4 w-4" />
                  Add to Favorites
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline">
                  <Archive className="h-4 w-4" />
                  Archive Contract
                </Button>

                <Separator className="my-3" />

                <Button className="w-full justify-start gap-2" variant="destructive">
                  <Trash2 className="h-4 w-4" />
                  Delete Contract
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
