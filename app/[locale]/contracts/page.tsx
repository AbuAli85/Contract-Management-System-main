"use client"

import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  useContracts,
  useDeleteContractMutation,
  type ContractWithRelations,
} from "@/hooks/use-contracts"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { format, parseISO, differenceInDays } from "date-fns"
import {
  Loader2,
  Eye,
  Trash2,
  Download,
  MoreHorizontal,
  Filter,
  ArrowUpDown,
  Search,
  RefreshCw,
  Grid3x3,
  List,
  Calendar,
  Users,
  Activity,
  TrendingUp,
  Clock,
  ChevronUp,
  ChevronDown,
  FileText,
  Building2,
  User,
  Edit,
  Copy,
  Archive,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import DashboardLayout from "@/components/dashboard/dashboard-layout"
import { FileTextIcon } from "@radix-ui/react-icons"
import { cn } from "@/lib/utils"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { ContractsPageContent } from "@/components/contracts/ContractsPageContent"

// Enhanced Contract interface
interface EnhancedContract extends ContractWithRelations {
  status_type: "active" | "expired" | "upcoming" | "unknown"
  days_until_expiry?: number
  contract_duration_days?: number
  age_days?: number
}

// Statistics interface
interface ContractStats {
  total: number
  active: number
  expired: number
  upcoming: number
  unknown: number
  expiring_soon: number
  total_value: number
  avg_duration: number
}

type ContractStatus = "Active" | "Expired" | "Upcoming" | "Unknown"

const getContractStatus = (contract: ContractWithRelations): ContractStatus => {
  if (!contract.contract_start_date || !contract.contract_end_date) return "Unknown"
  const now = new Date()
  const startDate = parseISO(contract.contract_start_date)
  const endDate = parseISO(contract.contract_end_date)
  if (now >= startDate && now <= endDate) return "Active"
  if (now > endDate) return "Expired"
  if (now < startDate) return "Upcoming"
  return "Unknown"
}

const enhanceContract = (contract: ContractWithRelations): EnhancedContract => {
  const status = getContractStatus(contract)
  const now = new Date()

  let days_until_expiry: number | undefined
  let contract_duration_days: number | undefined
  let age_days: number | undefined

  if (contract.contract_end_date) {
    const endDate = parseISO(contract.contract_end_date)
    days_until_expiry = differenceInDays(endDate, now)
  }

  if (contract.contract_start_date && contract.contract_end_date) {
    const startDate = parseISO(contract.contract_start_date)
    const endDate = parseISO(contract.contract_end_date)
    contract_duration_days = differenceInDays(endDate, startDate)
  }

  if (contract.created_at) {
    const createdDate = parseISO(contract.created_at)
    age_days = differenceInDays(now, createdDate)
  }

  return {
    ...contract,
    status_type: status.toLowerCase() as "active" | "expired" | "upcoming" | "unknown",
    days_until_expiry,
    contract_duration_days,
    age_days,
  }
}

export default function ContractsPage() {
  const params = useParams()
  const locale = (params?.locale as string) || "en"

  const { data: contracts, isLoading, error } = useContracts()
  const deleteContractMutation = useDeleteContractMutation()
  const { toast } = useToast()

  // Enhanced state management
  const [selectedContracts, setSelectedContracts] = useState<string[]>([])
  const [currentView, setCurrentView] = useState<"table" | "grid">("table")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | ContractStatus>("all")
  const [sortColumn, setSortColumn] = useState<keyof ContractWithRelations | "status">("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [contractToDelete, setContractToDelete] = useState<ContractWithRelations | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showStats, setShowStats] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  const isMountedRef = useRef(true)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-refresh setup
  useEffect(() => {
    const interval = setInterval(
      () => {
        if (isMountedRef.current) {
          handleRefresh()
        }
      },
      5 * 60 * 1000
    ) // 5 minutes

    refreshIntervalRef.current = interval
    return () => {
      clearInterval(interval)
      isMountedRef.current = false
    }
  }, [])

  // Calculate statistics
  const contractStats = useMemo((): ContractStats => {
    if (!contracts)
      return {
        total: 0,
        active: 0,
        expired: 0,
        upcoming: 0,
        unknown: 0,
        expiring_soon: 0,
        total_value: 0,
        avg_duration: 0,
      }

    const enhanced = contracts.map(enhanceContract)
    const now = new Date()

    return {
      total: enhanced.length,
      active: enhanced.filter((c) => c.status_type === "active").length,
      expired: enhanced.filter((c) => c.status_type === "expired").length,
      upcoming: enhanced.filter((c) => c.status_type === "upcoming").length,
      unknown: enhanced.filter((c) => c.status_type === "unknown").length,
      expiring_soon: enhanced.filter(
        (c) =>
          c.days_until_expiry !== undefined && c.days_until_expiry > 0 && c.days_until_expiry <= 30
      ).length,
      total_value: enhanced.reduce((sum, c) => sum + (c.contract_value || 0), 0),
      avg_duration:
        enhanced.reduce((sum, c) => sum + (c.contract_duration_days || 0), 0) / enhanced.length ||
        0,
    }
  }, [contracts])

  // Enhanced filtering and sorting
  const filteredAndSortedContracts = useMemo(() => {
    if (!contracts) return []

    const enhanced = contracts.map(enhanceContract)

    const filtered = enhanced.filter((contract) => {
      const contractStatus = getContractStatus(contract)
      const matchesStatus = statusFilter === "all" || contractStatus === statusFilter

      const firstParty =
        (contract.first_party &&
        typeof contract.first_party === "object" &&
        "name_en" in contract.first_party
          ? locale === "ar"
            ? contract.first_party.name_ar || contract.first_party.name_en
            : contract.first_party.name_en || contract.first_party.name_ar
          : "") || ""
      const secondParty =
        (contract.second_party &&
        typeof contract.second_party === "object" &&
        "name_en" in contract.second_party
          ? locale === "ar"
            ? contract.second_party.name_ar || contract.second_party.name_en
            : contract.second_party.name_en || contract.second_party.name_ar
          : "") || ""
      const promoterName = contract.promoters
        ? locale === "ar"
          ? contract.promoters.name_ar || contract.promoters.name_en
          : contract.promoters.name_en || contract.promoters.name_ar
        : ""

      const matchesSearch =
        !searchTerm ||
        contract.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        firstParty.toLowerCase().includes(searchTerm.toLowerCase()) ||
        secondParty.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promoterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contract.job_title &&
          contract.job_title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contract.contract_number &&
          contract.contract_number.toLowerCase().includes(searchTerm.toLowerCase()))

      return matchesStatus && matchesSearch
    })

    return filtered.sort((a, b) => {
      let valA, valB
      if (sortColumn === "status") {
        valA = getContractStatus(a)
        valB = getContractStatus(b)
      } else {
        valA = a[sortColumn as keyof ContractWithRelations]
        valB = b[sortColumn as keyof ContractWithRelations]
      }

      if (valA === null || valA === undefined) valA = ""
      if (valB === null || valB === undefined) valB = ""

      if (typeof valA === "string" && typeof valB === "string") {
        return sortDirection === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA)
      }
      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA
      }
      if (valA < valB) return sortDirection === "asc" ? -1 : 1
      if (valA > valB) return sortDirection === "asc" ? 1 : -1
      return 0
    })
  }, [contracts, searchTerm, statusFilter, sortColumn, sortDirection, locale])

  // Handler functions
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      // The useContracts hook should handle the refresh automatically
      toast({
        title: "Refreshed",
        description: "Contract data has been updated",
        variant: "default",
      })
    } finally {
      setIsRefreshing(false)
    }
  }, [toast])

  const handleSort = (column: keyof ContractWithRelations | "status") => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("desc")
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContracts(filteredAndSortedContracts.map((c) => c.id))
    } else {
      setSelectedContracts([])
    }
  }

  const handleSelectContract = (contractId: string, checked: boolean) => {
    if (checked) {
      setSelectedContracts((prev) => [...prev, contractId])
    } else {
      setSelectedContracts((prev) => prev.filter((id) => id !== contractId))
    }
  }

  const handleBulkDelete = async () => {
    setBulkActionLoading(true)
    try {
      await Promise.all(selectedContracts.map((id) => deleteContractMutation.mutateAsync(id)))
      toast({
        title: "Success",
        description: `Deleted ${selectedContracts.length} contracts`,
        variant: "default",
      })
      setSelectedContracts([])
    } catch (error) {
      console.error("Error deleting contracts:", error)
      toast({
        title: "Error",
        description: "Failed to delete contracts",
        variant: "destructive",
      })
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      const csvData = filteredAndSortedContracts.map((contract) => ({
        "Contract ID": contract.id,
        "Contract Number": contract.contract_number || "N/A",
        "First Party":
          contract.first_party &&
          typeof contract.first_party === "object" &&
          "name_en" in contract.first_party
            ? contract.first_party.name_en || "N/A"
            : "N/A",
        "Second Party":
          contract.second_party &&
          typeof contract.second_party === "object" &&
          "name_en" in contract.second_party
            ? contract.second_party.name_en || "N/A"
            : "N/A",
        Promoter: contract.promoters ? contract.promoters.name_en || "N/A" : "N/A",
        "Job Title": contract.job_title || "N/A",
        "Start Date": contract.contract_start_date || "N/A",
        "End Date": contract.contract_end_date || "N/A",
        Status: getContractStatus(contract),
        "Contract Value": contract.contract_value || 0,
        "Work Location": contract.work_location || "N/A",
        Email: contract.email || "N/A",
        "PDF URL": contract.pdf_url || "N/A",
        "Created At": contract.created_at || "N/A",
        "Days Until Expiry": contract.days_until_expiry || "N/A",
        "Contract Duration (Days)": contract.contract_duration_days || "N/A",
      }))

      const csv = [
        Object.keys(csvData[0] || {}).join(","),
        ...csvData.map((row) =>
          Object.values(row)
            .map((val) => `"${val}"`)
            .join(",")
        ),
      ].join("\n")

      const blob = new Blob([csv], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `contracts-export-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Export Successful",
        description: `Exported ${csvData.length} contracts to CSV`,
        variant: "default",
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export contracts",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeleteClick = (contract: ContractWithRelations) => {
    setContractToDelete(contract)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (!contractToDelete) return
    try {
      await deleteContractMutation.mutateAsync(contractToDelete.id)
      toast({ title: "Success", description: "Contract deleted successfully." })
    } catch (e: any) {
      toast({
        title: "Error",
        description: `Failed to delete contract: ${e.message}`,
        variant: "destructive",
      })
    } finally {
      setShowDeleteConfirm(false)
      setContractToDelete(null)
    }
  }

  const renderSortIcon = (column: keyof ContractWithRelations | "status") => {
    if (sortColumn === column) {
      return sortDirection === "asc" ? (
        <ChevronUp className="ml-2 inline h-4 w-4" />
      ) : (
        <ChevronDown className="ml-2 inline h-4 w-4" />
      )
    }
    return <ArrowUpDown className="ml-2 inline h-4 w-4 opacity-50" />
  }

  const getStatusBadge = (status: ContractStatus) => {
    const variants = {
      Active: {
        variant: "default" as const,
        className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        icon: CheckCircle,
      },
      Expired: { variant: "destructive" as const, className: "", icon: XCircle },
      Upcoming: {
        variant: "secondary" as const,
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        icon: Clock,
      },
      Unknown: { variant: "outline" as const, className: "", icon: AlertTriangle },
    }
    const config = variants[status]
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="mr-1 h-3 w-3" />
        {status}
      </Badge>
    )
  }

  // Statistics cards component
  const StatisticsCards = () => (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-100">Total</p>
              <p className="text-2xl font-bold">{contractStats.total}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-100">Active</p>
              <p className="text-2xl font-bold">{contractStats.active}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-amber-500 to-amber-600 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-100">Expiring</p>
              <p className="text-2xl font-bold">{contractStats.expiring_soon}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-amber-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-100">Expired</p>
              <p className="text-2xl font-bold">{contractStats.expired}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-100">Upcoming</p>
              <p className="text-2xl font-bold">{contractStats.upcoming}</p>
            </div>
            <Clock className="h-8 w-8 text-purple-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-indigo-100">Total Value</p>
              <p className="text-lg font-bold">${contractStats.total_value.toLocaleString()}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-indigo-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-pink-500 to-pink-600 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-pink-100">Avg Duration</p>
              <p className="text-lg font-bold">{Math.round(contractStats.avg_duration)}d</p>
            </div>
            <Calendar className="h-8 w-8 text-pink-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-gray-500 to-gray-600 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-100">Unknown</p>
              <p className="text-2xl font-bold">{contractStats.unknown}</p>
            </div>
            <Activity className="h-8 w-8 text-gray-200" />
          </div>
        </CardContent>
      </Card>
    </div>
  )

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[calc(100vh-150px)] items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg">Loading contracts...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <Card className="m-4">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Contracts</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error.message}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <ProtectedRoute>
      <ContractsPageContent />
    </ProtectedRoute>
  )
}
