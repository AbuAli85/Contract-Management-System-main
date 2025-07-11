"use client"

import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import {
  ArrowLeftIcon,
  DownloadIcon,
  EditIcon,
  EyeIcon,
  SendIcon,
  UsersIcon,
  FileTextIcon,
  ClockIcon,
  HistoryIcon,
  MoreHorizontalIcon,
  CopyIcon,
} from "lucide-react"

// Import our refactored components
import { useContract } from "@/hooks/useContract"
import { StatusBadge } from "@/components/StatusBadge"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { ErrorCard } from "@/components/ErrorCard"
import { OverviewTab } from "@/components/contract-tabs/OverviewTab"
import { formatDate, calculateDuration, copyToClipboard } from "@/utils/format"
import { ContractDetail, Party, Promoter } from "@/lib/types"
import { getContractById } from "@/app/actions/contracts"

export default function ContractDetailPage() {
  const params = useParams()
  const contractId = (params?.id as string) || ""
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
                  <StatusBadge status={contract?.status} />
                </div>

                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="font-medium text-gray-500">Contract ID</label>
                    <div className="mt-1 flex items-center gap-2">
                      <code className="rounded bg-gray-100 px-2 py-1 font-mono text-xs">
                        {contractId}
                      </code>
                      <Button size="sm" variant="ghost" onClick={() => copyToClipboard(contractId)}>
                        <CopyIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="font-medium text-gray-500">Created</label>
                    <p className="mt-1 text-gray-900">{formatDate(contract?.created_at)}</p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-500">Last Updated</label>
                    <p className="mt-1 text-gray-900">{formatDate(contract?.updated_at)}</p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-500">Duration</label>
                    <p className="mt-1 text-gray-900">
                      {calculateDuration(
                        contract?.contract_start_date,
                        contract?.contract_end_date
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="ml-6 flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button variant="outline" size="sm">
                  <EyeIcon className="mr-2 h-4 w-4" />
                  Preview
                </Button>
                <Button asChild size="sm">
                  <Link href={`/edit-contract/${contractId}`}>
                    <EditIcon className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </Button>
                <Button variant="outline" size="sm">
                  <SendIcon className="mr-2 h-4 w-4" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 rounded-lg border border-gray-200 bg-white p-1">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <EyeIcon className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="parties" className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4" />
              Parties
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileTextIcon className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <HistoryIcon className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="actions" className="flex items-center gap-2">
              <MoreHorizontalIcon className="h-4 w-4" />
              Actions
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab - Using our refactored component */}
          <TabsContent value="overview">
            <OverviewTab contract={contract} />
          </TabsContent>

          {/* Parties Tab - Placeholder for future modularization */}
          <TabsContent value="parties" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UsersIcon className="h-5 w-5" />
                  Contract Parties
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg border border-gray-200 p-4">
                    <h4 className="font-semibold text-gray-900">Employee</h4>
                    <p className="text-gray-600">
                      {contract?.promoters?.[0]?.name_en ||
                        contract?.promoter_name_en ||
                        "Not specified"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {contract?.promoters?.[0]?.email || contract?.email || "No email provided"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <h4 className="font-semibold text-gray-900">Employer</h4>
                    <p className="text-gray-600">
                      {contract?.employer?.name_en ||
                        contract?.first_party_name_en ||
                        "Not specified"}
                    </p>
                    <p className="text-sm text-gray-500">Company representative</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Promoters</p>
                      <p className="text-sm text-gray-900">
                        {contract.promoters?.map((p: Promoter) => p.name_en).join(", ")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Parties</p>
                      <p className="text-sm text-gray-900">
                        {contract.parties?.map((p: Party) => p.name_en).join(", ")}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab - Placeholder for future modularization */}
          <TabsContent value="documents" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileTextIcon className="h-5 w-5" />
                  Contract Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contract?.google_doc_url && (
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">Google Document</h4>
                        <p className="text-sm text-gray-500">Original contract document</p>
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link href={contract.google_doc_url} target="_blank">
                          <EyeIcon className="mr-2 h-4 w-4" />
                          View
                        </Link>
                      </Button>
                    </div>
                  )}
                  {contract?.pdf_url && (
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">PDF Document</h4>
                        <p className="text-sm text-gray-500">Downloadable PDF version</p>
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link href={contract.pdf_url} target="_blank">
                          <DownloadIcon className="mr-2 h-4 w-4" />
                          Download
                        </Link>
                      </Button>
                    </div>
                  )}
                  {!contract?.google_doc_url && !contract?.pdf_url && (
                    <div className="py-8 text-center text-gray-500">
                      <FileTextIcon className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                      <p>No documents available for this contract</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline Tab - Placeholder for future modularization */}
          <TabsContent value="timeline" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5" />
                  Contract Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-2 h-3 w-3 rounded-full bg-blue-500"></div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Contract Created</h4>
                      <p className="text-sm text-gray-500">{formatDate(contract?.created_at)}</p>
                    </div>
                  </div>
                  {contract?.contract_start_date && (
                    <div className="flex items-start gap-4">
                      <div className="mt-2 h-3 w-3 rounded-full bg-green-500"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Contract Start Date</h4>
                        <p className="text-sm text-gray-500">
                          {formatDate(contract.contract_start_date)}
                        </p>
                      </div>
                    </div>
                  )}
                  {contract?.contract_end_date && (
                    <div className="flex items-start gap-4">
                      <div className="mt-2 h-3 w-3 rounded-full bg-red-500"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Contract End Date</h4>
                        <p className="text-sm text-gray-500">
                          {formatDate(contract.contract_end_date)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab - Placeholder for future modularization */}
          <TabsContent value="history" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HistoryIcon className="h-5 w-5" />
                  Contract History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="py-8 text-center text-gray-500">
                  <HistoryIcon className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                  <p>No history data available</p>
                  <p className="text-sm">History tracking will be implemented in future updates</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Actions Tab - Placeholder for future modularization */}
          <TabsContent value="actions" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MoreHorizontalIcon className="h-5 w-5" />
                  Contract Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Button asChild>
                    <Link href={`/edit-contract/${contractId}`}>
                      <EditIcon className="mr-2 h-4 w-4" />
                      Edit Contract
                    </Link>
                  </Button>
                  <Button variant="outline">
                    <SendIcon className="mr-2 h-4 w-4" />
                    Send for Review
                  </Button>
                  <Button variant="outline">
                    <DownloadIcon className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                  <Button variant="outline">
                    <EyeIcon className="mr-2 h-4 w-4" />
                    Preview Contract
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
