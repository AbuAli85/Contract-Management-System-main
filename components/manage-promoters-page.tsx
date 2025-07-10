"use client"
import { useEffect, useState } from "react"
import type React from "react"

import PromoterForm from "@/components/promoter-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import type { Promoter } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  EditIcon,
  PlusCircleIcon,
  ArrowLeftIcon,
  UserIcon,
  FileTextIcon,
  Loader2,
  AlertTriangleIcon,
  ShieldCheckIcon,
  ShieldAlertIcon,
  BriefcaseIcon,
  EyeIcon,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format, parseISO, differenceInDays, isPast } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Helper function to determine document status
const getDocumentStatus = (
  expiryDate: string | null | undefined,
): {
  text: string
  Icon: React.ElementType
  colorClass: string
  tooltip?: string
} => {
  if (!expiryDate) {
    return {
      text: "No Date",
      Icon: AlertTriangleIcon,
      colorClass: "text-slate-500",
      tooltip: "Expiry date not set",
    }
  }
  const date = parseISO(expiryDate)
  const today = new Date()
  const daysUntilExpiry = differenceInDays(date, today)

  if (isPast(date)) {
    return {
      text: "Expired",
      Icon: ShieldAlertIcon,
      colorClass: "text-red-500",
      tooltip: `Expired on ${format(date, "MMM d, yyyy")}`,
    }
  }
  if (daysUntilExpiry <= 30) {
    return {
      text: "Expires Soon",
      Icon: ShieldAlertIcon,
      colorClass: "text-orange-500",
      tooltip: `Expires in ${daysUntilExpiry} day(s) on ${format(date, "MMM d, yyyy")}`,
    }
  }
  return {
    text: "Valid",
    Icon: ShieldCheckIcon,
    colorClass: "text-green-500",
    tooltip: `Valid until ${format(date, "MMM d, yyyy")}`,
  }
}

export default function ManagePromotersPage() {
  const [promoters, setPromoters] = useState<Promoter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPromoter, setSelectedPromoter] = useState<Promoter | null>(null)
  const [showForm, setShowForm] = useState(false)
  const { toast } = useToast()

  async function fetchPromotersWithContractCount() {
    setIsLoading(true)
    const { data: promotersData, error: promotersError } = await supabase
      .from("promoters")
      .select("*")
      .order("name_en")

    if (promotersError) {
      toast({
        title: "Error fetching promoters",
        description: promotersError.message,
        variant: "destructive",
      })
      setPromoters([])
      setIsLoading(false)
      return
    }

    if (!promotersData || promotersData.length === 0) {
      setPromoters([])
      setIsLoading(false)
      return
    }

    // Fetch active contract counts for each promoter
    const promoterIds = promotersData.map((p) => p.id)
    const { data: contractsData, error: contractsError } = await supabase
      .from("contracts")
      .select("promoter_id, contract_end_date")
      .in("promoter_id", promoterIds)

    if (contractsError) {
      toast({
        title: "Error fetching contract data",
        description: contractsError.message,
        variant: "destructive",
      })
      // Continue with promoters data but without contract counts
    }

    const todayStr = format(new Date(), "yyyy-MM-dd")

    const promotersWithCounts = promotersData
      .filter((promoter) => promoter.id) // Filter out promoters without IDs
      .map((promoter) => {
        const activeContracts = contractsData
          ? contractsData.filter(
              (c) =>
                c.promoter_id === promoter.id &&
                c.contract_end_date &&
                c.contract_end_date >= todayStr,
            ).length
          : 0
        return { ...promoter, active_contracts_count: activeContracts }
      })

    // Debug: Log any promoters without IDs
    const promotersWithoutIds = promotersData.filter((promoter) => !promoter.id)
    if (promotersWithoutIds.length > 0) {
      console.warn("Found promoters without IDs:", promotersWithoutIds)
    }

    setPromoters(promotersWithCounts)
    setIsLoading(false)
  }

  useEffect(() => {
    fetchPromotersWithContractCount()
    const promotersChannel = supabase
      .channel("public:promoters:manage")
      .on("postgres_changes", { event: "*", schema: "public", table: "promoters" }, () =>
        fetchPromotersWithContractCount(),
      )
      .subscribe()

    const contractsChannel = supabase
      .channel("public:contracts:manage")
      .on("postgres_changes", { event: "*", schema: "public", table: "contracts" }, () =>
        fetchPromotersWithContractCount(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(promotersChannel)
      supabase.removeChannel(contractsChannel)
    }
  }, [])

  const handleEdit = (promoter: Promoter) => {
    setSelectedPromoter(promoter)
    setShowForm(true)
  }

  const handleAddNew = () => {
    setSelectedPromoter(null)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setSelectedPromoter(null)
    fetchPromotersWithContractCount() // Refresh the list
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-lg text-slate-700 dark:text-slate-300">Loading promoters...</p>
      </div>
    )
  }

  if (showForm) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950 sm:py-12">
        <div className="mx-auto max-w-3xl">
          <Button variant="outline" onClick={handleFormClose} className="mb-6">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Promoter List
          </Button>
          <PromoterForm promoterToEdit={selectedPromoter} onFormSubmit={handleFormClose} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950 sm:py-12">
      <div className="mx-auto max-w-screen-lg">
        <div className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            Manage Promoters
          </h1>
          <div className="flex gap-2">
            <Link href="/" passHref>
              <Button variant="outline">
                <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back to Home
              </Button>
            </Link>
            <Button
              onClick={handleAddNew}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <PlusCircleIcon className="mr-2 h-5 w-5" />
              Add New Promoter
            </Button>
          </div>
        </div>

        {promoters.length === 0 ? (
          <Card className="bg-card py-12 text-center shadow-md">
            <CardHeader>
              <UserIcon className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
              <CardTitle className="text-2xl">No Promoters Found</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-lg">
                Get started by adding your first promoter. Click the "Add New Promoter" button
                above.
              </CardDescription>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card shadow-lg">
            <CardHeader className="border-b">
              <CardTitle className="text-xl">Promoter Directory</CardTitle>
              <CardDescription>
                View, add, or edit promoter details, documents, and contract status.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-100 dark:bg-slate-800">
                    <TableRow>
                      <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">
                        Promoter
                      </TableHead>
                      <TableHead className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                        ID Card Status
                      </TableHead>
                      <TableHead className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                        Passport Status
                      </TableHead>
                      <TableHead className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                        Active Contracts
                      </TableHead>
                      <TableHead className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y">
                    {promoters.map((promoter) => {
                      const idCardStatus = getDocumentStatus(promoter.id_card_expiry_date)
                      const passportStatus = getDocumentStatus(promoter.passport_expiry_date)
                      return (
                        <TableRow
                          key={promoter.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          <TableCell className="px-4 py-3">
                            <div className="font-medium">{promoter.name_en}</div>
                            <div className="text-sm text-muted-foreground" dir="rtl">
                              {promoter.name_ar}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              ID: {promoter.id_card_number}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-center">
                            <TooltipProvider delayDuration={100}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex flex-col items-center">
                                    <idCardStatus.Icon
                                      className={`h-5 w-5 ${idCardStatus.colorClass}`}
                                    />
                                    <span className={`mt-1 text-xs ${idCardStatus.colorClass}`}>
                                      {idCardStatus.text}
                                    </span>
                                    {promoter.id_card_url && (
                                      <a
                                        href={promoter.id_card_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-0.5"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <FileTextIcon className="h-4 w-4 text-blue-500 hover:text-blue-700" />
                                      </a>
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{idCardStatus.tooltip}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-center">
                            <TooltipProvider delayDuration={100}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex flex-col items-center">
                                    <passportStatus.Icon
                                      className={`h-5 w-5 ${passportStatus.colorClass}`}
                                    />
                                    <span className={`mt-1 text-xs ${passportStatus.colorClass}`}>
                                      {passportStatus.text}
                                    </span>
                                    {promoter.passport_url && (
                                      <a
                                        href={promoter.passport_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-0.5"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <FileTextIcon className="h-4 w-4 text-blue-500 hover:text-blue-700" />
                                      </a>
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{passportStatus.tooltip}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-center">
                            <Badge
                              variant={
                                (promoter.active_contracts_count || 0) > 0 ? "default" : "secondary"
                              }
                              className={
                                (promoter.active_contracts_count || 0) > 0
                                  ? "border-green-300 bg-green-100 text-green-700"
                                  : "border-slate-300 bg-slate-100 text-slate-600"
                              }
                            >
                              <BriefcaseIcon className="mr-1.5 h-3.5 w-3.5" />
                              {promoter.active_contracts_count || 0}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Link
                                href={promoter.id ? `/manage-promoters/${promoter.id}` : "#"}
                                passHref
                                legacyBehavior
                              >
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-xs"
                                  disabled={!promoter.id}
                                >
                                  <EyeIcon className="mr-1 h-3.5 w-3.5" /> View
                                </Button>
                              </Link>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(promoter)}
                                className="text-xs"
                              >
                                <EditIcon className="mr-1 h-3.5 w-3.5" /> Edit
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
