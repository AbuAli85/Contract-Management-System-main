"use client"
import { useEffect, useState, useRef, useMemo, useCallback } from "react"
import type React from "react"

import PartyForm from "@/components/party-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import type { Party } from "@/lib/types"
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
  BuildingIcon,
  Loader2,
  Search,
  Filter,
  MoreHorizontal,
  Download,
  Trash2,
  RefreshCw,
  Grid3x3,
  List,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  Activity,
  TrendingUp,
  Clock,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  FileText,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Shield,
  Eye,
  Building2,
  Briefcase
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format, parseISO, differenceInDays } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface PartyWithContractCount extends Party {
  contract_count?: number;
}

// Enhanced Party interface
interface EnhancedParty extends Party {
  cr_status: "valid" | "expiring" | "expired" | "missing"
  license_status: "valid" | "expiring" | "expired" | "missing"
  overall_status: "active" | "warning" | "critical" | "inactive"
  days_until_cr_expiry?: number
  days_until_license_expiry?: number
  contract_count?: number
}

// Statistics interface
interface PartyStats {
  total: number
  active: number
  inactive: number
  suspended: number
  expiring_documents: number
  expired_documents: number
  employers: number
  clients: number
  total_contracts: number
}

export default function ManagePartiesPage() {
  const [parties, setParties] = useState<PartyWithContractCount[]>([])
  const [filteredParties, setFilteredParties] = useState<EnhancedParty[]>([])
  const [selectedParties, setSelectedParties] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedParty, setSelectedParty] = useState<Party | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [currentView, setCurrentView] = useState<"table" | "grid">("table")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [documentFilter, setDocumentFilter] = useState("all")
  const [sortBy, setSortBy] = useState<"name" | "cr_expiry" | "license_expiry" | "contracts">("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showStats, setShowStats] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const { toast } = useToast()
  const isMountedRef = useRef(true)

  const fetchPartiesWithContractCount = useCallback(async () => {
    if (isMountedRef.current) setIsLoading(true)
    
    try {
      // Fetch parties
      const { data: partiesData, error: partiesError } = await supabase
        .from("parties")
        .select("*")
        .order("name_en")

      if (partiesError) {
        console.error("Error fetching parties:", partiesError)
        toast({
          title: "Error",
          description: "Failed to load parties",
          variant: "destructive",
        })
        return
      }

      // Fetch contract counts for each party
      const enhancedData = await Promise.all(
        (partiesData || []).map(async (party) => {
          try {
            const { count: contractCount, error: contractError } = await supabase
              .from("contracts")
              .select("*", { count: "exact", head: true })
              .or(`first_party_id.eq.${party.id},second_party_id.eq.${party.id}`)
              .eq("status", "active")

            if (contractError) {
              console.warn(`Error fetching contracts for party ${party.id}:`, contractError)
            }

            return {
              ...party,
              contract_count: contractCount || 0
            }
          } catch (error) {
            console.warn(`Error processing party ${party.id}:`, error)
            return {
              ...party,
              contract_count: 0
            }
          }
        })
      )

      if (isMountedRef.current) {
        setParties(enhancedData)
      }
    } catch (error) {
      console.error("Unexpected error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      if (isMountedRef.current) setIsLoading(false)
    }
  }, [toast])

  // Combine fetching and auto-refresh logic
  useEffect(() => {
    isMountedRef.current = true
    fetchPartiesWithContractCount()

    const refreshInterval = setInterval(() => {
      if (isMountedRef.current && !isLoading) {
        setIsRefreshing(true)
        fetchPartiesWithContractCount().finally(() => {
          if (isMountedRef.current) {
            setIsRefreshing(false)
          }
        })
      }
    }, 5 * 60 * 1000) // Refresh every 5 minutes

    return () => {
      isMountedRef.current = false
      clearInterval(refreshInterval)
    }
  }, [fetchPartiesWithContractCount]) // Re-run if fetch function instance changes

  // Apply filters whenever parties or filter settings change
  useEffect(() => {
    applyFilters()
  }, [parties, searchTerm, statusFilter, typeFilter, documentFilter, sortBy, sortOrder])


  // Helper functions for enhanced party data
  const getDocumentStatusType = (daysUntilExpiry: number | null, dateString: string | null): "valid" | "expiring" | "expired" | "missing" => {
    if (!dateString) return "missing"
    if (daysUntilExpiry === null) return "missing"
    if (daysUntilExpiry < 0) return "expired"
    if (daysUntilExpiry <= 30) return "expiring"
    return "valid"
  }

  const getOverallStatus = (party: Party): "active" | "warning" | "critical" | "inactive" => {
    if (!party.status || party.status === "Inactive" || party.status === "Suspended") return "inactive"
    
    const crExpiry = party.cr_expiry_date ? differenceInDays(parseISO(party.cr_expiry_date), new Date()) : null
    const licenseExpiry = party.license_expiry_date ? differenceInDays(parseISO(party.license_expiry_date), new Date()) : null
    
    if ((crExpiry !== null && crExpiry < 0) || (licenseExpiry !== null && licenseExpiry < 0)) {
      return "critical"
    }
    
    if ((crExpiry !== null && crExpiry <= 30) || (licenseExpiry !== null && licenseExpiry <= 30)) {
      return "warning"
    }
    
    return "active"
  }

  // Enhanced filter and sort parties
  const applyFilters = useCallback(() => {
    if (!parties || parties.length === 0) {
      setFilteredParties([])
      return
    }

    let filtered = parties.filter(party => {
      // Search filter - enhanced to include more fields
      const searchMatch = !searchTerm || 
        party.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
        party.name_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
        party.crn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (party.role && party.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (party.contact_person && party.contact_person.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (party.contact_email && party.contact_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (party.notes && party.notes.toLowerCase().includes(searchTerm.toLowerCase()))

      // Status filter
      const statusMatch = statusFilter === "all" || party.status === statusFilter

      // Type filter
      const typeMatch = typeFilter === "all" || party.type === typeFilter

      return searchMatch && statusMatch && typeMatch
    })

    // Convert to enhanced parties for display
    const enhancedFiltered: EnhancedParty[] = filtered.map(party => {
      const crExpiryDays = party.cr_expiry_date 
        ? differenceInDays(parseISO(party.cr_expiry_date), new Date())
        : null

      const licenseExpiryDays = party.license_expiry_date
        ? differenceInDays(parseISO(party.license_expiry_date), new Date())
        : null

      return {
        ...party,
        cr_status: getDocumentStatusType(crExpiryDays, party.cr_expiry_date || null),
        license_status: getDocumentStatusType(licenseExpiryDays, party.license_expiry_date || null),
        overall_status: getOverallStatus(party),
        days_until_cr_expiry: crExpiryDays || undefined,
        days_until_license_expiry: licenseExpiryDays || undefined,
      }
    })

    // Apply document filter to enhanced data
    const finalFiltered = enhancedFiltered.filter(party => {
      const documentMatch = documentFilter === "all" ||
        (documentFilter === "expiring" && (party.cr_status === "expiring" || party.license_status === "expiring")) ||
        (documentFilter === "expired" && (party.cr_status === "expired" || party.license_status === "expired")) ||
        (documentFilter === "valid" && party.cr_status === "valid" && party.license_status === "valid")

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
        case "cr_expiry":
          aValue = a.days_until_cr_expiry ?? Infinity
          bValue = b.days_until_cr_expiry ?? Infinity
          break
        case "license_expiry":
          aValue = a.days_until_license_expiry ?? Infinity
          bValue = b.days_until_license_expiry ?? Infinity
          break
        case "contracts":
          aValue = a.contract_count || 0
          bValue = b.contract_count || 0
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
      setFilteredParties(sorted)
    }
  }, [searchTerm, statusFilter, typeFilter, documentFilter, sortBy, sortOrder, parties])

  // Calculate statistics
  const stats = useMemo((): PartyStats => {
    const total = filteredParties.length
    const active = filteredParties.filter(p => p.status === "Active").length
    const inactive = filteredParties.filter(p => p.status === "Inactive").length
    const suspended = filteredParties.filter(p => p.status === "Suspended").length
    const expiring = filteredParties.filter(p => p.overall_status === "warning").length
    const expired = filteredParties.filter(p => p.overall_status === "critical").length
    const employers = filteredParties.filter(p => p.type === "Employer").length
    const clients = filteredParties.filter(p => p.type === "Client").length
    const totalContracts = filteredParties.reduce((sum, p) => sum + (p.contract_count || 0), 0)
    
    return {
      total,
      active,
      inactive,
      suspended,
      expiring_documents: expiring,
      expired_documents: expired,
      employers,
      clients,
      total_contracts: totalContracts,
    }
  }, [filteredParties])

  const handleEdit = (party: Party) => {
    setSelectedParty(party)
    setShowForm(true)
  }

  const handleAddNew = () => {
    setSelectedParty(null)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setSelectedParty(null)
    fetchPartiesWithContractCount() // Refresh the list after form submission
  }

  const handleBulkDelete = async () => {
    if (selectedParties.length === 0) return

    setBulkActionLoading(true)
    try {
      const { error } = await supabase
        .from("parties")
        .delete()
        .in("id", selectedParties)

      if (error) throw error

      toast({
        title: "Success",
        description: `Deleted ${selectedParties.length} parties`,
        variant: "default"
      })

      setSelectedParties([])
      fetchPartiesWithContractCount()
    } catch (error) {
      console.error("Error deleting parties:", error)
      toast({
        title: "Error",
        description: "Failed to delete parties",
        variant: "destructive"
      })
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await fetchPartiesWithContractCount()
      toast({
        title: "Refreshed",
        description: "Party data has been updated",
        variant: "default"
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      const csvData = filteredParties.map(party => ({
        'Name (EN)': party.name_en,
        'Name (AR)': party.name_ar,
        'CRN': party.crn,
        'Type': party.type || 'N/A',
        'Role': party.role || 'N/A',
        'Status': party.status || 'N/A',
        'CR Status': party.cr_status,
        'CR Expiry': party.cr_expiry_date || 'N/A',
        'License Status': party.license_status,
        'License Expiry': party.license_expiry_date || 'N/A',
        'Contact Person': party.contact_person || 'N/A',
        'Contact Email': party.contact_email || 'N/A',
        'Contact Phone': party.contact_phone || 'N/A',
        'Address (EN)': party.address_en || 'N/A',
        'Tax Number': party.tax_number || 'N/A',
        'License Number': party.license_number || 'N/A',
        'Active Contracts': party.contract_count || 0,
        'Overall Status': party.overall_status,
        'Created At': party.created_at ? format(parseISO(party.created_at), 'yyyy-MM-dd') : 'N/A',
        'Notes': party.notes || ''
      }))

      const csvContent = [
        Object.keys(csvData[0] || {}).join(','),
        ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `parties-export-${format(new Date(), 'yyyy-MM-dd')}.csv`
      link.click()

      toast({
        title: "Export Complete",
        description: `Exported ${filteredParties.length} parties to CSV`,
        variant: "default"
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export party data",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
    }
  }

  const toggleSelectAll = () => {
    if (selectedParties.length === filteredParties.length) {
      setSelectedParties([])
    } else {
      setSelectedParties(filteredParties.map(p => p.id))
    }
  }

  const toggleSelectParty = (partyId: string) => {
    setSelectedParties(prev => 
      prev.includes(partyId)
        ? prev.filter(id => id !== partyId)
        : [...prev, partyId]
    )
  }

  const getStatusBadge = (status: string | null | undefined) => {
    switch (status) {
      case "Active":
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Active</Badge>
      case "Inactive":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">Inactive</Badge>
      case "Suspended":
        return <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Suspended</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getTypeBadge = (type: string | null | undefined) => {
    switch (type) {
      case "Employer":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Employer</Badge>
      case "Client":
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">Client</Badge>
      case "Generic":
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">Generic</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
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

  const getDocumentStatus = (expiryDate: string | null | undefined) => {
    if (!expiryDate) {
      return {
        text: "No Date",
        Icon: AlertTriangle,
        colorClass: "text-slate-500",
        tooltip: "Expiry date not set",
      }
    }
    
    const date = parseISO(expiryDate)
    const today = new Date()
    const daysUntilExpiry = differenceInDays(date, today)

    if (daysUntilExpiry < 0) {
      return {
        text: "Expired",
        Icon: XCircle,
        colorClass: "text-red-500",
        tooltip: `Expired on ${format(date, "MMM d, yyyy")}`,
      }
    }
    if (daysUntilExpiry <= 30) {
      return {
        text: "Expires Soon",
        Icon: AlertTriangle,
        colorClass: "text-orange-500",
        tooltip: `Expires in ${daysUntilExpiry} day(s) on ${format(date, "MMM d, yyyy")}`,
      }
    }
    return {
      text: "Valid",
      Icon: CheckCircle,
      colorClass: "text-green-500",
      tooltip: `Valid until ${format(date, "MMM d, yyyy")}`,
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A"
    try {
      return format(parseISO(dateString), "dd-MM-yyyy")
    } catch {
      return "Invalid Date"
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-lg text-slate-700 dark:text-slate-300">Loading parties...</p>
      </div>
    )
  }

  if (showForm) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950 sm:py-12">
        <div className="mx-auto max-w-6xl">
          <Button variant="outline" onClick={handleFormClose} className="mb-6">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Party List
          </Button>
          <PartyForm partyToEdit={selectedParty} onFormSubmit={handleFormClose} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950 sm:py-12">
      <div className="mx-auto max-w-screen-xl">
        <div className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
              Manage Parties
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
              Add New Party
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
                  <Building2 className="h-8 w-8 text-blue-500" />
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
                  <Briefcase className="h-8 w-8 text-purple-500" />
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-7">
              {/* Search Input */}
              <div className="sm:col-span-2">
                <Label htmlFor="search" className="sr-only">Search</Label>
                <div className="relative">
                  <Input
                    id="search"
                    placeholder="Search by name, CRN, role, or contact..."
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>

              {/* Type Filter */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Employer">Employer</SelectItem>
                  <SelectItem value="Client">Client</SelectItem>
                  <SelectItem value="Generic">Generic</SelectItem>
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
                  <SelectItem value="cr_expiry">CR Expiry</SelectItem>
                  <SelectItem value="license_expiry">License Expiry</SelectItem>
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
            {selectedParties.length > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-primary/10 p-3">
                <span className="text-sm font-medium">
                  {selectedParties.length} party(ies) selected
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

            <div className="text-sm text-muted-foreground">
              Showing {filteredParties.length} of {parties.length} parties
            </div>
          </CardContent>
        </Card>

        {filteredParties.length === 0 ? (
          <Card className="bg-card py-12 text-center shadow-md">
            <CardHeader>
              <BuildingIcon className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
              <CardTitle className="text-2xl">No Parties Found</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-lg">
                {parties.length === 0 
                  ? "Get started by adding your first party. Click the 'Add New Party' button above."
                  : "No parties match your current filters. Try adjusting your search criteria."
                }
              </CardDescription>
            </CardContent>
          </Card>
        ) : currentView === "table" ? (
          <Card className="bg-card shadow-lg">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Party Directory</CardTitle>
                  <CardDescription>
                    View, add, or edit party details, documents, and contract status.
                    Showing {filteredParties.length} of {parties.length} parties.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportCSV}
                    disabled={isExporting || filteredParties.length === 0}
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
                          checked={selectedParties.length === filteredParties.length && filteredParties.length > 0}
                          onCheckedChange={toggleSelectAll}
                          aria-label="Select all parties"
                        />
                      </TableHead>
                      <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">
                        Party Info
                      </TableHead>
                      <TableHead className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                        Type & Status
                      </TableHead>
                      <TableHead className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                        CR Status
                      </TableHead>
                      <TableHead className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                        License Status
                      </TableHead>
                      <TableHead className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                        Contact Info
                      </TableHead>
                      <TableHead className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                        Contracts
                      </TableHead>
                      <TableHead className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y">
                    {filteredParties.map((party) => {
                      const crStatus = getDocumentStatus(party.cr_expiry_date)
                      const licenseStatus = getDocumentStatus(party.license_expiry_date)
                      const isSelected = selectedParties.includes(party.id)
                      
                      return (
                        <TableRow
                          key={party.id}
                          className={cn(
                            "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                            isSelected && "bg-blue-50 dark:bg-blue-950/20"
                          )}
                        >
                          <TableCell className="px-4 py-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelectParty(party.id)}
                              aria-label={`Select ${party.name_en}`}
                            />
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                                  {party.name_en.charAt(0).toUpperCase()}
                                </div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
                                  {party.name_en}
                                </div>
                                <div className="text-sm text-muted-foreground truncate" dir="rtl">
                                  {party.name_ar}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 truncate font-mono">
                                  CRN: {party.crn}
                                </div>
                                {party.role && (
                                  <div className="text-xs text-slate-400 dark:text-slate-500 truncate">
                                    Role: {party.role}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-center">
                            <div className="flex flex-col items-center gap-2">
                              {getTypeBadge(party.type)}
                              {getStatusBadge(party.status)}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-center">
                            <TooltipProvider delayDuration={100}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex flex-col items-center">
                                    <crStatus.Icon
                                      className={`h-5 w-5 ${crStatus.colorClass}`}
                                    />
                                    <span className={`mt-1 text-xs ${crStatus.colorClass}`}>
                                      {crStatus.text}
                                    </span>
                                    {party.days_until_cr_expiry !== undefined && party.days_until_cr_expiry <= 30 && (
                                      <span className="text-xs text-amber-600 font-medium mt-0.5">
                                        {party.days_until_cr_expiry}d left
                                      </span>
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{crStatus.tooltip}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-center">
                            <TooltipProvider delayDuration={100}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex flex-col items-center">
                                    <licenseStatus.Icon
                                      className={`h-5 w-5 ${licenseStatus.colorClass}`}
                                    />
                                    <span className={`mt-1 text-xs ${licenseStatus.colorClass}`}>
                                      {licenseStatus.text}
                                    </span>
                                    {party.days_until_license_expiry !== undefined && party.days_until_license_expiry <= 30 && (
                                      <span className="text-xs text-amber-600 font-medium mt-0.5">
                                        {party.days_until_license_expiry}d left
                                      </span>
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{licenseStatus.tooltip}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex flex-col gap-1 text-xs">
                              {party.contact_person && (
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3 text-muted-foreground" />
                                  <span className="truncate">{party.contact_person}</span>
                                </div>
                              )}
                              {party.contact_email && (
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  <span className="truncate">{party.contact_email}</span>
                                </div>
                              )}
                              {party.contact_phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  <span className="truncate">{party.contact_phone}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <Badge
                                variant={
                                  (party.contract_count || 0) > 0 ? "default" : "secondary"
                                }
                                className={
                                  (party.contract_count || 0) > 0
                                    ? "border-green-300 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                    : "border-slate-300 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                }
                              >
                                <Briefcase className="mr-1.5 h-3.5 w-3.5" />
                                {party.contract_count || 0}
                              </Badge>
                              {(party.contract_count || 0) > 0 && (
                                <span className="text-xs text-green-600 dark:text-green-400">
                                  Active
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                asChild 
                                variant="outline" 
                                size="sm" 
                                className="text-xs"
                                disabled={!party.id}
                              >
                                <Link href={party.id ? `/manage-parties/${party.id}` : "#"}>
                                  <Eye className="mr-1 h-3.5 w-3.5" /> View
                                </Link>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(party)}
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
                                  <DropdownMenuItem onClick={() => handleEdit(party)}>
                                    <EditIcon className="mr-2 h-4 w-4" />
                                    Edit Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/manage-parties/${party.id}`}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Profile
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={() => {
                                      setSelectedParties([party.id])
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
            {filteredParties.map((party) => {
              const crStatus = getDocumentStatus(party.cr_expiry_date)
              const licenseStatus = getDocumentStatus(party.license_expiry_date)
              const isSelected = selectedParties.includes(party.id)
              
              return (
                <Card 
                  key={party.id} 
                  className={cn(
                    "relative hover:shadow-lg transition-shadow duration-200",
                    isSelected && "ring-2 ring-primary ring-offset-2"
                  )}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                          {party.name_en.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {party.name_en}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate" dir="rtl">
                            {party.name_ar}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            CRN: {party.crn}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectParty(party.id)}
                          aria-label={`Select ${party.name_en}`}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(party)}>
                              <EditIcon className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/manage-parties/${party.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Profile
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Type and Status */}
                    <div className="flex items-center justify-between">
                      {getTypeBadge(party.type)}
                      {getStatusBadge(party.status)}
                    </div>

                    {/* Document Status */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">CR Status</div>
                        <div className="flex flex-col items-center">
                          <crStatus.Icon className={`h-6 w-6 ${crStatus.colorClass}`} />
                          <span className={`text-xs ${crStatus.colorClass} mt-1`}>
                            {crStatus.text}
                          </span>
                          {party.days_until_cr_expiry !== undefined && party.days_until_cr_expiry <= 30 && (
                            <span className="text-xs text-amber-600 font-medium">
                              {party.days_until_cr_expiry}d left
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">License</div>
                        <div className="flex flex-col items-center">
                          <licenseStatus.Icon className={`h-6 w-6 ${licenseStatus.colorClass}`} />
                          <span className={`text-xs ${licenseStatus.colorClass} mt-1`}>
                            {licenseStatus.text}
                          </span>
                          {party.days_until_license_expiry !== undefined && party.days_until_license_expiry <= 30 && (
                            <span className="text-xs text-amber-600 font-medium">
                              {party.days_until_license_expiry}d left
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    {(party.contact_person || party.contact_email || party.contact_phone) && (
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">Contact Info</div>
                        <div className="space-y-1">
                          {party.contact_person && (
                            <div className="flex items-center gap-2 text-xs">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              <span className="truncate">{party.contact_person}</span>
                            </div>
                          )}
                          {party.contact_email && (
                            <div className="flex items-center gap-2 text-xs">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span className="truncate">{party.contact_email}</span>
                            </div>
                          )}
                          {party.contact_phone && (
                            <div className="flex items-center gap-2 text-xs">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="truncate">{party.contact_phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Contract Status */}
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-2">Active Contracts</div>
                      <Badge
                        variant={(party.contract_count || 0) > 0 ? "default" : "secondary"}
                        className="text-sm"
                      >
                        <Briefcase className="mr-1.5 h-4 w-4" />
                        {party.contract_count || 0}
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
                        <Link href={`/manage-parties/${party.id}`}>
                          <Eye className="mr-1 h-4 w-4" /> View
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(party)}
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
