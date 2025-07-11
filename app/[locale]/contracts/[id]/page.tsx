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
  MailIcon,
  MapPinIcon,
  CalendarIcon,
} from "lucide-react"

// Import our refactored components
import { useContract } from "@/hooks/useContract"
import { StatusBadge } from "@/components/StatusBadge"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { ErrorCard } from "@/components/ErrorCard"
import { OverviewTab } from "@/components/contract-tabs/OverviewTab"
import { formatDate, calculateDuration, copyToClipboard, formatDateTime } from "@/utils/format"

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
                <Link href={`/${params?.locale}/contracts`}>
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
              <Link href={`/${params?.locale}/contracts`}>
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
                  <Link href={`/${params?.locale}/edit-contract/${contractId}`}>
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

          {/* Parties Tab - Enhanced with complete party information */}
          <TabsContent value="parties" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* First Party (Employer) */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UsersIcon className="h-5 w-5" />
                    First Party (Employer)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name (English)</label>
                      <p className="mt-1 font-semibold text-gray-900">
                        {contract?.first_party?.name_en || "Not specified"}
                      </p>
                    </div>

                    {contract?.first_party?.name_ar && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Name (Arabic)</label>
                        <p className="mt-1 font-semibold text-gray-900" dir="rtl">
                          {contract.first_party.name_ar}
                        </p>
                      </div>
                    )}

                    {contract?.first_party?.crn && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Commercial Registration Number
                        </label>
                        <p className="mt-1 font-mono text-sm text-gray-700">
                          {contract.first_party.crn}
                        </p>
                      </div>
                    )}

                    {contract?.first_party?.email && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="mt-1 flex items-center gap-2 text-gray-700">
                          <MailIcon className="h-4 w-4 text-gray-500" />
                          {contract.first_party.email}
                        </p>
                      </div>
                    )}

                    {contract?.first_party?.phone && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <p className="mt-1 text-gray-700">{contract.first_party.phone}</p>
                      </div>
                    )}

                    {contract?.first_party?.address && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Address</label>
                        <p className="mt-1 flex items-start gap-2 text-gray-700">
                          <MapPinIcon className="mt-0.5 h-4 w-4 text-gray-500" />
                          {contract.first_party.address}
                        </p>
                      </div>
                    )}
                  </div>

                  {contract?.first_party_id && (
                    <div className="border-t border-gray-200 pt-3">
                      <label className="text-sm font-medium text-gray-500">First Party ID</label>
                      <div className="mt-1 flex items-center gap-2">
                        <code className="flex-1 rounded bg-gray-100 px-2 py-1 font-mono text-xs">
                          {contract.first_party_id}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(contract.first_party_id || "")}
                        >
                          <CopyIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Second Party (Employee) */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UsersIcon className="h-5 w-5" />
                    Second Party (Employee)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name (English)</label>
                      <p className="mt-1 font-semibold text-gray-900">
                        {contract?.second_party?.name_en || "Not specified"}
                      </p>
                    </div>

                    {contract?.second_party?.name_ar && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Name (Arabic)</label>
                        <p className="mt-1 font-semibold text-gray-900" dir="rtl">
                          {contract.second_party.name_ar}
                        </p>
                      </div>
                    )}

                    {contract?.id_card_number && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">ID Card Number</label>
                        <p className="mt-1 font-mono text-sm text-gray-700">
                          {contract.id_card_number}
                        </p>
                      </div>
                    )}

                    {(contract?.email || contract?.second_party?.email) && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="mt-1 flex items-center gap-2 text-gray-700">
                          <MailIcon className="h-4 w-4 text-gray-500" />
                          {contract?.email || contract?.second_party?.email}
                        </p>
                      </div>
                    )}

                    {contract?.second_party?.phone && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <p className="mt-1 text-gray-700">{contract.second_party.phone}</p>
                      </div>
                    )}

                    {contract?.second_party?.address && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Address</label>
                        <p className="mt-1 flex items-start gap-2 text-gray-700">
                          <MapPinIcon className="mt-0.5 h-4 w-4 text-gray-500" />
                          {contract.second_party.address}
                        </p>
                      </div>
                    )}
                  </div>

                  {contract?.second_party_id && (
                    <div className="border-t border-gray-200 pt-3">
                      <label className="text-sm font-medium text-gray-500">Second Party ID</label>
                      <div className="mt-1 flex items-center gap-2">
                        <code className="flex-1 rounded bg-gray-100 px-2 py-1 font-mono text-xs">
                          {contract.second_party_id}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(contract.second_party_id || "")}
                        >
                          <CopyIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Promoters Section */}
            {contract?.promoters && contract.promoters.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UsersIcon className="h-5 w-5" />
                    Contract Promoter
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Name (English)</label>
                        <h4 className="mt-1 font-semibold text-gray-900">
                          {contract.promoters[0].name_en || "Unnamed Promoter"}
                        </h4>
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
                          <label className="text-sm font-medium text-gray-500">ID Number</label>
                          <p className="mt-1 font-mono text-sm text-gray-700">
                            {contract.promoters[0].id_card_number}
                          </p>
                        </div>
                      )}

                      {contract.promoters[0].email && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Email</label>
                          <p className="mt-1 flex items-center gap-2 text-gray-700">
                            <MailIcon className="h-4 w-4 text-gray-500" />
                            {contract.promoters[0].email}
                          </p>
                        </div>
                      )}

                      {contract.promoters[0].phone && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Phone</label>
                          <p className="mt-1 text-gray-700">{contract.promoters[0].phone}</p>
                        </div>
                      )}

                      {contract.promoters[0].status && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Status</label>
                          <div className="mt-1 text-gray-700">
                            <StatusBadge status={contract.promoters[0].status} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {contract?.promoter_id && (
                    <div className="mt-4 border-t border-gray-200 pt-3">
                      <label className="text-sm font-medium text-gray-500">Promoter ID</label>
                      <div className="mt-1 flex items-center gap-2">
                        <code className="flex-1 rounded bg-gray-100 px-2 py-1 font-mono text-xs">
                          {contract.promoter_id}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(contract.promoter_id || "")}
                        >
                          <CopyIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Documents Tab - Enhanced with better document management */}
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
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-blue-100 p-2">
                          <FileTextIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Google Document</h4>
                          <p className="text-sm text-gray-500">Editable contract document</p>
                          <p className="mt-1 break-all text-xs text-gray-400">
                            {contract.google_doc_url}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={contract.google_doc_url} target="_blank">
                            <EyeIcon className="mr-2 h-4 w-4" />
                            View
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(contract.google_doc_url || "")}
                        >
                          <CopyIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {contract?.pdf_url && (
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-red-100 p-2">
                          <DownloadIcon className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">PDF Document</h4>
                          <p className="text-sm text-gray-500">Downloadable PDF version</p>
                          <p className="mt-1 break-all text-xs text-gray-400">{contract.pdf_url}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={contract.pdf_url} target="_blank">
                            <DownloadIcon className="mr-2 h-4 w-4" />
                            Download
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(contract.pdf_url || "")}
                        >
                          <CopyIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {!contract?.google_doc_url && !contract?.pdf_url && (
                    <div className="py-12 text-center text-gray-500">
                      <FileTextIcon className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                      <h3 className="mb-2 text-lg font-medium text-gray-900">
                        No Documents Available
                      </h3>
                      <p className="text-sm">
                        No documents have been uploaded for this contract yet.
                      </p>
                      <div className="mt-6">
                        <Button asChild>
                          <Link href={`/${params?.locale}/edit-contract/${contractId}`}>
                            <EditIcon className="mr-2 h-4 w-4" />
                            Add Documents
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {(contract?.google_doc_url || contract?.pdf_url) && (
                  <div className="mt-6 border-t border-gray-200 pt-6">
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                      <div className="flex items-start gap-3">
                        <FileTextIcon className="mt-0.5 h-5 w-5 text-blue-600" />
                        <div>
                          <h4 className="mb-1 font-medium text-blue-900">Document Management</h4>
                          <p className="text-sm text-blue-700">
                            You can view and download contract documents. To update or add new
                            documents, use the edit contract feature.
                          </p>
                          <div className="mt-3">
                            <Button asChild size="sm" variant="outline" className="bg-white">
                              <Link href={`/${params?.locale}/edit-contract/${contractId}`}>
                                <EditIcon className="mr-2 h-4 w-4" />
                                Edit Documents
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline Tab - Enhanced with comprehensive timeline */}
          <TabsContent value="timeline" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5" />
                  Contract Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute bottom-0 left-6 top-0 w-0.5 bg-gray-200"></div>
                  <div className="space-y-6">
                    {/* Contract Created */}
                    <div className="flex items-start gap-6">
                      <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500">
                        <FileTextIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                          <h4 className="font-semibold text-blue-900">Contract Created</h4>
                          <p className="mt-1 text-sm text-blue-700">
                            Contract was initially created in the system
                          </p>
                          <p className="mt-2 text-xs font-medium text-blue-600">
                            {formatDateTime(contract?.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Contract Start Date */}
                    {contract?.contract_start_date && (
                      <div className="flex items-start gap-6">
                        <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-green-500">
                          <CalendarIcon className="h-5 w-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                            <h4 className="font-semibold text-green-900">Contract Start Date</h4>
                            <p className="mt-1 text-sm text-green-700">Employment period begins</p>
                            <p className="mt-2 text-xs font-medium text-green-600">
                              {formatDate(contract.contract_start_date)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Last Updated */}
                    {contract?.updated_at && contract.updated_at !== contract.created_at && (
                      <div className="flex items-start gap-6">
                        <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500">
                          <EditIcon className="h-5 w-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                            <h4 className="font-semibold text-yellow-900">Last Updated</h4>
                            <p className="mt-1 text-sm text-yellow-700">
                              Contract information was modified
                            </p>
                            <p className="mt-2 text-xs font-medium text-yellow-600">
                              {formatDateTime(contract.updated_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Contract End Date */}
                    {contract?.contract_end_date && (
                      <div className="flex items-start gap-6">
                        <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-red-500">
                          <ClockIcon className="h-5 w-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                            <h4 className="font-semibold text-red-900">Contract End Date</h4>
                            <p className="mt-1 text-sm text-red-700">Employment period ends</p>
                            <p className="mt-2 text-xs font-medium text-red-600">
                              {formatDate(contract.contract_end_date)}
                            </p>
                            {new Date(contract.contract_end_date) > new Date() && (
                              <p className="mt-1 text-xs text-red-500">
                                {Math.ceil(
                                  (new Date(contract.contract_end_date).getTime() -
                                    new Date().getTime()) /
                                    (1000 * 60 * 60 * 24)
                                )}{" "}
                                days remaining
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline Summary */}
                <div className="mt-8 border-t border-gray-200 pt-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-lg bg-gray-50 p-4 text-center">
                      <h5 className="font-medium text-gray-900">Contract Duration</h5>
                      <p className="mt-1 text-sm text-gray-600">
                        {calculateDuration(
                          contract?.contract_start_date,
                          contract?.contract_end_date
                        )}
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-4 text-center">
                      <h5 className="font-medium text-gray-900">Current Status</h5>
                      <div className="mt-1">
                        <StatusBadge status={contract?.status} />
                      </div>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-4 text-center">
                      <h5 className="font-medium text-gray-900">Last Activity</h5>
                      <p className="mt-1 text-sm text-gray-600">
                        {formatDate(contract?.updated_at)}
                      </p>
                    </div>
                  </div>
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
                    <Link href={`/${params?.locale}/edit-contract/${contractId}`}>
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
