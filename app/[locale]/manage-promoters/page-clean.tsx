"use client"
import { useEffect, useState, useRef, useMemo, useCallback } from "react"
import type React from "react"

import PromoterForm from "@/components/promoter-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  EditIcon,
  PlusCircleIcon,
  ArrowLeftIcon,
  UserIcon,
  FileTextIcon,
  Loader2,
  BriefcaseIcon,
  EyeIcon,
  Search,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { getDocumentStatus } from "@/lib/document-status"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function ManagePromotersPage() {
  const [promoters, setPromoters] = useState<Promoter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPromoter, setSelectedPromoter] = useState<Promoter | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const { toast } = useToast()
  const isMountedRef = useRef(true)

  const fetchPromotersWithContractCount = useCallback(async () => {
    if (!isMountedRef.current) return
    setIsLoading(true)
    
    try {
      const { data: promotersData, error: promotersError } = await supabase
        .from("promoters")
        .select("*")
        .order("name_en")

      if (promotersError) {
        console.error("Error fetching promoters:", promotersError)
        toast({
          title: "Error fetching promoters",
          description: promotersError.message,
          variant: "destructive",
        })
        if (isMountedRef.current) {
          setPromoters([])
          setIsLoading(false)
        }
        return
      }

      if (!promotersData || promotersData.length === 0) {
        if (isMountedRef.current) {
          setPromoters([])
          setIsLoading(false)
        }
        return
      }

      // Fetch active contract counts for each promoter
      const promoterIds = promotersData.map((p: Promoter) => p.id)
      const { data: contractsData, error: contractsError } = await supabase
        .from("contracts")
        .select("promoter_id, contract_end_date")
        .in("promoter_id", promoterIds)

      if (contractsError) {
        console.error("Error fetching contract data:", contractsError)
        toast({
          title: "Error fetching contract data",
          description: contractsError.message,
          variant: "destructive",
        })
        // Continue with promoters data but without contract counts
      }

      const todayStr = format(new Date(), "dd-MM-yyyy")

      const promotersWithCounts = promotersData
        .filter((promoter: Promoter) => promoter.id) // Filter out promoters without IDs
        .map((promoter: Promoter) => {
          const activeContracts = contractsData
            ? contractsData.filter(
                (c: any) =>
                  c.promoter_id === promoter.id &&
                  c.contract_end_date &&
                  c.contract_end_date >= todayStr,
              ).length
            : 0
          return { ...promoter, active_contracts_count: activeContracts }
        })

      // Debug: Log any promoters without IDs
      const promotersWithoutIds = promotersData.filter((promoter: Promoter) => !promoter.id)
      if (promotersWithoutIds.length > 0) {
        console.warn("Found promoters without IDs:", promotersWithoutIds)
      }

      if (isMountedRef.current) {
        setPromoters(promotersWithCounts)
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Unexpected error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
      if (isMountedRef.current) {
        setPromoters([])
        setIsLoading(false)
      }
    }
  }, [toast])

  useEffect(() => {
    isMountedRef.current = true
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
      isMountedRef.current = false
      supabase.removeChannel(promotersChannel)
      supabase.removeChannel(contractsChannel)
    }
  }, [fetchPromotersWithContractCount])

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

  // Search and filter logic
  const filteredPromoters = useMemo(() => {
    return promoters.filter((promoter) => {
      const matchesSearchTerm =
        promoter.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promoter.name_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promoter.id_card_number.includes(searchTerm) ||
        (promoter.passport_url || "").includes(searchTerm)

      const matchesStatusFilter =
        filterStatus === "all" ||
        (filterStatus === "active" && (promoter.active_contracts_count || 0) > 0) ||
        (filterStatus === "inactive" && (promoter.active_contracts_count || 0) === 0)

      return matchesSearchTerm && matchesStatusFilter
    })
  }, [promoters, searchTerm, filterStatus])

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
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back to Home
              </Link>
            </Button>
            <Button
              onClick={handleAddNew}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <PlusCircleIcon className="mr-2 h-5 w-5" />
              Add New Promoter
            </Button>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <Label htmlFor="search" className="sr-only">
              Search
            </Label>
            <div className="relative">
              <Input
                id="search"
                placeholder="Search by name, ID, or passport..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              value={filterStatus}
              onValueChange={setFilterStatus}
            >
              <SelectTrigger className="w-full sm:w-auto">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active Contracts</SelectItem>
                <SelectItem value="inactive">No Active Contracts</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredPromoters.length === 0 ? (
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
                    {filteredPromoters.map((promoter) => {
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
                                        title="View ID Card Document"
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
                                        title="View Passport Document"
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
                              <Button 
                                asChild 
                                variant="outline" 
                                size="sm" 
                                className="text-xs"
                                disabled={!promoter.id}
                              >
                                <Link href={promoter.id ? `/manage-promoters/${promoter.id}` : "#"}>
                                  <EyeIcon className="mr-1 h-3.5 w-3.5" /> View
                                </Link>
                              </Button>
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
