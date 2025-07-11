"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import {
  ArrowLeftIcon,
  DownloadIcon,
  EditIcon,
  EyeIcon,
  SendIcon,
  PrinterIcon,
  ShareIcon,
  HistoryIcon,
  FileTextIcon,
  CalendarIcon,
  UserIcon,
  BuildingIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  MoreHorizontalIcon,
  CopyIcon,
  ExternalLinkIcon,
  MapPinIcon,
  MailIcon,
  PhoneIcon,
  TagIcon,
} from "lucide-react"
import { ContractDetail, Party, Promoter } from "@/lib/types"

interface ActivityLog {
  id: string
  action: string
  description: string
  created_at: string
  user_id?: string
  metadata?: any
}

export default function ContractDetailPage() {
  const params = useParams()
  const [contract, setContract] = useState<ContractDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  if (!params) {
    return <div>Loading...</div> // Or some other loading/error state
  }
  const contractId = params.id as string

  const mockActivityLogs: ActivityLog[] = [
    {
      id: "1",
      action: "created",
      description: "Contract was created and initialized",
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: "2",
      action: "generated",
      description: "Google document was generated successfully",
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: "3",
      action: "reviewed",
      description: "Contract was reviewed by legal team",
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
    {
      id: "4",
      action: "sent",
      description: "Contract was sent to parties for review",
      created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    },
    {
      id: "5",
      action: "downloaded",
      description: "PDF document was downloaded",
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
  ]

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])

  const getStatusColor = (status?: string | null) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "draft":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      case "expired":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status?: string | null) => {
    switch (status?.toLowerCase()) {
      case "active":
        return <CheckCircleIcon className="h-4 w-4" />
      case "completed":
        return <CheckCircleIcon className="h-4 w-4" />
      case "pending":
        return <ClockIcon className="h-4 w-4" />
      case "draft":
        return <FileTextIcon className="h-4 w-4" />
      case "cancelled":
        return <AlertCircleIcon className="h-4 w-4" />
      case "expired":
        return <AlertCircleIcon className="h-4 w-4" />
      default:
        return <FileTextIcon className="h-4 w-4" />
    }
  }

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

  useEffect(() => {
    async function fetchContract() {
      try {
        setLoading(true)
        setError(null)
        console.log("Fetching contract with ID:", contractId)

        // Fetch basic contract data
        const { data: basicData, error: basicError } = await supabase
          .from("contracts")
          .select("*")
          .eq("id", contractId)
          .single<ContractDetail>()

        if (basicError) {
          console.error("Basic query error:", basicError)
          setError(basicError.message)
          return
        }

        if (!basicData) {
          setError("Contract not found.")
          return
        }

        console.log("Basic contract data:", basicData)

        let enhancedData: ContractDetail = { ...basicData }

        if (basicData.employer_id) {
          const { data: employerData } = await supabase
            .from("parties")
            .select("*")
            .eq("id", basicData.employer_id)
            .single<Party>()

          if (employerData) {
            enhancedData.employer = employerData
          }
        }

        if (basicData.client_id) {
          const { data: clientData } = await supabase
            .from("parties")
            .select("*")
            .eq("id", basicData.client_id)
            .single<Party>()

          if (clientData) {
            enhancedData.client = clientData
          }
        }

        if (basicData.promoter_id) {
          const { data: promoterData } = await supabase
            .from("promoters")
            .select("*")
            .eq("id", basicData.promoter_id)
            .single<Promoter>()

          if (promoterData) {
            enhancedData.promoters = [promoterData]
          }
        }

        console.log("Enhanced contract data:", enhancedData)
        setContract(enhancedData)
        setActivityLogs(mockActivityLogs)
      } catch (err: any) {
        console.error("Exception:", err)
        setError(err.message || "Failed to load contract")
      } finally {
        setLoading(false)
      }
    }

    if (contractId) {
      fetchContract()
    }
  }, [contractId])

  const DetailItem = ({
    icon,
    label,
    value,
    children,
  }: {
    icon: React.ReactNode
    label: string
    value?: string | React.ReactNode
    children?: React.ReactNode
  }) => (
    <div>
      <label className="text-sm font-medium text-gray-500">{label}</label>
      <div className="mt-1 flex items-center gap-2">
        {icon}
        <span className="font-semibold text-gray-900">{value}</span>
      </div>
      {children}
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <Card className="shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Loading Contract Details</h3>
              <p className="text-gray-600">
                Please wait while we fetch the contract information...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <Card className="border-red-200 shadow-lg">
            <CardHeader className="bg-red-50">
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertCircleIcon className="h-5 w-5" />
                Error Loading Contract
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="mb-6 text-red-600">{error}</p>
              <div className="flex gap-3">
                <Button asChild variant="outline">
                  <Link href="/contracts">
                    <ArrowLeftIcon className="mr-2 h-4 w-4" />
                    Back to Contracts
                  </Link>
                </Button>
                <Button onClick={() => window.location.reload()}>Try Again</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <Card className="shadow-lg">
            <CardContent className="p-12 text-center">
              <FileTextIcon className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Contract Not Found</h3>
              <p className="mb-6 text-gray-600">
                The contract you're looking for doesn't exist or has been removed.
              </p>
              <Button asChild>
                <Link href="/contracts">
                  <ArrowLeftIcon className="mr-2 h-4 w-4" />
                  Back to Contracts
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-8xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="mb-6 flex items-center gap-4">
            <Button asChild variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              <Link href="/contracts">
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
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

          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-4 flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-gray-900">Contract Details</h1>
                  <Badge
                    className={`${getStatusColor(contract?.status)} flex items-center gap-1 px-3 py-1 text-sm font-medium`}
                  >
                    {getStatusIcon(contract?.status)}
                    {contract?.status || "Unknown"}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="font-medium text-gray-500">Contract ID</label>
                    <div className="mt-1 flex items-center gap-2">
                      <code className="rounded bg-gray-100 px-2 py-1 font-mono text-xs">
                        {contractId}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigator.clipboard.writeText(contractId)}
                      >
                        <CopyIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="font-medium text-gray-500">Created</label>
                    <p className="mt-1">
                      {contract.created_at
                        ? new Date(contract.created_at).toLocaleDateString()
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
                    <label className="font-medium text-gray-500">Type</label>
                    <p className="mt-1">{contract.contract_type || "Standard"}</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="ml-8 flex items-center gap-2">
                {contract?.google_doc_url && (
                  <Button asChild size="sm" variant="outline" className="gap-2">
                    <a href={contract.google_doc_url} target="_blank" rel="noopener noreferrer">
                      <EyeIcon className="h-4 w-4" />
                      View
                    </a>
                  </Button>
                )}

                <Button asChild size="sm" variant="outline" className="gap-2">
                  <Link href={`/edit-contract/${contractId}`}>
                    <EditIcon className="h-4 w-4" />
                    Edit
                  </Link>
                </Button>

                {contract?.pdf_url && (
                  <Button asChild size="sm" variant="outline" className="gap-2">
                    <a href={contract.pdf_url} download>
                      <DownloadIcon className="h-4 w-4" />
                      Download
                    </a>
                  </Button>
                )}

                <Button size="sm" className="gap-2">
                  <SendIcon className="h-4 w-4" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
            <TabsList className="grid w-full grid-cols-6 bg-transparent">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="parties"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                Parties
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                Documents
              </TabsTrigger>
              <TabsTrigger
                value="timeline"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                Timeline
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                History
              </TabsTrigger>
              <TabsTrigger
                value="actions"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                Actions
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700">Contract Status</p>
                      <p className="text-2xl font-bold capitalize text-blue-900">
                        {contract?.status || "Unknown"}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-200">
                      {getStatusIcon(contract?.status)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700">Duration</p>
                      <p className="text-2xl font-bold text-green-900">
                        {calculateDuration(
                          contract?.contract_start_date,
                          contract?.contract_end_date
                        )}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-200">
                      <CalendarIcon className="h-6 w-6 text-green-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700">Salary</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {formatCurrency(contract?.salary, contract?.currency)}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-200">
                      <TagIcon className="h-6 w-6 text-purple-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-700">Documents</p>
                      <p className="text-2xl font-bold text-orange-900">
                        {(contract?.google_doc_url ? 1 : 0) + (contract?.pdf_url ? 1 : 0)}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-200">
                      <FileTextIcon className="h-6 w-6 text-orange-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contract Information */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="shadow-lg">
                <CardHeader className="border-b bg-gray-50">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <FileTextIcon className="h-5 w-5" />
                    Contract Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Job Title</label>
                        <p className="mt-1 font-semibold text-gray-900">
                          {contract?.job_title || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Department</label>
                        <p className="mt-1 font-semibold text-gray-900">
                          {contract?.department || "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Start Date</label>
                        <p className="mt-1 font-semibold text-gray-900">
                          {contract?.contract_start_date
                            ? new Date(contract.contract_start_date).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">End Date</label>
                        <p className="mt-1 font-semibold text-gray-900">
                          {contract?.contract_end_date
                            ? new Date(contract.contract_end_date).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Work Location</label>
                      <p className="mt-1 flex items-center gap-2 font-semibold text-gray-900">
                        <MapPinIcon className="h-4 w-4 text-gray-500" />
                        {contract?.work_location || "N/A"}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="mt-1 flex items-center gap-2 font-semibold text-gray-900">
                        <MailIcon className="h-4 w-4 text-gray-500" />
                        {contract?.email || "N/A"}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Contract Number</label>
                      <p className="mt-1 font-semibold text-gray-900">
                        {contract?.contract_number || "Not assigned"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader className="border-b bg-gray-50">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <AlertCircleIcon className="h-5 w-5" />
                    System Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Contract ID</label>
                      <div className="mt-1 flex items-center gap-2">
                        <code className="flex-1 rounded-lg bg-gray-100 px-3 py-2 font-mono text-sm">
                          {contract?.id}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigator.clipboard.writeText(contract?.id || "")}
                        >
                          <CopyIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Employer ID</label>
                        <p className="mt-1 font-mono text-sm text-gray-700">
                          {contract?.employer_id || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Client ID</label>
                        <p className="mt-1 font-mono text-sm text-gray-700">
                          {contract?.client_id || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Promoter ID</label>
                        <p className="mt-1 font-mono text-sm text-gray-700">
                          {contract?.promoter_id || "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Created At</label>
                        <p className="mt-1 text-sm text-gray-700">
                          {contract?.created_at
                            ? new Date(contract.created_at).toLocaleString()
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Updated At</label>
                        <p className="mt-1 text-sm text-gray-700">
                          {contract?.updated_at
                            ? new Date(contract.updated_at).toLocaleString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>

                    {contract?.error_details && (
                      <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                        <label className="text-sm font-medium text-red-700">Error Details</label>
                        <p className="mt-1 text-sm text-red-600">{contract.error_details}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Parties Tab */}
          <TabsContent value="parties" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Employer Card */}
              <Card className="shadow-lg transition-shadow hover:shadow-xl">
                <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-blue-100">
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <BuildingIcon className="h-5 w-5" />
                    Employer
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Company Name (English)
                      </label>
                      <p className="mt-1 font-semibold text-gray-900">
                        {contract?.employer?.name_en ||
                          contract?.first_party_name_en ||
                          "Not specified"}
                      </p>
                    </div>
                    {(contract?.employer?.name_ar || contract?.first_party_name_ar) && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Company Name (Arabic)
                        </label>
                        <p className="mt-1 font-semibold text-gray-900" dir="rtl">
                          {contract?.employer?.name_ar || contract?.first_party_name_ar}
                        </p>
                      </div>
                    )}
                    {contract?.employer?.crn && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Commercial Registration
                        </label>
                        <p className="mt-1 font-mono text-sm text-gray-700">
                          {contract.employer.crn}
                        </p>
                      </div>
                    )}
                    {contract?.employer?.email && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="mt-1 flex items-center gap-2 text-sm text-gray-700">
                          <MailIcon className="h-4 w-4 text-gray-500" />
                          {contract.employer.email}
                        </p>
                      </div>
                    )}
                    {contract?.employer?.phone && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <p className="mt-1 flex items-center gap-2 text-sm text-gray-700">
                          <PhoneIcon className="h-4 w-4 text-gray-500" />
                          {contract.employer.phone}
                        </p>
                      </div>
                    )}
                    {contract?.employer?.address && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Address</label>
                        <p className="mt-1 flex items-start gap-2 text-sm text-gray-700">
                          <MapPinIcon className="mt-0.5 h-4 w-4 text-gray-500" />
                          {contract.employer.address}
                        </p>
                      </div>
                    )}

                    <div className="border-t pt-4">
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <Link href={`/manage-parties`}>View Details</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Client Card */}
              <Card className="shadow-lg transition-shadow hover:shadow-xl">
                <CardHeader className="border-b bg-gradient-to-r from-green-50 to-green-100">
                  <CardTitle className="flex items-center gap-2 text-green-900">
                    <UserIcon className="h-5 w-5" />
                    Client
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name (English)</label>
                      <p className="mt-1 font-semibold text-gray-900">
                        {contract?.client?.name_en ||
                          contract?.second_party_name_en ||
                          "Not specified"}
                      </p>
                    </div>
                    {(contract?.client?.name_ar || contract?.second_party_name_ar) && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Name (Arabic)</label>
                        <p className="mt-1 font-semibold text-gray-900" dir="rtl">
                          {contract?.client?.name_ar || contract?.second_party_name_ar}
                        </p>
                      </div>
                    )}
                    {contract?.client?.crn && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Commercial Registration
                        </label>
                        <p className="mt-1 font-mono text-sm text-gray-700">
                          {contract.client.crn}
                        </p>
                      </div>
                    )}
                    {contract?.client?.email && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="mt-1 flex items-center gap-2 text-sm text-gray-700">
                          <MailIcon className="h-4 w-4 text-gray-500" />
                          {contract.client.email}
                        </p>
                      </div>
                    )}
                    {contract?.client?.phone && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <p className="mt-1 flex items-center gap-2 text-sm text-gray-700">
                          <PhoneIcon className="h-4 w-4 text-gray-500" />
                          {contract.client.phone}
                        </p>
                      </div>
                    )}
                    {contract?.client?.address && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Address</label>
                        <p className="mt-1 flex items-start gap-2 text-sm text-gray-700">
                          <MapPinIcon className="mt-0.5 h-4 w-4 text-gray-500" />
                          {contract.client.address}
                        </p>
                      </div>
                    )}

                    <div className="border-t pt-4">
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <Link href={`/manage-parties`}>View Details</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Promoter Card */}
              <Card className="shadow-lg transition-shadow hover:shadow-xl">
                <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-purple-100">
                  <CardTitle className="flex items-center gap-2 text-purple-900">
                    <UserIcon className="h-5 w-5" />
                    Promoter
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {contract?.promoters && contract.promoters.length > 0 ? (
                      <>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Name (English)
                          </label>
                          <p className="mt-1 font-semibold text-gray-900">
                            {contract.promoters[0].name_en}
                          </p>
                        </div>
                        {contract.promoters[0].name_ar && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">
                              Name (Arabic)
                            </label>
                            <p className="mt-1 font-semibold text-gray-900" dir="rtl">
                              {contract.promoters[0].name_ar}
                            </p>
                          </div>
                        )}
                        {contract.promoters[0].id_card_number && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">
                              ID Card Number
                            </label>
                            <p className="mt-1 font-mono text-sm text-gray-700">
                              {contract.promoters[0].id_card_number}
                            </p>
                          </div>
                        )}
                        {contract.promoters[0].email && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Email</label>
                            <p className="mt-1 flex items-center gap-2 text-sm text-gray-700">
                              <MailIcon className="h-4 w-4 text-gray-500" />
                              {contract.promoters[0].email}
                            </p>
                          </div>
                        )}
                        {contract.promoters[0].phone && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Phone</label>
                            <p className="mt-1 flex items-center gap-2 text-sm text-gray-700">
                              <PhoneIcon className="h-4 w-4 text-gray-500" />
                              {contract.promoters[0].phone}
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="py-8 text-center">
                        <UserIcon className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                        <p className="font-medium text-gray-500">No promoter assigned</p>
                        <p className="text-sm text-gray-400">
                          This contract doesn't have an assigned promoter.
                        </p>
                      </div>
                    )}

                    <div className="border-t pt-4">
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <Link href={`/promoters`}>
                          {contract?.promoters && contract.promoters.length > 0
                            ? "View Details"
                            : "Assign Promoter"}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="shadow-lg">
                <CardHeader className="border-b bg-gray-50">
                  <CardTitle className="flex items-center gap-2">
                    <FileTextIcon className="h-5 w-5" />
                    Generated Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {contract?.google_doc_url ? (
                      <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                            <FileTextIcon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Google Document</p>
                            <p className="text-sm text-gray-600">Editable contract document</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button asChild size="sm" variant="outline">
                            <a
                              href={contract.google_doc_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <EyeIcon className="mr-2 h-4 w-4" />
                              View
                            </a>
                          </Button>
                          <Button asChild size="sm" variant="outline">
                            <a
                              href={contract.google_doc_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLinkIcon className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between rounded-lg border bg-gray-50 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200">
                            <FileTextIcon className="h-5 w-5 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-400">Google Document</p>
                            <p className="text-sm text-gray-400">Not yet generated</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" disabled>
                          <EyeIcon className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </div>
                    )}

                    {contract?.pdf_url ? (
                      <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                            <FileTextIcon className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">PDF Document</p>
                            <p className="text-sm text-gray-600">Downloadable contract PDF</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button asChild size="sm" variant="outline">
                            <a href={contract.pdf_url} target="_blank" rel="noopener noreferrer">
                              <EyeIcon className="mr-2 h-4 w-4" />
                              View
                            </a>
                          </Button>
                          <Button asChild size="sm">
                            <a href={contract.pdf_url} download>
                              <DownloadIcon className="mr-2 h-4 w-4" />
                              Download
                            </a>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between rounded-lg border bg-gray-50 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200">
                            <FileTextIcon className="h-5 w-5 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-400">PDF Document</p>
                            <p className="text-sm text-gray-400">Not yet generated</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" disabled>
                          <DownloadIcon className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    )}

                    {!contract?.google_doc_url && !contract?.pdf_url && (
                      <div className="py-12 text-center">
                        <FileTextIcon className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                        <h3 className="mb-2 text-lg font-medium text-gray-900">
                          No Documents Generated
                        </h3>
                        <p className="mb-6 text-gray-500">
                          Generate documents to get started with this contract.
                        </p>
                        <Button>
                          <FileTextIcon className="mr-2 h-4 w-4" />
                          Generate Documents
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader className="border-b bg-gray-50">
                  <CardTitle className="flex items-center gap-2">
                    <MoreHorizontalIcon className="h-5 w-5" />
                    Document Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <Button className="w-full justify-start gap-2" variant="outline">
                      <FileTextIcon className="h-4 w-4" />
                      Generate New Version
                    </Button>
                    <Button className="w-full justify-start gap-2" variant="outline">
                      <SendIcon className="h-4 w-4" />
                      Send via Email
                    </Button>
                    <Button className="w-full justify-start gap-2" variant="outline">
                      <ShareIcon className="h-4 w-4" />
                      Share Link
                    </Button>
                    <Button className="w-full justify-start gap-2" variant="outline">
                      <PrinterIcon className="h-4 w-4" />
                      Print Document
                    </Button>

                    <Separator className="my-4" />

                    <Button className="w-full justify-start gap-2" variant="outline">
                      <DownloadIcon className="h-4 w-4" />
                      Download All
                    </Button>
                    <Button className="w-full justify-start gap-2" variant="outline">
                      <CopyIcon className="h-4 w-4" />
                      Duplicate Contract
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader className="border-b bg-gray-50">
                <CardTitle className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5" />
                  Contract Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="relative">
                  <div className="absolute bottom-0 left-6 top-0 w-0.5 bg-gray-200"></div>

                  <div className="space-y-8">
                    <div className="relative flex items-start gap-6">
                      <div className="relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 shadow-lg">
                        <FileTextIcon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 rounded-lg border bg-white p-4 shadow-sm">
                        <h4 className="font-semibold text-gray-900">Contract Created</h4>
                        <p className="mt-1 text-sm text-gray-600">
                          Initial contract generation and setup
                        </p>
                        <p className="mt-2 text-xs text-gray-500">
                          {contract?.created_at
                            ? new Date(contract.created_at).toLocaleString()
                            : "Date not available"}
                        </p>
                      </div>
                    </div>

                    {contract?.contract_start_date && (
                      <div className="relative flex items-start gap-6">
                        <div className="relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-500 shadow-lg">
                          <CalendarIcon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 rounded-lg border bg-white p-4 shadow-sm">
                          <h4 className="font-semibold text-gray-900">Contract Start Date</h4>
                          <p className="mt-1 text-sm text-gray-600">
                            Contract becomes effective and active
                          </p>
                          <p className="mt-2 text-xs text-gray-500">
                            {new Date(contract.contract_start_date).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}

                    {contract?.google_doc_url && (
                      <div className="relative flex items-start gap-6">
                        <div className="relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-purple-500 shadow-lg">
                          <FileTextIcon className="h-6 w-6 text-white" />
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

                    {contract?.contract_end_date && (
                      <div className="relative flex items-start gap-6">
                        <div className="relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-orange-500 shadow-lg">
                          <CalendarIcon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 rounded-lg border bg-white p-4 shadow-sm">
                          <h4 className="font-semibold text-gray-900">Contract End Date</h4>
                          <p className="mt-1 text-sm text-gray-600">
                            Contract expiration and completion
                          </p>
                          <p className="mt-2 text-xs text-gray-500">
                            {new Date(contract.contract_end_date).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="relative flex items-start gap-6">
                      <div className="relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-400 shadow-lg">
                        <ClockIcon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 rounded-lg border bg-white p-4 shadow-sm">
                        <h4 className="font-semibold text-gray-900">Last Updated</h4>
                        <p className="mt-1 text-sm text-gray-600">
                          Most recent modification to the contract
                        </p>
                        <p className="mt-2 text-xs text-gray-500">
                          {contract?.updated_at
                            ? new Date(contract.updated_at).toLocaleString()
                            : "No updates recorded"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader className="border-b bg-gray-50">
                <CardTitle className="flex items-center gap-2">
                  <HistoryIcon className="h-5 w-5" />
                  Activity History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {activityLogs.map((log, index) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-4 rounded-lg border bg-gray-50 p-4"
                    >
                      <div className="flex-shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                          {log.action === "created" && (
                            <FileTextIcon className="h-5 w-5 text-blue-600" />
                          )}
                          {log.action === "generated" && (
                            <CheckCircleIcon className="h-5 w-5 text-green-600" />
                          )}
                          {log.action === "reviewed" && (
                            <EyeIcon className="h-5 w-5 text-purple-600" />
                          )}
                          {log.action === "sent" && (
                            <SendIcon className="h-5 w-5 text-orange-600" />
                          )}
                          {log.action === "downloaded" && (
                            <DownloadIcon className="h-5 w-5 text-gray-600" />
                          )}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold capitalize text-gray-900">{log.action}</p>
                        <p className="mt-1 text-sm text-gray-600">{log.description}</p>
                        <p className="mt-2 text-xs text-gray-500">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Actions Tab */}
          <TabsContent value="actions" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="shadow-lg">
                <CardHeader className="border-b bg-blue-50">
                  <CardTitle className="text-blue-900">Document Actions</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {contract?.google_doc_url && (
                      <Button asChild className="w-full justify-start gap-2">
                        <a href={contract.google_doc_url} target="_blank" rel="noopener noreferrer">
                          <EyeIcon className="h-4 w-4" />
                          View Document
                        </a>
                      </Button>
                    )}
                    {contract?.pdf_url && (
                      <Button asChild className="w-full justify-start gap-2" variant="outline">
                        <a href={contract.pdf_url} download>
                          <DownloadIcon className="h-4 w-4" />
                          Download PDF
                        </a>
                      </Button>
                    )}
                    <Button className="w-full justify-start gap-2" variant="outline">
                      <PrinterIcon className="h-4 w-4" />
                      Print Document
                    </Button>
                    <Button className="w-full justify-start gap-2" variant="outline">
                      <FileTextIcon className="h-4 w-4" />
                      Regenerate
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader className="border-b bg-green-50">
                  <CardTitle className="text-green-900">Communication</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <Button className="w-full justify-start gap-2">
                      <SendIcon className="h-4 w-4" />
                      Send via Email
                    </Button>
                    <Button className="w-full justify-start gap-2" variant="outline">
                      <ShareIcon className="h-4 w-4" />
                      Share Link
                    </Button>
                    <Button className="w-full justify-start gap-2" variant="outline">
                      <MailIcon className="h-4 w-4" />
                      Send Reminder
                    </Button>
                    <Button className="w-full justify-start gap-2" variant="outline">
                      <MoreHorizontalIcon className="h-4 w-4" />
                      More Options
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader className="border-b bg-purple-50">
                  <CardTitle className="text-purple-900">Management</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <Button asChild className="w-full justify-start gap-2">
                      <Link href={`/edit-contract/${contractId}`}>
                        <EditIcon className="h-4 w-4" />
                        Edit Contract
                      </Link>
                    </Button>
                    <Button className="w-full justify-start gap-2" variant="outline">
                      <CopyIcon className="h-4 w-4" />
                      Duplicate Contract
                    </Button>
                    <Button className="w-full justify-start gap-2" variant="outline">
                      <HistoryIcon className="h-4 w-4" />
                      View History
                    </Button>

                    <Separator className="my-3" />

                    <Button className="w-full justify-start gap-2" variant="destructive">
                      <AlertCircleIcon className="h-4 w-4" />
                      Cancel Contract
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
