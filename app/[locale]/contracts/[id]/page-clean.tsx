"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { 
  ArrowLeftIcon, 
  DownloadIcon, 
  EditIcon, 
  EyeIcon, 
  SendIcon,
  CopyIcon,
  FileTextIcon
} from "lucide-react"

// Import our refactored components
import { useContract } from "@/hooks/useContract"
import { StatusBadge } from "@/components/StatusBadge"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { ErrorCard } from "@/components/ErrorCard"
import { OverviewTab } from "@/components/contract-tabs/OverviewTab"
import { formatDate, calculateDuration, copyToClipboard } from "@/utils/format"

export default function ContractDetailPage() {
  const params = useParams()
  const contractId = (params?.id as string) || ''
  const { contract, loading, error, refetch } = useContract(contractId)

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return <ErrorCard message={error} onRetry={refetch} />
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <Card className="shadow-lg">
            <CardContent className="p-12 text-center">
              <FileTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Contract Not Found</h3>
              <p className="text-gray-600 mb-6">The contract you're looking for doesn't exist or has been removed.</p>
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
      <div className="mx-auto max-w-8xl px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
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
              <span className="text-gray-900 font-medium">Contract Details</span>
            </nav>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <h1 className="text-3xl font-bold text-gray-900">Contract Details</h1>
                  <StatusBadge status={contract?.status} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <label className="font-medium text-gray-500">Contract ID</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">{contractId}</code>
                      <Button size="sm" variant="ghost" onClick={() => copyToClipboard(contractId)}>
                        <CopyIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="font-medium text-gray-500">Created</label>
                    <p className="mt-1">{formatDate(contract.created_at)}</p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-500">Duration</label>
                    <p className="mt-1">{calculateDuration(contract.contract_start_date, contract.contract_end_date)}</p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-500">Type</label>
                    <p className="mt-1">{contract.contract_type || 'Standard'}</p>
                  </div>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="flex items-center gap-2 ml-8">
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            <TabsList className="grid w-full grid-cols-6 bg-transparent">
              <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Overview</TabsTrigger>
              <TabsTrigger value="parties" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Parties</TabsTrigger>
              <TabsTrigger value="documents" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Documents</TabsTrigger>
              <TabsTrigger value="timeline" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Timeline</TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">History</TabsTrigger>
              <TabsTrigger value="actions" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Actions</TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <OverviewTab contract={contract} />
          </TabsContent>

          {/* Placeholder tabs - to be refactored next */}
          <TabsContent value="parties" className="space-y-6">
            <div className="text-center py-12">
              <p className="text-gray-500">Parties tab - Coming soon...</p>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <div className="text-center py-12">
              <p className="text-gray-500">Documents tab - Coming soon...</p>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <div className="text-center py-12">
              <p className="text-gray-500">Timeline tab - Coming soon...</p>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <div className="text-center py-12">
              <p className="text-gray-500">History tab - Coming soon...</p>
            </div>
          </TabsContent>

          <TabsContent value="actions" className="space-y-6">
            <div className="text-center py-12">
              <p className="text-gray-500">Actions tab - Coming soon...</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
