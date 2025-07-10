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
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  Filter,
  MoreHorizontal,
  Download,
  Trash2,
  Settings,
  RefreshCw,
  Grid3x3,
  List,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  Activity,
  Star,
  Mail,
  MessageSquare,
  TrendingUp,
  Clock,
  ArrowUpDown,
  ChevronUp,
  ChevronDown
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format, parseISO, differenceInDays } from "date-fns"
import { getDocumentStatus } from "@/lib/document-status"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { SafeImage } from "@/components/ui/safe-image"
import { cn } from "@/lib/utils"

// Enhanced Promoter interface
interface EnhancedPromoter extends Promoter {
  id_card_status: "valid" | "expiring" | "expired" | "missing"
  passport_status: "valid" | "expiring" | "expired" | "missing"
  overall_status: "active" | "warning" | "critical" | "inactive"
  days_until_id_expiry?: number
  days_until_passport_expiry?: number
}

// Statistics interface
interface PromoterStats {
  total: number
  active: number
  expiring_documents: number
  expired_documents: number
  total_contracts: number
}

export default function ManagePromotersPage() {
  const [promoters, setPromoters] = useState<Promoter[]>([])
  const [filteredPromoters, setFilteredPromoters] = useState<EnhancedPromoter[]>([])
  const [selectedPromoters, setSelectedPromoters] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPromoter, setSelectedPromoter] = useState<Promoter | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [currentView, setCurrentView] = useState<"table" | "grid">("table")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [documentFilter, setDocumentFilter] = useState("all")
  const [sortBy, setSortBy] = useState<"name" | "id_expiry" | "passport_expiry" | "contracts">("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showStats, setShowStats] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const { toast } = useToast()
  const isMountedRef = useRef(true)

  // Helper functions for enhanced promoter data
  const getDocumentStatusType = (daysUntilExpiry: number | null, dateString: string | null): "valid" | "expiring" | "expired" | "missing" => {
    if (!dateString) return "missing"
    if (daysUntilExpiry === null) return "missing"
    if (daysUntilExpiry < 0) return "expired"
    if (daysUntilExpiry <= 30) return "expiring"
    return "valid"
  }

  const getOverallStatus = (promoter: Promoter): "active" | "warning" | "critical" | "inactive" => {
    if (!promoter.status || promoter.status === "inactive") return "inactive"
    
    const idExpiry = promoter.id_card_expiry_date ? differenceInDays(parseISO(promoter.id_card_expiry_date), new Date()) : null
    const passportExpiry = promoter.passport_expiry_date ? differenceInDays(parseISO(promoter.passport_expiry_date), new Date()) : null
    
    if ((idExpiry !== null && idExpiry < 0) || (passportExpiry !== null && passportExpiry < 0)) {
      return "critical"
    }
    
    if ((idExpiry !== null && idExpiry <= 30) || (passportExpiry !== null && passportExpiry <= 30)) {
      return "warning"
    }
    
    return "active"
  }

  // Enhanced data fetching with real contract counts
  const fetchPromotersWithContractCount = useCallback(async () => {
    if (isMountedRef.current) {
      setIsLoading(true)
    }
    
    try {
      // Fetch promoters with contract count from the contracts table
      const { data: promotersData, error: promotersError } = await supabase
        .from("promoters")
        .select(`
          *
        `)
        .order("name_en")

      if (promotersError) {
        console.error("Error fetching promoters:", promotersError)
        toast({
          title: "Error",
          description: "Failed to load promoters",
          variant: "destructive",
        })
        return
      }

      // Fetch contract counts for each promoter
      const enhancedData = await Promise.all(
        (promotersData || []).map(async (promoter) => {
          try {
            const { count: contractCount, error: contractError } = await supabase
              .from("contracts")
              .select("*", { count: "exact", head: true })
              .eq("promoter_id", promoter.id)
              .eq("status", "active")

            if (contractError) {
              console.warn(`Error fetching contracts for promoter ${promoter.id}:`, contractError)
            }

            return {
              ...promoter,
              active_contracts_count: contractCount || 0
            }
          } catch (error) {
            console.warn(`Error processing promoter ${promoter.id}:`, error)
            return {
              ...promoter,
              active_contracts_count: 0
            }
          }
        })
      )

      if (isMountedRef.current) {
        setPromoters(enhancedData)
      }
    } catch (error) {
      console.error("Unexpected error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [toast])

  // Apply filters and sorting
  const applyFiltersAndSort = useCallback(() => {
    if (!promoters || promoters.length === 0) {
      setFilteredPromoters([])
      return
    }

    let filtered = promoters.filter(promoter => {
      // Search filter - enhanced to include passport number
      const searchMatch = !searchTerm || 
        promoter.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promoter.name_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promoter.id_card_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (promoter.notes && promoter.notes.toLowerCase().includes(searchTerm.toLowerCase()))

      // Status filter
      const statusMatch = filterStatus === "all" ||
        (filterStatus === "active" && (promoter.active_contracts_count || 0) > 0) ||
        (filterStatus === "inactive" && (promoter.active_contracts_count || 0) === 0)

      return searchMatch && statusMatch
    })

    // Convert to enhanced promoters for display
    const enhancedFiltered: EnhancedPromoter[] = filtered.map(promoter => {
      const idExpiryDays = promoter.id_card_expiry_date 
        ? differenceInDays(parseISO(promoter.id_card_expiry_date), new Date())
        : null

      const passportExpiryDays = promoter.passport_expiry_date
        ? differenceInDays(parseISO(promoter.passport_expiry_date), new Date())
        : null

      return {
        ...promoter,
        id_card_status: getDocumentStatusType(idExpiryDays, promoter.id_card_expiry_date || null),
        passport_status: getDocumentStatusType(passportExpiryDays, promoter.passport_expiry_date || null),
        overall_status: getOverallStatus(promoter),
        days_until_id_expiry: idExpiryDays || undefined,
        days_until_passport_expiry: passportExpiryDays || undefined,
      }
    })

    // Apply document filter to enhanced data
    const finalFiltered = enhancedFiltered.filter(promoter => {
      const documentMatch = documentFilter === "all" ||
        (documentFilter === "expiring" && (promoter.id_card_status === "expiring" || promoter.passport_status === "expiring")) ||
        (documentFilter === "expired" && (promoter.id_card_status === "expired" || promoter.passport_status === "expired")) ||
        (documentFilter === "valid" && promoter.id_card_status === "valid" && promoter.passport_status === "valid")

      return documentMatch
    })

    // Apply sorting
    const sorted = [...finalFiltered].sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortBy) {
        case "name":
          aValue = a.name_en.toLowerCase()
          bValue = b.name_en.toLowerCase()
          break
        case "id_expiry":
          aValue = a.days_until_id_expiry ?? Infinity
          bValue = b.days_until_id_expiry ?? Infinity
          break
        case "passport_expiry":
          aValue = a.days_until_passport_expiry ?? Infinity
          bValue = b.days_until_passport_expiry ?? Infinity
          break
        case "contracts":
          aValue = a.active_contracts_count || 0
          bValue = b.active_contracts_count || 0
          break
        default:
          aValue = a.name_en.toLowerCase()
          bValue = b.name_en.toLowerCase()
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    if (isMountedRef.current) {
      setFilteredPromoters(sorted)
    }
  }, [promoters, searchTerm, filterStatus, documentFilter, sortBy, sortOrder])

  // Calculate statistics
  const stats = useMemo((): PromoterStats => {
    const total = filteredPromoters.length
    const active = filteredPromoters.filter(p => p.overall_status === "active").length
    const expiring = filteredPromoters.filter(p => p.overall_status === "warning").length
    const expired = filteredPromoters.filter(p => p.overall_status === "critical").length
    const totalContracts = filteredPromoters.reduce((sum, p) => sum + (p.active_contracts_count || 0), 0)
    
    return {
      total,
      active,
      expiring_documents: expiring,
      expired_documents: expired,
      total_contracts: totalContracts,
    }
  }, [filteredPromoters])

  // Initial data fetch and setup
  useEffect(() => {
    isMountedRef.current = true
    fetchPromotersWithContractCount()
    return () => {
      isMountedRef.current = false
    }
  }, [fetchPromotersWithContractCount])

  // Apply filters whenever dependencies change
  useEffect(() => {
    applyFiltersAndSort()
  }, [applyFiltersAndSort])

  // Auto-refresh functionality
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (isMountedRef.current && !isLoading) {
        setIsRefreshing(true)
        fetchPromotersWithContractCount().finally(() => {
          if (isMountedRef.current) {
            setIsRefreshing(false)
          }
        })
      }
    }, 5 * 60 * 1000) // Refresh every 5 minutes

    return () => {
      clearInterval(refreshInterval)
    }
  }, [fetchPromotersWithContractCount, isLoading])

  const handleAddNew = () => {
    setSelectedPromoter(null)
    setShowForm(true)
  }

  const handleEdit = (promoter: Promoter) => {
    setSelectedPromoter(promoter)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setSelectedPromoter(null)
    fetchPromotersWithContractCount()
  }

  const handleBulkDelete = async () => {
    if (selectedPromoters.length === 0) return

    setBulkActionLoading(true)
    try {
      const { error } = await supabase
        .from("promoters")
        .delete()
        .in("id", selectedPromoters)

      if (error) throw error

      toast({
        title: "Success",
        description: `Deleted ${selectedPromoters.length} promoters`,
        variant: "default"
      })

      setSelectedPromoters([])
      fetchPromotersWithContractCount()
    } catch (error) {
      console.error("Error deleting promoters:", error)
      toast({
        title: "Error",
        description: "Failed to delete promoters",
        variant: "destructive"
      })
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await fetchPromotersWithContractCount()
      toast({
        title: "Refreshed",
        description: "Promoter data has been updated",
        variant: "default"
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      const csvData = filteredPromoters.map(promoter => ({
        'Name (EN)': promoter.name_en,
        'Name (AR)': promoter.name_ar,
        'ID Card Number': promoter.id_card_number,
        'ID Card Status': promoter.id_card_status,
        'ID Card Expiry': promoter.id_card_expiry_date || 'N/A',
        'Passport Status': promoter.passport_status,
        'Passport Expiry': promoter.passport_expiry_date || 'N/A',
        'Active Contracts': promoter.active_contracts_count || 0,
        'Overall Status': promoter.overall_status,
        'Created At': promoter.created_at ? format(parseISO(promoter.created_at), 'yyyy-MM-dd') : 'N/A',
        'Notes': promoter.notes || ''
      }))

      const csvContent = [
        Object.keys(csvData[0] || {}).join(','),
        ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `promoters-export-${format(new Date(), 'yyyy-MM-dd')}.csv`
      link.click()

      toast({
        title: "Export Complete",
        description: `Exported ${filteredPromoters.length} promoters to CSV`,
        variant: "default"
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export promoter data",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
    }
  }

  const toggleSelectAll = () => {
    if (selectedPromoters.length === filteredPromoters.length) {
      setSelectedPromoters([])
    } else {
      setSelectedPromoters(filteredPromoters.map(p => p.id))
    }
  }

  const toggleSelectPromoter = (promoterId: string) => {
    setSelectedPromoters(prev => 
      prev.includes(promoterId)
        ? prev.filter(id => id !== promoterId)
        : [...prev, promoterId]
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning": return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "critical": return <XCircle className="h-4 w-4 text-red-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active": return "default"
      case "warning": return "secondary"
      case "critical": return "destructive"
      default: return "outline"
    }
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
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
              Manage Promoters
            </h1>
            {isRefreshing && (
              <RefreshCw className="h-5 w-5 animate-spin text-primary" />
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
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

        {/* Statistics Dashboard */}
        {showStats && (
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">Active</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.active}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Expiring</p>
                    <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{stats.expiring_documents}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">Expired</p>
                    <p className="text-2xl font-bold text-red-900 dark:text-red-100">{stats.expired_documents}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Contracts</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.total_contracts}</p>
                  </div>
                  <BriefcaseIcon className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Enhanced Search and Filter Section */}
        <Card className="mb-6 bg-card shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Search & Filter</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentView(currentView === "table" ? "grid" : "table")}
                >
                  {currentView === "table" ? (
                    <>
                      <Grid3x3 className="mr-2 h-4 w-4" />
                      Grid View
                    </>
                  ) : (
                    <>
                      <List className="mr-2 h-4 w-4" />
                      Table View
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowStats(!showStats)}
                >
                  <Activity className="mr-2 h-4 w-4" />
                  {showStats ? "Hide" : "Show"} Stats
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
              {/* Search Input */}
              <div className="sm:col-span-2">
                <Label htmlFor="search" className="sr-only">Search</Label>
                <div className="relative">
                  <Input
                    id="search"
                    placeholder="Search by name, ID, or notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Status Filter */}
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">With Contracts</SelectItem>
                  <SelectItem value="inactive">No Contracts</SelectItem>
                </SelectContent>
              </Select>

              {/* Document Filter */}
              <Select value={documentFilter} onValueChange={setDocumentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Documents" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Documents</SelectItem>
                  <SelectItem value="valid">Valid</SelectItem>
                  <SelectItem value="expiring">Expiring Soon</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort By */}
              <Select value={sortBy} onValueChange={(value: typeof sortBy) => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="id_expiry">ID Expiry</SelectItem>
                  <SelectItem value="passport_expiry">Passport Expiry</SelectItem>
                  <SelectItem value="contracts">Contract Count</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Order */}
              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="justify-start"
              >
                {sortOrder === "asc" ? (
                  <ChevronUp className="mr-2 h-4 w-4" />
                ) : (
                  <ChevronDown className="mr-2 h-4 w-4" />
                )}
                {sortOrder === "asc" ? "Ascending" : "Descending"}
              </Button>
            </div>

            {/* Bulk Actions */}
            {selectedPromoters.length > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-primary/10 p-3">
                <span className="text-sm font-medium">
                  {selectedPromoters.length} promoter(s) selected
                </span>
                <div className="flex gap-2 ml-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportCSV}
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Export Selected
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={bulkActionLoading}
                  >
                    {bulkActionLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Delete Selected
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

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
        ) : currentView === "table" ? (
          <Card className="bg-card shadow-lg">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Promoter Directory</CardTitle>
                  <CardDescription>
                    View, add, or edit promoter details, documents, and contract status.
                    Showing {filteredPromoters.length} of {promoters.length} promoters.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportCSV}
                    disabled={isExporting || filteredPromoters.length === 0}
                  >
                    {isExporting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Export All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-100 dark:bg-slate-800">
                    <TableRow>
                      <TableHead className="w-12 px-4 py-3">
                        <Checkbox
                          checked={selectedPromoters.length === filteredPromoters.length && filteredPromoters.length > 0}
                          onCheckedChange={toggleSelectAll}
                          aria-label="Select all promoters"
                        />
                      </TableHead>
                      <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">
                        Promoter Info
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
                      <TableHead className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                        Overall Status
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
                      const isSelected = selectedPromoters.includes(promoter.id)
                      
                      return (
                        <TableRow
                          key={promoter.id}
                          className={cn(
                            "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                            isSelected && "bg-blue-50 dark:bg-blue-950/20"
                          )}
                        >
                          <TableCell className="px-4 py-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelectPromoter(promoter.id)}
                              aria-label={`Select ${promoter.name_en}`}
                            />
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                                  {promoter.name_en.charAt(0).toUpperCase()}
                                </div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
                                  {promoter.name_en}
                                </div>
                                <div className="text-sm text-muted-foreground truncate" dir="rtl">
                                  {promoter.name_ar}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                  ID: {promoter.id_card_number}
                                </div>
                                {promoter.created_at && (
                                  <div className="text-xs text-slate-400 dark:text-slate-500">
                                    Added: {format(parseISO(promoter.created_at), "MMM d, yyyy")}
                                  </div>
                                )}
                              </div>
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
                                    {promoter.days_until_id_expiry !== undefined && promoter.days_until_id_expiry <= 30 && (
                                      <span className="text-xs text-amber-600 font-medium mt-0.5">
                                        {promoter.days_until_id_expiry}d left
                                      </span>
                                    )}
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
                                    {promoter.days_until_passport_expiry !== undefined && promoter.days_until_passport_expiry <= 30 && (
                                      <span className="text-xs text-amber-600 font-medium mt-0.5">
                                        {promoter.days_until_passport_expiry}d left
                                      </span>
                                    )}
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
                            <div className="flex flex-col items-center gap-1">
                              <Badge
                                variant={
                                  (promoter.active_contracts_count || 0) > 0 ? "default" : "secondary"
                                }
                                className={
                                  (promoter.active_contracts_count || 0) > 0
                                    ? "border-green-300 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                    : "border-slate-300 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                }
                              >
                                <BriefcaseIcon className="mr-1.5 h-3.5 w-3.5" />
                                {promoter.active_contracts_count || 0}
                              </Badge>
                              {(promoter.active_contracts_count || 0) > 0 && (
                                <span className="text-xs text-green-600 dark:text-green-400">
                                  Active
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {getStatusIcon(promoter.overall_status)}
                              <Badge variant={getStatusBadgeVariant(promoter.overall_status)} className="text-xs">
                                {promoter.overall_status.charAt(0).toUpperCase() + promoter.overall_status.slice(1)}
                              </Badge>
                            </div>
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
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleEdit(promoter)}>
                                    <EditIcon className="mr-2 h-4 w-4" />
                                    Edit Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/manage-promoters/${promoter.id}`}>
                                      <EyeIcon className="mr-2 h-4 w-4" />
                                      View Profile
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={() => {
                                      setSelectedPromoters([promoter.id])
                                      handleBulkDelete()
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPromoters.map((promoter) => {
              const idCardStatus = getDocumentStatus(promoter.id_card_expiry_date)
              const passportStatus = getDocumentStatus(promoter.passport_expiry_date)
              const isSelected = selectedPromoters.includes(promoter.id)
              
              return (
                <Card 
                  key={promoter.id} 
                  className={cn(
                    "relative hover:shadow-lg transition-shadow duration-200",
                    isSelected && "ring-2 ring-primary ring-offset-2"
                  )}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                          {promoter.name_en.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {promoter.name_en}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate" dir="rtl">
                            {promoter.name_ar}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            ID: {promoter.id_card_number}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectPromoter(promoter.id)}
                          aria-label={`Select ${promoter.name_en}`}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(promoter)}>
                              <EditIcon className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/manage-promoters/${promoter.id}`}>
                                <EyeIcon className="mr-2 h-4 w-4" />
                                View Profile
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Document Status */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">ID Card</div>
                        <div className="flex flex-col items-center">
                          <idCardStatus.Icon className={`h-6 w-6 ${idCardStatus.colorClass}`} />
                          <span className={`text-xs ${idCardStatus.colorClass} mt-1`}>
                            {idCardStatus.text}
                          </span>
                          {promoter.days_until_id_expiry !== undefined && promoter.days_until_id_expiry <= 30 && (
                            <span className="text-xs text-amber-600 font-medium">
                              {promoter.days_until_id_expiry}d left
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">Passport</div>
                        <div className="flex flex-col items-center">
                          <passportStatus.Icon className={`h-6 w-6 ${passportStatus.colorClass}`} />
                          <span className={`text-xs ${passportStatus.colorClass} mt-1`}>
                            {passportStatus.text}
                          </span>
                          {promoter.days_until_passport_expiry !== undefined && promoter.days_until_passport_expiry <= 30 && (
                            <span className="text-xs text-amber-600 font-medium">
                              {promoter.days_until_passport_expiry}d left
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contract Status */}
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-2">Active Contracts</div>
                      <Badge
                        variant={(promoter.active_contracts_count || 0) > 0 ? "default" : "secondary"}
                        className="text-sm"
                      >
                        <BriefcaseIcon className="mr-1.5 h-4 w-4" />
                        {promoter.active_contracts_count || 0}
                      </Badge>
                    </div>

                    {/* Overall Status */}
                    <div className="flex items-center justify-center gap-2">
                      {getStatusIcon(promoter.overall_status)}
                      <Badge variant={getStatusBadgeVariant(promoter.overall_status)}>
                        {promoter.overall_status.charAt(0).toUpperCase() + promoter.overall_status.slice(1)}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        asChild 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                      >
                        <Link href={`/manage-promoters/${promoter.id}`}>
                          <EyeIcon className="mr-1 h-4 w-4" /> View
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(promoter)}
                        className="flex-1"
                      >
                        <EditIcon className="mr-1 h-4 w-4" /> Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
