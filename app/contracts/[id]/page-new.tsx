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
  MoreHorizontalIcon
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
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  if (!params) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-4xl">Loading...</div>
      </div>
    )
  }
  const contractId = params.id as string

  const getStatusColor = (status?: string | null) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const mockActivityLogs: ActivityLog[] = [
    {
      id: '1',
      action: 'created',
      description: 'Contract was created',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: '2',
      action: 'generated',
      description: 'PDF document was generated',
      created_at: new Date(Date.now() - 86400000 * 1).toISOString()
    },
    {
      id: '3',
      action: 'viewed',
      description: 'Contract was viewed',
      created_at: new Date(Date.now() - 3600000 * 6).toISOString()
    },
    {
      id: '4',
      action: 'downloaded',
      description: 'Contract PDF was downloaded',
      created_at: new Date(Date.now() - 3600000 * 2).toISOString()
    }
  ]

  useEffect(() => {
    async function fetchContract() {
      try {
        setLoading(true)
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

        console.log("Basic contract data:", basicData)

        let enhancedData: ContractDetail = { ...basicData }
        
        if (basicData.employer_id) {
          const { data: employerData } = await supabase
            .from("parties")
            .select("id, name_en, name_ar, crn")
            .eq("id", basicData.employer_id)
            .single<Party>()
          
          if (employerData) {
            enhancedData.employer = employerData
          }
        }
        
        if (basicData.client_id) {
          const { data: clientData } = await supabase
            .from("parties")
            .select("id, name_en, name_ar, crn")
            .eq("id", basicData.client_id)
            .single<Party>()
          
          if (clientData) {
            enhancedData.client = clientData
          }
        }
        
        if (basicData.promoter_id) {
          const { data: promoterData } = await supabase
            .from("promoters")
            .select("id, name_en, name_ar, id_card_number")
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading contract details...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Error Loading Contract</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-500 mb-4">{error}</p>
              <Button asChild variant="outline">
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
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/contracts">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Contracts
            </Link>
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Contract Details</h1>
              <p className="text-gray-600 mt-1">Contract ID: {contractId}</p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Badge className={getStatusColor(contract?.status)}>
                {contract?.status || 'Unknown'}
              </Badge>
              
              <div className="flex items-center gap-2">
                {contract?.google_doc_url && (
                  <Button asChild size="sm" variant="outline">
                    <a href={contract.google_doc_url} target="_blank" rel="noopener noreferrer">
                      <EyeIcon className="mr-2 h-4 w-4" />
                      View
                    </a>
                  </Button>
                )}
                
                <Button asChild size="sm" variant="outline">
                  <Link href={`/edit-contract/${contractId}`}>
                    <EditIcon className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </Button>
                
                {contract?.pdf_url && (
                  <Button asChild size="sm" variant="outline">
                    <a href={contract.pdf_url} download>
                      <DownloadIcon className="mr-2 h-4 w-4" />
                      Download
                    </a>
                  </Button>
                )}
                
                <Button size="sm" variant="outline">
                  <SendIcon className="mr-2 h-4 w-4" />
                  Send
                </Button>
                
                <Button size="sm" variant="outline">
                  <PrinterIcon className="mr-2 h-4 w-4" />
                  Print
                </Button>
                
                <Button size="sm" variant="outline">
                  <ShareIcon className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="parties">Parties</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Contract Status Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Contract Status</CardTitle>
                  <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{contract?.status || 'Unknown'}</div>
                  <p className="text-xs text-muted-foreground">
                    Created: {contract?.created_at ? new Date(contract.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </CardContent>
              </Card>

              {/* Duration Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Contract Duration</CardTitle>
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {contract?.contract_start_date && contract?.contract_end_date 
                      ? Math.ceil((new Date(contract.contract_end_date).getTime() - new Date(contract.contract_start_date).getTime()) / (1000 * 60 * 60 * 24))
                      : 'N/A'
                    } days
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {contract?.contract_start_date ? new Date(contract.contract_start_date).toLocaleDateString() : 'N/A'} - {contract?.contract_end_date ? new Date(contract.contract_end_date).toLocaleDateString() : 'N/A'}
                  </p>
                </CardContent>
              </Card>

              {/* Generation Status Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Generation Status</CardTitle>
                  <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {contract?.google_doc_url || contract?.pdf_url ? 'Generated' : 'Pending'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {contract?.google_doc_url ? 'Google Doc Available' : 'Not Generated'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Contract Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileTextIcon className="h-5 w-5" />
                    Contract Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Contract Number</label>
                      <p className="font-medium">{contract?.contract_number || "Not assigned"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Job Title</label>
                      <p className="font-medium">{contract?.job_title || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Work Location</label>
                      <p className="font-medium">{contract?.work_location || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="font-medium">{contract?.email || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Start Date</label>
                      <p className="font-medium">
                        {contract?.contract_start_date ? new Date(contract.contract_start_date).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">End Date</label>
                      <p className="font-medium">
                        {contract?.contract_end_date ? new Date(contract.contract_end_date).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircleIcon className="h-5 w-5" />
                    System Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Contract ID</label>
                      <p className="font-mono text-sm bg-gray-100 p-2 rounded">{contract?.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Employer ID</label>
                      <p className="font-mono text-sm">{contract?.employer_id || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Client ID</label>
                      <p className="font-mono text-sm">{contract?.client_id || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Promoter ID</label>
                      <p className="font-mono text-sm">{contract?.promoter_id || "N/A"}</p>
                    </div>
                    {contract?.error_details && (
                      <div>
                        <label className="text-sm font-medium text-red-500">Error Details</label>
                        <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{contract.error_details}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Parties Tab */}
          <TabsContent value="parties" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Employer Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BuildingIcon className="h-5 w-5" />
                    Employer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name (English)</label>
                    <p className="font-medium">{contract?.employer?.name_en || contract?.first_party_name_en || "N/A"}</p>
                  </div>
                  {(contract?.employer?.name_ar || contract?.first_party_name_ar) && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name (Arabic)</label>
                      <p className="font-medium" dir="rtl">{contract?.employer?.name_ar || contract?.first_party_name_ar}</p>
                    </div>
                  )}
                  {contract?.employer?.crn && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">CRN</label>
                      <p className="font-mono text-sm">{contract.employer.crn}</p>
                    </div>
                  )}
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href={`/manage-parties`}>
                      View Details
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Client Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BuildingIcon className="h-5 w-5" />
                    Client
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name (English)</label>
                    <p className="font-medium">{contract?.client?.name_en || contract?.second_party_name_en || "N/A"}</p>
                  </div>
                  {(contract?.client?.name_ar || contract?.second_party_name_ar) && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name (Arabic)</label>
                      <p className="font-medium" dir="rtl">{contract?.client?.name_ar || contract?.second_party_name_ar}</p>
                    </div>
                  )}
                  {contract?.client?.crn && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">CRN</label>
                      <p className="font-mono text-sm">{contract.client.crn}</p>
                    </div>
                  )}
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href={`/manage-parties`}>
                      View Details
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Promoter Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5" />
                    Promoter
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {contract?.promoters && contract.promoters.length > 0 ? (
                    <>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Name (English)</label>
                        <p className="font-medium">{contract.promoters[0].name_en || "N/A"}</p>
                      </div>
                      {contract.promoters[0].name_ar && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Name (Arabic)</label>
                          <p className="font-medium" dir="rtl">{contract.promoters[0].name_ar}</p>
                        </div>
                      )}
                      {contract.promoters[0].id_card_number && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">ID Card Number</label>
                          <p className="font-mono text-sm">{contract.promoters[0].id_card_number}</p>
                        </div>
                      )}
                    </>
                  ) : contract?.promoter_name_en ? (
                    <>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Name (English)</label>
                        <p className="font-medium">{contract.promoter_name_en}</p>
                      </div>
                      {contract.promoter_name_ar && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Name (Arabic)</label>
                          <p className="font-medium" dir="rtl">{contract.promoter_name_ar}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-500">No promoter assigned</p>
                  )}
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href={`/promoters`}>
                      View Details
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Generated Documents</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contract?.google_doc_url && (
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileTextIcon className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="font-medium">Google Document</p>
                          <p className="text-sm text-gray-500">Original contract document</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button asChild size="sm" variant="outline">
                          <a href={contract.google_doc_url} target="_blank" rel="noopener noreferrer">
                            <EyeIcon className="mr-2 h-4 w-4" />
                            View
                          </a>
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {contract?.pdf_url && (
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileTextIcon className="h-8 w-8 text-red-600" />
                        <div>
                          <p className="font-medium">PDF Document</p>
                          <p className="text-sm text-gray-500">Downloadable PDF version</p>
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
                  )}

                  {!contract?.google_doc_url && !contract?.pdf_url && (
                    <div className="text-center py-8">
                      <FileTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No documents generated yet</p>
                      <Button className="mt-4">
                        Generate Document
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Document Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <SendIcon className="mr-2 h-4 w-4" />
                    Send via Email
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <PrinterIcon className="mr-2 h-4 w-4" />
                    Print Document
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <ShareIcon className="mr-2 h-4 w-4" />
                    Share Link
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <DownloadIcon className="mr-2 h-4 w-4" />
                    Download All
                  </Button>
                  <Separator />
                  <Button className="w-full justify-start" variant="outline">
                    Regenerate Document
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    Create New Version
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HistoryIcon className="h-5 w-5" />
                  Activity History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activityLogs.map((log, index) => (
                    <div key={log.id} className="flex items-start gap-4 pb-4 border-b last:border-b-0">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          {log.action === 'created' && <FileTextIcon className="h-4 w-4 text-blue-600" />}
                          {log.action === 'generated' && <CheckCircleIcon className="h-4 w-4 text-green-600" />}
                          {log.action === 'viewed' && <EyeIcon className="h-4 w-4 text-gray-600" />}
                          {log.action === 'downloaded' && <DownloadIcon className="h-4 w-4 text-purple-600" />}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium capitalize">{log.action}</p>
                        <p className="text-sm text-gray-600">{log.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5" />
                  Contract Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  
                  <div className="space-y-6">
                    <div className="relative flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center relative z-10">
                        <FileTextIcon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">Contract Created</p>
                        <p className="text-sm text-gray-600">Initial contract generation</p>
                        <p className="text-xs text-gray-500">
                          {contract?.created_at ? new Date(contract.created_at).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="relative flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center relative z-10">
                        <CalendarIcon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">Contract Start Date</p>
                        <p className="text-sm text-gray-600">Contract becomes effective</p>
                        <p className="text-xs text-gray-500">
                          {contract?.contract_start_date ? new Date(contract.contract_start_date).toLocaleString() : 'Not set'}
                        </p>
                      </div>
                    </div>

                    <div className="relative flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center relative z-10">
                        <CalendarIcon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">Contract End Date</p>
                        <p className="text-sm text-gray-600">Contract expiration</p>
                        <p className="text-xs text-gray-500">
                          {contract?.contract_end_date ? new Date(contract.contract_end_date).toLocaleString() : 'Not set'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Actions Tab */}
          <TabsContent value="actions" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Document Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start">
                    <EyeIcon className="mr-2 h-4 w-4" />
                    View Document
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <DownloadIcon className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <PrinterIcon className="mr-2 h-4 w-4" />
                    Print Document
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Communication</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start">
                    <SendIcon className="mr-2 h-4 w-4" />
                    Send via Email
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <ShareIcon className="mr-2 h-4 w-4" />
                    Share Link
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <MoreHorizontalIcon className="mr-2 h-4 w-4" />
                    More Options
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contract Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild className="w-full justify-start">
                    <Link href={`/edit-contract/${contractId}`}>
                      <EditIcon className="mr-2 h-4 w-4" />
                      Edit Contract
                    </Link>
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    Duplicate Contract
                  </Button>
                  <Button className="w-full justify-start" variant="destructive">
                    Cancel Contract
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
