"use client"

import { useEffect, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useSupabase } from "@/components/supabase-provider"
import PromoterForm from "@/components/promoter-form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import {
  User,
  Plus,
  Search,
  Filter,
  RefreshCw,
  MoreHorizontal,
  Edit,
  Eye,
  Trash2,
  Download,
  Upload,
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  Building2,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Star,
  Archive,
  TrendingUp,
  Activity,
  CreditCard,
  Shield,
  Hash,
  Globe,
  ArrowLeftIcon,
  FileCheck,
  XCircle,
  Passport,
  IdCard,
  CalendarDays,
  UserCheck,
  UserX,
  FileWarning,
} from "lucide-react"
import {
  format,
  parseISO,
  differenceInDays,
  isPast,
  isAfter,
  isBefore,
  subDays,
  addDays,
} from "date-fns"
import type { Promoter, Contract } from "@/lib/types"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface PromoterWithStats extends Promoter {
  active_contracts_count?: number
  total_contracts_count?: number
  document_status?: "valid" | "expiring" | "expired"
  overall_status?: "active" | "warning" | "critical" | "inactive"
  contracts?: Contract[]
}

interface PromoterStats {
  total: number
  active: number
  inactive: number
  documentsExpiring: number
  documentsExpired: number
  withActiveContracts: number
  recentlyAdded: number
  averageContractsPerPromoter: number
}

type PromoterFilter = "all" | "active" | "inactive" | "expiring" | "expired"
type DocumentFilter = "all" | "valid" | "expiring" | "expired"

export default function ManagePromotersPage() {
  const { toast } = useToast()
  const { supabase } = useSupabase()

  const [promoters, setPromoters] = useState<PromoterWithStats[]>([])
  const [filteredPromoters, setFilteredPromoters] = useState<PromoterWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPromoters, setSelectedPromoters] = useState<string[]>([])
  const [selectedPromoter, setSelectedPromoter] = useState<PromoterWithStats | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [promoterToEdit, setPromoterToEdit] = useState<Promoter | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [promoterToDelete, setPromoterToDelete] = useState<PromoterWithStats | null>(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<PromoterFilter>("all")
  const [documentFilter, setDocumentFilter] = useState<DocumentFilter>("all")
  const [contractFilter, setContractFilter] = useState<string>("all")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Stats
  const stats = useMemo<PromoterStats>(() => {
    const now = new Date()
    const sevenDaysAgo = subDays(now, 7)

    const totalContracts = promoters.reduce((sum, p) => sum + (p.active_contracts_count || 0), 0)

    return {
      total: promoters.length,
      active: promoters.filter((p) => p.overall_status === "active").length,
      inactive: promoters.filter((p) => p.overall_status === "inactive").length,
      documentsExpiring: promoters.filter((p) => p.document_status === "expiring").length,
      documentsExpired: promoters.filter((p) => p.document_status === "expired").length,
      withActiveContracts: promoters.filter((p) => (p.active_contracts_count || 0) > 0).length,
      recentlyAdded: promoters.filter(
        (p) => p.created_at && isAfter(parseISO(p.created_at), sevenDaysAgo)
      ).length,
      averageContractsPerPromoter: promoters.length > 0 ? totalContracts / promoters.length : 0,
    }
  }, [promoters])

  useEffect(() => {
    fetchPromoters()
    setupRealtimeSubscription()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [promoters, searchTerm, statusFilter, documentFilter, contractFilter])

  const fetchPromoters = async () => {
    try {
      setLoading(true)

      // Fetch promoters
      const { data: promotersData, error: promotersError } = await supabase
        .from("promoters")
        .select("*")
        .order("created_at", { ascending: false })

      if (promotersError) throw promotersError

      if (!promotersData || promotersData.length === 0) {
        setPromoters([])
        return
      }

      // Fetch contract counts for each promoter
      const promoterIds = promotersData.map((p) => p.id).filter(Boolean)

      let contractsData: any[] = []

      // Try to fetch contracts data, but don't fail if there's an error
      try {
        const { data, error } = await supabase
          .from("contracts")
          .select("*")
          .in("promoter_id", promoterIds)

        if (error) {
          console.warn("Error fetching contract data:", error)
          // Continue without contract data
        } else {
          contractsData = data || []
        }
      } catch (err) {
        console.warn("Failed to fetch contracts:", err)
        // Continue without contract data
      }

      // Enhance promoters with stats and status
      const enhancedPromoters = promotersData.map((promoter) => {
        const promoterContracts = contractsData?.filter((c) => c.promoter_id === promoter.id) || []
        const activeContracts = promoterContracts.filter(
          (c) =>
            c.contract_end_date &&
            isAfter(parseISO(c.contract_end_date), new Date()) &&
            c.status === "active"
        )

        const documentStatus = getDocumentStatus(promoter)
        const overallStatus = getOverallStatus(promoter, activeContracts.length)

        return {
          ...promoter,
          active_contracts_count: activeContracts.length,
          total_contracts_count: promoterContracts.length,
          document_status: documentStatus,
          overall_status: overallStatus,
          contracts: promoterContracts,
        }
      })

      setPromoters(enhancedPromoters)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load promoters"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    const promotersChannel = supabase
      .channel("promoters_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "promoters" }, () => {
        fetchPromoters()
      })
      .subscribe()

    const contractsChannel = supabase
      .channel("contracts_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "contracts" }, () => {
        fetchPromoters()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(promotersChannel)
      supabase.removeChannel(contractsChannel)
    }
  }

  const getDocumentStatus = (promoter: PromoterWithStats): "valid" | "expiring" | "expired" => {
    const now = new Date()
    const idCardExpiry = promoter.id_card_expiry_date
      ? parseISO(promoter.id_card_expiry_date)
      : null
    const passportExpiry = promoter.passport_expiry_date
      ? parseISO(promoter.passport_expiry_date)
      : null

    // Check if any document is expired
    if ((idCardExpiry && isPast(idCardExpiry)) || (passportExpiry && isPast(passportExpiry))) {
      return "expired"
    }

    // Check if any document is expiring within 30 days
    const thirtyDaysFromNow = addDays(now, 30)
    if (
      (idCardExpiry && isBefore(idCardExpiry, thirtyDaysFromNow)) ||
      (passportExpiry && isBefore(passportExpiry, thirtyDaysFromNow))
    ) {
      return "expiring"
    }

    return "valid"
  }

  const getOverallStatus = (
    promoter: PromoterWithStats,
    activeContracts: number
  ): "active" | "warning" | "critical" | "inactive" => {
    const documentStatus = getDocumentStatus(promoter)

    if (documentStatus === "expired") return "critical"
    if (documentStatus === "expiring") return "warning"
    if (activeContracts > 0) return "active"

    return "inactive"
  }

  const applyFilters = () => {
    let filtered = promoters

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.name_en?.toLowerCase().includes(searchLower) ||
          p.name_ar?.toLowerCase().includes(searchLower) ||
          p.id_card_number?.toLowerCase().includes(searchLower) ||
          p.email?.toLowerCase().includes(searchLower) ||
          p.phone?.toLowerCase().includes(searchLower)
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        filtered = filtered.filter((p) => p.overall_status === "active")
      } else if (statusFilter === "inactive") {
        filtered = filtered.filter((p) => p.overall_status === "inactive")
      } else if (statusFilter === "expiring") {
        filtered = filtered.filter((p) => p.document_status === "expiring")
      } else if (statusFilter === "expired") {
        filtered = filtered.filter((p) => p.document_status === "expired")
      }
    }

    // Document filter
    if (documentFilter !== "all") {
      filtered = filtered.filter((p) => p.document_status === documentFilter)
    }

    // Contract filter
    if (contractFilter === "with-contracts") {
      filtered = filtered.filter((p) => (p.active_contracts_count || 0) > 0)
    } else if (contractFilter === "without-contracts") {
      filtered = filtered.filter((p) => (p.active_contracts_count || 0) === 0)
    }

    setFilteredPromoters(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="border-green-200 bg-green-100 text-green-800">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Active
          </Badge>
        )
      case "warning":
        return (
          <Badge className="border-yellow-200 bg-yellow-100 text-yellow-800">
            <Clock className="mr-1 h-3 w-3" />
            Warning
          </Badge>
        )
      case "critical":
        return (
          <Badge className="border-red-200 bg-red-100 text-red-800">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Critical
          </Badge>
        )
      case "inactive":
        return (
          <Badge variant="secondary">
            <UserX className="mr-1 h-3 w-3" />
            Inactive
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getDocumentStatusBadge = (status?: string) => {
    switch (status) {
      case "valid":
        return (
          <Badge className="border-green-200 bg-green-100 text-green-800">
            <FileCheck className="mr-1 h-3 w-3" />
            Valid
          </Badge>
        )
      case "expiring":
        return (
          <Badge className="border-yellow-200 bg-yellow-100 text-yellow-800">
            <FileWarning className="mr-1 h-3 w-3" />
            Expiring
          </Badge>
        )
      case "expired":
        return (
          <Badge className="border-red-200 bg-red-100 text-red-800">
            <XCircle className="mr-1 h-3 w-3" />
            Expired
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const exportPromoters = () => {
    const headers = [
      "ID",
      "Name (EN)",
      "Name (AR)",
      "ID Card Number",
      "Email",
      "Phone",
      "ID Card Expiry",
      "Passport Expiry",
      "Active Contracts",
      "Document Status",
      "Overall Status",
      "Created At",
    ]

    const csvData = filteredPromoters.map((p) => [
      p.id,
      p.name_en || "",
      p.name_ar || "",
      p.id_card_number || "",
      p.email || "",
      p.phone || "",
      p.id_card_expiry_date || "",
      p.passport_expiry_date || "",
      p.active_contracts_count || 0,
      p.document_status || "",
      p.overall_status || "",
      p.created_at || "",
    ])

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `promoters-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setDocumentFilter("all")
    setContractFilter("all")
  }

  const handleEdit = (promoter: PromoterWithStats) => {
    setPromoterToEdit(promoter)
    setShowForm(true)
  }

  const handleAddNew = () => {
    setPromoterToEdit(null)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setPromoterToEdit(null)
    fetchPromoters()
  }

  const handleDelete = async (promoter: PromoterWithStats) => {
    setPromoterToDelete(promoter)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!promoterToDelete) return

    try {
      const { error } = await supabase.from("promoters").delete().eq("id", promoterToDelete.id)

      if (error) throw error

      toast({
        title: "Promoter deleted",
        description: "The promoter has been successfully deleted.",
      })

      fetchPromoters()
    } catch (error: any) {
      toast({
        title: "Error deleting promoter",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setShowDeleteDialog(false)
      setPromoterToDelete(null)
    }
  }

  const handleBulkDelete = async () => {
    try {
      const { error } = await supabase.from("promoters").delete().in("id", selectedPromoters)

      if (error) throw error

      toast({
        title: "Promoters deleted",
        description: `${selectedPromoters.length} promoters have been successfully deleted.`,
      })

      setSelectedPromoters([])
      fetchPromoters()
    } catch (error: any) {
      toast({
        title: "Error deleting promoters",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  // Pagination
  const totalPages = Math.ceil(filteredPromoters.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedPromoters = filteredPromoters.slice(startIndex, startIndex + itemsPerPage)

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-7xl">
          <Skeleton className="mb-8 h-8 w-48" />
          <div className="mb-8 grid gap-4 md:grid-cols-4 lg:grid-cols-7">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  if (showForm) {
    return (
      <div className="min-h-screen bg-background px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-2xl">
          <Button variant="outline" onClick={handleFormClose} className="mb-4">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Promoter List
          </Button>
          <PromoterForm promoterToEdit={promoterToEdit} onFormSubmit={handleFormClose} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Promoter Management</h1>
              <p className="mt-1 text-muted-foreground">
                Manage promoter profiles, documents, and contract assignments
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchPromoters} disabled={loading}>
                <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
                Refresh
              </Button>
              <Button variant="outline" onClick={exportPromoters}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button onClick={handleAddNew}>
                <Plus className="mr-2 h-4 w-4" />
                Add Promoter
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Promoters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="mt-1 text-xs text-muted-foreground">All registered promoters</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <p className="mt-1 text-xs text-muted-foreground">With active contracts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Inactive</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
              <p className="mt-1 text-xs text-muted-foreground">No active contracts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Docs Expiring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.documentsExpiring}</div>
              <p className="mt-1 text-xs text-muted-foreground">Within 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Docs Expired
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.documentsExpired}</div>
              <p className="mt-1 text-xs text-muted-foreground">Need renewal</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                With Contracts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.withActiveContracts}</div>
              <p className="mt-1 text-xs text-muted-foreground">Currently assigned</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Contracts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.averageContractsPerPromoter.toFixed(1)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Per promoter</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filters & Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search and Filters */}
              <div className="grid gap-4 md:grid-cols-5">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                    <Input
                      placeholder="Search promoters..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select
                  value={statusFilter}
                  onValueChange={(value: PromoterFilter) => setStatusFilter(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="expiring">Expiring Documents</SelectItem>
                    <SelectItem value="expired">Expired Documents</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={documentFilter}
                  onValueChange={(value: DocumentFilter) => setDocumentFilter(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Document Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Documents</SelectItem>
                    <SelectItem value="valid">Valid</SelectItem>
                    <SelectItem value="expiring">Expiring</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={contractFilter} onValueChange={setContractFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Contract Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Contracts</SelectItem>
                    <SelectItem value="with-contracts">With Active Contracts</SelectItem>
                    <SelectItem value="without-contracts">Without Contracts</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={clearFilters} size="sm">
                    Clear Filters
                  </Button>
                  <span className="self-center text-sm text-muted-foreground">
                    {filteredPromoters.length} of {promoters.length} promoters
                  </span>
                </div>

                {selectedPromoters.length > 0 && (
                  <div className="flex gap-2">
                    <span className="self-center text-sm text-muted-foreground">
                      {selectedPromoters.length} selected
                    </span>
                    <Button variant="outline" size="sm">
                      <Archive className="mr-2 h-4 w-4" />
                      Archive
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Promoters</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {selectedPromoters.length} promoters?
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleBulkDelete}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Promoters Table */}
        {filteredPromoters.length === 0 ? (
          <Card className="py-10 text-center">
            <CardHeader>
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <CardTitle>No Promoters Found</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {searchTerm ||
                statusFilter !== "all" ||
                documentFilter !== "all" ||
                contractFilter !== "all"
                  ? "No promoters match your current filters. Try adjusting your search criteria."
                  : "Get started by adding your first promoter. Click the 'Add Promoter' button."}
              </CardDescription>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Promoters ({filteredPromoters.length})
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={
                      selectedPromoters.length === paginatedPromoters.length &&
                      paginatedPromoters.length > 0
                    }
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedPromoters(paginatedPromoters.map((p) => p.id))
                      } else {
                        setSelectedPromoters([])
                      }
                    }}
                  />
                  <span className="text-sm text-muted-foreground">Select All</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <span className="sr-only">Select</span>
                      </TableHead>
                      <TableHead>Promoter</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Documents</TableHead>
                      <TableHead>Contracts</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {paginatedPromoters.map((promoter) => {
                      const isSelected = selectedPromoters.includes(promoter.id)

                      return (
                        <TableRow key={promoter.id} className={isSelected ? "bg-muted/50" : ""}>
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedPromoters((prev) => [...prev, promoter.id])
                                } else {
                                  setSelectedPromoters((prev) =>
                                    prev.filter((id) => id !== promoter.id)
                                  )
                                }
                              }}
                            />
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{promoter.name_en}</div>
                              {promoter.name_ar && (
                                <div className="text-sm text-muted-foreground" dir="rtl">
                                  {promoter.name_ar}
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground">
                                <code>{promoter.id_card_number}</code>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1">
                              {promoter.email && (
                                <div className="flex items-center text-sm">
                                  <Mail className="mr-1 h-3 w-3 text-muted-foreground" />
                                  <a href={`mailto:${promoter.email}`} className="hover:underline">
                                    {promoter.email}
                                  </a>
                                </div>
                              )}
                              {promoter.phone && (
                                <div className="flex items-center text-sm">
                                  <Phone className="mr-1 h-3 w-3 text-muted-foreground" />
                                  <a href={`tel:${promoter.phone}`} className="hover:underline">
                                    {promoter.phone}
                                  </a>
                                </div>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-2">
                              {getDocumentStatusBadge(promoter.document_status)}
                              <div className="space-y-1">
                                {promoter.id_card_expiry_date && (
                                  <div className="flex items-center text-xs text-muted-foreground">
                                    <IdCard className="mr-1 h-3 w-3" />
                                    {format(parseISO(promoter.id_card_expiry_date), "MMM yyyy")}
                                  </div>
                                )}
                                {promoter.passport_expiry_date && (
                                  <div className="flex items-center text-xs text-muted-foreground">
                                    <Passport className="mr-1 h-3 w-3" />
                                    {format(parseISO(promoter.passport_expiry_date), "MMM yyyy")}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={promoter.active_contracts_count ? "default" : "secondary"}
                              >
                                <Briefcase className="mr-1 h-3 w-3" />
                                {promoter.active_contracts_count || 0}
                              </Badge>
                              {promoter.total_contracts_count &&
                                promoter.total_contracts_count >
                                  (promoter.active_contracts_count || 0) && (
                                  <span className="text-xs text-muted-foreground">
                                    ({promoter.total_contracts_count} total)
                                  </span>
                                )}
                            </div>
                          </TableCell>

                          <TableCell>{getStatusBadge(promoter.overall_status)}</TableCell>

                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>

                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedPromoter(promoter)
                                    setShowDetailsModal(true)
                                  }}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>

                                <DropdownMenuItem onClick={() => handleEdit(promoter)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Promoter
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem>
                                  <FileText className="mr-2 h-4 w-4" />
                                  View Contracts
                                </DropdownMenuItem>

                                <DropdownMenuItem>
                                  <Upload className="mr-2 h-4 w-4" />
                                  Upload Documents
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  onClick={() => handleDelete(promoter)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t p-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to{" "}
                    {Math.min(startIndex + itemsPerPage, filteredPromoters.length)} of{" "}
                    {filteredPromoters.length} promoters
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back to Home
            </Link>
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the promoter "{promoterToDelete?.name_en}". This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Promoter Details Modal */}
      {selectedPromoter && (
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Promoter Details
              </DialogTitle>
              <DialogDescription>
                Complete information for {selectedPromoter.name_en}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="contracts">Contracts</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">English Name</Label>
                      <p className="mt-1 text-sm">{selectedPromoter.name_en}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">ID Card Number</Label>
                      <p className="mt-1 font-mono text-sm">{selectedPromoter.id_card_number}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="mt-1 text-sm">
                        {selectedPromoter.email ? (
                          <a
                            href={`mailto:${selectedPromoter.email}`}
                            className="text-primary hover:underline"
                          >
                            {selectedPromoter.email}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">Not provided</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Active Contracts</Label>
                      <p className="mt-1 text-sm">{selectedPromoter.active_contracts_count || 0}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Arabic Name</Label>
                      <p className="mt-1 text-sm" dir="rtl">
                        {selectedPromoter.name_ar || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <div className="mt-1">{getStatusBadge(selectedPromoter.overall_status)}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Phone</Label>
                      <p className="mt-1 text-sm">
                        {selectedPromoter.phone ? (
                          <a
                            href={`tel:${selectedPromoter.phone}`}
                            className="text-primary hover:underline"
                          >
                            {selectedPromoter.phone}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">Not provided</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Total Contracts</Label>
                      <p className="mt-1 text-sm">{selectedPromoter.total_contracts_count || 0}</p>
                    </div>
                  </div>
                </div>

                {selectedPromoter.address && (
                  <div>
                    <Label className="text-sm font-medium">Address</Label>
                    <p className="mt-1 text-sm">{selectedPromoter.address}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <IdCard className="h-4 w-4" />
                        ID Card
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-xs">Number</Label>
                        <p className="font-mono text-sm">{selectedPromoter.id_card_number}</p>
                      </div>
                      <div>
                        <Label className="text-xs">Expiry Date</Label>
                        <p className="text-sm">
                          {selectedPromoter.id_card_expiry_date
                            ? format(parseISO(selectedPromoter.id_card_expiry_date), "PPP")
                            : "Not set"}
                        </p>
                        {selectedPromoter.id_card_expiry_date && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {(() => {
                              const days = differenceInDays(
                                parseISO(selectedPromoter.id_card_expiry_date),
                                new Date()
                              )
                              if (days < 0) return `Expired ${Math.abs(days)} days ago`
                              if (days === 0) return "Expires today"
                              if (days <= 30) return `Expires in ${days} days`
                              return `Valid for ${days} days`
                            })()}
                          </p>
                        )}
                      </div>
                      {selectedPromoter.id_card_url && (
                        <div>
                          <Button variant="outline" size="sm" asChild>
                            <a
                              href={selectedPromoter.id_card_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              View Document
                            </a>
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Passport className="h-4 w-4" />
                        Passport
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-xs">Number</Label>
                        <p className="font-mono text-sm">
                          {selectedPromoter.passport_number || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs">Expiry Date</Label>
                        <p className="text-sm">
                          {selectedPromoter.passport_expiry_date
                            ? format(parseISO(selectedPromoter.passport_expiry_date), "PPP")
                            : "Not set"}
                        </p>
                        {selectedPromoter.passport_expiry_date && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {(() => {
                              const days = differenceInDays(
                                parseISO(selectedPromoter.passport_expiry_date),
                                new Date()
                              )
                              if (days < 0) return `Expired ${Math.abs(days)} days ago`
                              if (days === 0) return "Expires today"
                              if (days <= 30) return `Expires in ${days} days`
                              return `Valid for ${days} days`
                            })()}
                          </p>
                        )}
                      </div>
                      {selectedPromoter.passport_url && (
                        <div>
                          <Button variant="outline" size="sm" asChild>
                            <a
                              href={selectedPromoter.passport_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              View Document
                            </a>
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-4">
                  <Label className="text-sm font-medium">Document Status</Label>
                  <div className="mt-2">
                    {getDocumentStatusBadge(selectedPromoter.document_status)}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="contracts" className="space-y-4">
                {selectedPromoter.contracts && selectedPromoter.contracts.length > 0 ? (
                  <div className="space-y-3">
                    {selectedPromoter.contracts.map((contract) => (
                      <Card key={contract.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{contract.contract_number}</p>
                              <p className="text-sm text-muted-foreground">
                                {contract.contract_start_date && contract.contract_end_date && (
                                  <>
                                    {format(parseISO(contract.contract_start_date), "MMM d, yyyy")}{" "}
                                    -{format(parseISO(contract.contract_end_date), "MMM d, yyyy")}
                                  </>
                                )}
                              </p>
                            </div>
                            <Badge variant={contract.status === "active" ? "default" : "secondary"}>
                              {contract.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-semibold">No Contracts</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      This promoter has no contracts assigned yet.
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Created:</span>
                    <span>
                      {selectedPromoter.created_at &&
                        format(parseISO(selectedPromoter.created_at), "PPP")}
                    </span>
                  </div>
                  {selectedPromoter.updated_at &&
                    selectedPromoter.updated_at !== selectedPromoter.created_at && (
                      <div className="flex items-center gap-3 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Last Updated:</span>
                        <span>{format(parseISO(selectedPromoter.updated_at), "PPP")}</span>
                      </div>
                    )}
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowDetailsModal(false)
                  handleEdit(selectedPromoter)
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Promoter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
