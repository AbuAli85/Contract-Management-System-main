"use client"

import { useEffect, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
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
  Activity
} from "lucide-react"
import { format, parseISO, differenceInDays, isPast, isAfter, isBefore, subDays } from "date-fns"
import { supabase } from "@/lib/supabase"
import { LoadingSpinner, ContractCardSkeleton } from "@/components/ui/skeletons"
import type { Promoter } from "@/lib/types"

interface PromoterWithStats extends Promoter {
  active_contracts_count?: number
  total_contracts_count?: number
  document_status?: 'valid' | 'expiring' | 'expired'
  overall_status?: 'active' | 'warning' | 'critical' | 'inactive'
}

interface PromoterStats {
  total: number
  active: number
  inactive: number
  documentsExpiring: number
  documentsExpired: number
  withActiveContracts: number
  recentlyAdded: number
}

type PromoterFilter = 'all' | 'active' | 'inactive' | 'expiring' | 'expired'
type DocumentFilter = 'all' | 'valid' | 'expiring' | 'expired'

export function PromoterManagement() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const { toast } = useToast()
  
  const [promoters, setPromoters] = useState<PromoterWithStats[]>([])
  const [filteredPromoters, setFilteredPromoters] = useState<PromoterWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPromoters, setSelectedPromoters] = useState<string[]>([])
  const [selectedPromoter, setSelectedPromoter] = useState<PromoterWithStats | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<PromoterFilter>('all')
  const [documentFilter, setDocumentFilter] = useState<DocumentFilter>('all')
  const [contractFilter, setContractFilter] = useState<string>('all')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  
  // Stats
  const [stats, setStats] = useState<PromoterStats>({
    total: 0,
    active: 0,
    inactive: 0,
    documentsExpiring: 0,
    documentsExpired: 0,
    withActiveContracts: 0,
    recentlyAdded: 0
  })

  useEffect(() => {
    if (isAuthenticated) {
      fetchPromoters()
      setupRealtimeSubscription()
    }
  }, [isAuthenticated])

  useEffect(() => {
    applyFilters()
  }, [promoters, searchTerm, statusFilter, documentFilter, contractFilter])

  const fetchPromoters = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch promoters
      const { data: promotersData, error: promotersError } = await supabase
        .from('promoters')
        .select('*')
        .order('name_en')

      if (promotersError) {
        throw new Error(`Failed to fetch promoters: ${promotersError.message}`)
      }

      if (!promotersData || promotersData.length === 0) {
        setPromoters([])
        calculateStats([])
        return
      }

      // Fetch contract counts for each promoter
      const promoterIds = promotersData.map(p => p.id).filter(Boolean)
      
      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select('promoter_id, contract_end_date, status')
        .in('promoter_id', promoterIds)

      if (contractsError) {
        console.warn('Error fetching contract data:', contractsError)
      }

      // Enhance promoters with stats and status
      const enhancedPromoters = promotersData
        .filter(promoter => promoter.id)
        .map(promoter => {
          const promoterContracts = contractsData?.filter(c => c.promoter_id === promoter.id) || []
          const activeContracts = promoterContracts.filter(c => 
            c.contract_end_date && 
            isAfter(parseISO(c.contract_end_date), new Date()) &&
            c.status === 'active'
          )

          const documentStatus = getDocumentStatus(promoter)
          const overallStatus = getOverallStatus(promoter, activeContracts.length)

          return {
            ...promoter,
            active_contracts_count: activeContracts.length,
            total_contracts_count: promoterContracts.length,
            document_status: documentStatus,
            overall_status: overallStatus
          }
        })

      setPromoters(enhancedPromoters)
      calculateStats(enhancedPromoters)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load promoters'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    const promotersChannel = supabase
      .channel('promoters_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'promoters' },
        () => {
          fetchPromoters()
        }
      )
      .subscribe()

    const contractsChannel = supabase
      .channel('contracts_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contracts' },
        () => {
          fetchPromoters()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(promotersChannel)
      supabase.removeChannel(contractsChannel)
    }
  }

  const getDocumentStatus = (promoter: PromoterWithStats): 'valid' | 'expiring' | 'expired' => {
    const now = new Date()
    const idCardExpiry = promoter.id_card_expiry_date ? parseISO(promoter.id_card_expiry_date) : null
    const passportExpiry = promoter.passport_expiry_date ? parseISO(promoter.passport_expiry_date) : null

    // Check if any document is expired
    if ((idCardExpiry && isPast(idCardExpiry)) || (passportExpiry && isPast(passportExpiry))) {
      return 'expired'
    }

    // Check if any document is expiring within 30 days
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    if (
      (idCardExpiry && isBefore(idCardExpiry, thirtyDaysFromNow)) ||
      (passportExpiry && isBefore(passportExpiry, thirtyDaysFromNow))
    ) {
      return 'expiring'
    }

    return 'valid'
  }

  const getOverallStatus = (promoter: PromoterWithStats, activeContracts: number): 'active' | 'warning' | 'critical' | 'inactive' => {
    const documentStatus = getDocumentStatus(promoter)
    
    if (documentStatus === 'expired') return 'critical'
    if (documentStatus === 'expiring') return 'warning'
    if (activeContracts > 0) return 'active'
    
    return 'inactive'
  }

  const calculateStats = (promoterData: PromoterWithStats[]) => {
    const now = new Date()
    const sevenDaysAgo = subDays(now, 7)
    
    const stats: PromoterStats = {
      total: promoterData.length,
      active: promoterData.filter(p => p.overall_status === 'active').length,
      inactive: promoterData.filter(p => p.overall_status === 'inactive').length,
      documentsExpiring: promoterData.filter(p => p.document_status === 'expiring').length,
      documentsExpired: promoterData.filter(p => p.document_status === 'expired').length,
      withActiveContracts: promoterData.filter(p => (p.active_contracts_count || 0) > 0).length,
      recentlyAdded: promoterData.filter(p => 
        p.created_at && isAfter(parseISO(p.created_at), sevenDaysAgo)
      ).length
    }

    setStats(stats)
  }

  const applyFilters = () => {
    let filtered = promoters

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(p =>
        p.name_en?.toLowerCase().includes(searchLower) ||
        p.name_ar?.toLowerCase().includes(searchLower) ||
        p.id_card_number?.toLowerCase().includes(searchLower) ||
        p.email?.toLowerCase().includes(searchLower) ||
        p.phone?.toLowerCase().includes(searchLower)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(p => p.overall_status === 'active')
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(p => p.overall_status === 'inactive')
      } else if (statusFilter === 'expiring') {
        filtered = filtered.filter(p => p.document_status === 'expiring')
      } else if (statusFilter === 'expired') {
        filtered = filtered.filter(p => p.document_status === 'expired')
      }
    }

    // Document filter
    if (documentFilter !== 'all') {
      filtered = filtered.filter(p => p.document_status === documentFilter)
    }

    // Contract filter
    if (contractFilter === 'with-contracts') {
      filtered = filtered.filter(p => (p.active_contracts_count || 0) > 0)
    } else if (contractFilter === 'without-contracts') {
      filtered = filtered.filter(p => (p.active_contracts_count || 0) === 0)
    }

    setFilteredPromoters(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />Active</Badge>
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Warning</Badge>
      case 'critical':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />Critical</Badge>
      case 'inactive':
        return <Badge variant="secondary"><User className="w-3 h-3 mr-1" />Inactive</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getDocumentStatusBadge = (status?: string) => {
    switch (status) {
      case 'valid':
        return <Badge className="bg-green-100 text-green-800">Valid</Badge>
      case 'expiring':
        return <Badge className="bg-yellow-100 text-yellow-800">Expiring</Badge>
      case 'expired':
        return <Badge className="bg-red-100 text-red-800">Expired</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const exportPromoters = () => {
    const headers = [
      'ID', 'Name (EN)', 'Name (AR)', 'ID Card Number', 'Email', 'Phone',
      'ID Card Expiry', 'Passport Expiry', 'Active Contracts', 'Document Status',
      'Overall Status', 'Created At'
    ]
    
    const csvData = filteredPromoters.map(p => [
      p.id,
      p.name_en || '',
      p.name_ar || '',
      p.id_card_number || '',
      p.email || '',
      p.phone || '',
      p.id_card_expiry_date || '',
      p.passport_expiry_date || '',
      p.active_contracts_count || 0,
      p.document_status || '',
      p.overall_status || '',
      p.created_at || ''
    ])

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `promoters-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setDocumentFilter('all')
    setContractFilter('all')
  }

  // Pagination
  const totalPages = Math.ceil(filteredPromoters.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedPromoters = filteredPromoters.slice(startIndex, startIndex + itemsPerPage)

  // Show loading state while authentication is being checked
  if (authLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
          <span className="ml-2">Checking authentication...</span>
        </div>
      </div>
    )
  }

  // Show authentication required message
  if (!isAuthenticated || !user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Promoter Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span>Authentication required to access promoter management</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <ContractCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <ContractCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Promoter Management</h1>
          <p className="text-muted-foreground">
            Manage promoter profiles, documents, and contract assignments with comprehensive tracking.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={fetchPromoters} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportPromoters}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Promoter
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-destructive/15 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-destructive mr-2" />
            <p className="text-sm text-destructive">{error}</p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setError(null)}
              className="ml-auto"
            >
              ×
            </Button>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inactive</p>
                <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
              </div>
              <User className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expiring</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.documentsExpiring}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold text-red-600">{stats.documentsExpired}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">With Contracts</p>
                <p className="text-2xl font-bold text-blue-600">{stats.withActiveContracts}</p>
              </div>
              <Briefcase className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recent</p>
                <p className="text-2xl font-bold text-purple-600">{stats.recentlyAdded}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="grid gap-4 md:grid-cols-5">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search promoters..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={(value: PromoterFilter) => setStatusFilter(value)}>
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
              
              <Select value={documentFilter} onValueChange={(value: DocumentFilter) => setDocumentFilter(value)}>
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
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  size="sm"
                >
                  Clear Filters
                </Button>
                <span className="text-sm text-muted-foreground self-center">
                  {filteredPromoters.length} promoters
                </span>
              </div>
              
              {selectedPromoters.length > 0 && (
                <div className="flex gap-2">
                  <span className="text-sm text-muted-foreground self-center">
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
                        <AlertDialogAction>Delete</AlertDialogAction>
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Promoters ({filteredPromoters.length})
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedPromoters.length === paginatedPromoters.length && paginatedPromoters.length > 0}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedPromoters(paginatedPromoters.map(p => p.id))
                  } else {
                    setSelectedPromoters([])
                  }
                }}
              />
              <span className="text-sm text-muted-foreground">Select All</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paginatedPromoters.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">No promoters found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {filteredPromoters.length === 0 && promoters.length === 0
                  ? "Get started by adding your first promoter."
                  : "Try adjusting your filters to see more results."
                }
              </p>
              {filteredPromoters.length === 0 && promoters.length === 0 && (
                <div className="mt-4">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Promoter
                  </Button>
                </div>
              )}
            </div>
          ) : (
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
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                
                <TableBody>
                  {paginatedPromoters.map((promoter) => {
                    const isSelected = selectedPromoters.includes(promoter.id)
                    
                    return (
                      <TableRow key={promoter.id} className={isSelected ? 'bg-muted/50' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedPromoters(prev => [...prev, promoter.id])
                              } else {
                                setSelectedPromoters(prev => prev.filter(id => id !== promoter.id))
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
                              ID: {promoter.id_card_number}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            {promoter.email && (
                              <div className="flex items-center text-sm">
                                <Mail className="mr-1 h-3 w-3" />
                                {promoter.email}
                              </div>
                            )}
                            {promoter.phone && (
                              <div className="flex items-center text-sm">
                                <Phone className="mr-1 h-3 w-3" />
                                {promoter.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            {getDocumentStatusBadge(promoter.document_status)}
                            <div className="text-xs text-muted-foreground">
                              {promoter.id_card_expiry_date && (
                                <div>ID: {format(parseISO(promoter.id_card_expiry_date), 'MMM yyyy')}</div>
                              )}
                              {promoter.passport_expiry_date && (
                                <div>Passport: {format(parseISO(promoter.passport_expiry_date), 'MMM yyyy')}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={promoter.active_contracts_count ? "default" : "secondary"}>
                              <Briefcase className="mr-1 h-3 w-3" />
                              {promoter.active_contracts_count || 0}
                            </Badge>
                            {promoter.total_contracts_count && promoter.total_contracts_count > (promoter.active_contracts_count || 0) && (
                              <span className="text-xs text-muted-foreground">
                                ({promoter.total_contracts_count} total)
                              </span>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          {getStatusBadge(promoter.overall_status)}
                        </TableCell>
                        
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
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
                              
                              <DropdownMenuItem>
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
                              
                              <DropdownMenuItem className="text-destructive">
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
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredPromoters.length)} of {filteredPromoters.length} promoters
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
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
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Promoter Details Modal */}
      {selectedPromoter && (
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Promoter Details: {selectedPromoter.name_en}
              </DialogTitle>
              <DialogDescription>
                Complete promoter information and status
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">General Info</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="contracts">Contracts</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">English Name</Label>
                    <p className="text-sm">{selectedPromoter.name_en}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Arabic Name</Label>
                    <p className="text-sm" dir="rtl">{selectedPromoter.name_ar || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">ID Card Number</Label>
                    <p className="text-sm font-mono">{selectedPromoter.id_card_number}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedPromoter.overall_status)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm">{selectedPromoter.email || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Phone</Label>
                    <p className="text-sm">{selectedPromoter.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Active Contracts</Label>
                    <p className="text-sm">{selectedPromoter.active_contracts_count || 0}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Total Contracts</Label>
                    <p className="text-sm">{selectedPromoter.total_contracts_count || 0}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="documents" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">ID Card</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <Label className="text-xs">Expiry Date</Label>
                        <p className="text-sm">
                          {selectedPromoter.id_card_expiry_date 
                            ? format(parseISO(selectedPromoter.id_card_expiry_date), 'PPP')
                            : 'Not set'
                          }
                        </p>
                      </div>
                      {selectedPromoter.id_card_url && (
                        <div>
                          <Label className="text-xs">Document</Label>
                          <Button variant="outline" size="sm" asChild>
                            <a href={selectedPromoter.id_card_url} target="_blank" rel="noopener noreferrer">
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
                      <CardTitle className="text-sm">Passport</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <Label className="text-xs">Expiry Date</Label>
                        <p className="text-sm">
                          {selectedPromoter.passport_expiry_date 
                            ? format(parseISO(selectedPromoter.passport_expiry_date), 'PPP')
                            : 'Not set'
                          }
                        </p>
                      </div>
                      {selectedPromoter.passport_url && (
                        <div>
                          <Label className="text-xs">Document</Label>
                          <Button variant="outline" size="sm" asChild>
                            <a href={selectedPromoter.passport_url} target="_blank" rel="noopener noreferrer">
                              <FileText className="mr-2 h-4 w-4" />
                              View Document
                            </a>
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Document Status</Label>
                  <div className="mt-1">{getDocumentStatusBadge(selectedPromoter.document_status)}</div>
                </div>
              </TabsContent>
              
              <TabsContent value="contracts" className="space-y-4">
                <div className="text-center py-8">
                  <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold">Contract History</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Contract management integration coming soon
                  </p>
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                Close
              </Button>
              <Button>
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