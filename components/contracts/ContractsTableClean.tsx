"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
} from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { 
  FileText, 
  Download, 
  Eye, 
  Plus, 
  MoreHorizontal,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Edit,
  Building2,
  Users,
  Calendar,
  DollarSign,
  Copy,
  Trash2,
  ExternalLink,
  Filter,
  TrendingUp,
  AlertTriangle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { LoadingSpinner, ContractCardSkeleton } from '@/components/ui/skeletons'

interface Contract {
  id: string
  contract_number: string
  status: string
  contract_start_date: string
  contract_end_date: string
  contract_value?: number
  job_title?: string
  work_location?: string
  pdf_url?: string
  is_current?: boolean
  created_at: string
  updated_at: string
  
  // Party information
  first_party_name_en?: string
  first_party_name_ar?: string
  first_party_crn?: string
  second_party_name_en?: string
  second_party_name_ar?: string
  second_party_crn?: string
  
  // Promoter information
  promoter_name_en?: string
  promoter_name_ar?: string
  email?: string
  id_card_number?: string
  
  // Additional fields
  notify_days_before_contract_expiry?: number
}

interface DashboardStats {
  total: number
  active: number
  pending: number
  generated: number
  draft: number
  expired: number
  expiringSoon: number
}

type ContractStatus = 'all' | 'draft' | 'pending' | 'generated' | 'active' | 'expired' | 'soon-to-expire'

export default function ContractsTableClean() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const { toast } = useToast()
  
  const [contracts, setContracts] = useState<Contract[]>([])
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<ContractStatus>('all')
  const [isGenerating, setIsGenerating] = useState<string | null>(null)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    active: 0,
    pending: 0,
    generated: 0,
    draft: 0,
    expired: 0,
    expiringSoon: 0
  })

  useEffect(() => {
    if (isAuthenticated) {
      fetchContracts()
    }
  }, [isAuthenticated])

  useEffect(() => {
    applyFilters()
  }, [contracts, searchTerm, statusFilter])

  const fetchContracts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select('*')
        .eq('is_current', true)
        .order('created_at', { ascending: false })

      if (contractsError) {
        throw new Error(`Failed to fetch contracts: ${contractsError.message}`)
      }

      const enhancedContracts = (contractsData || []).map(contract => ({
        ...contract,
        status: determineContractStatus(contract)
      }))

      setContracts(enhancedContracts)
      calculateStats(enhancedContracts)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load contracts'
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

  const determineContractStatus = (contract: Contract): string => {
    if (contract.status) return contract.status
    
    const now = new Date()
    const startDate = new Date(contract.contract_start_date)
    const endDate = new Date(contract.contract_end_date)
    const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (endDate < now) return 'expired'
    if (daysUntilExpiry <= 30) return 'soon-to-expire'
    if (startDate <= now && endDate > now) return 'active'
    if (contract.pdf_url) return 'generated'
    
    return 'draft'
  }

  const calculateStats = (contractsData: Contract[]) => {
    const statsData: DashboardStats = {
      total: contractsData.length,
      active: contractsData.filter(c => c.status === 'active').length,
      pending: contractsData.filter(c => c.status === 'pending').length,
      generated: contractsData.filter(c => c.status === 'generated').length,
      draft: contractsData.filter(c => c.status === 'draft').length,
      expired: contractsData.filter(c => c.status === 'expired').length,
      expiringSoon: contractsData.filter(c => c.status === 'soon-to-expire').length,
    }
    setStats(statsData)
  }

  const applyFilters = () => {
    let filtered = contracts

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(contract =>
        contract.contract_number?.toLowerCase().includes(searchLower) ||
        contract.first_party_name_en?.toLowerCase().includes(searchLower) ||
        contract.second_party_name_en?.toLowerCase().includes(searchLower) ||
        contract.promoter_name_en?.toLowerCase().includes(searchLower) ||
        contract.job_title?.toLowerCase().includes(searchLower) ||
        contract.work_location?.toLowerCase().includes(searchLower)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(contract => contract.status === statusFilter)
    }

    setFilteredContracts(filtered)
  }

  const generateContract = async (contractNumber: string) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "Authentication required",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(contractNumber)
    try {
      const response = await fetch('/api/webhook/makecom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          contract_number: contractNumber,
          user_id: user.id
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to trigger contract generation')
      }

      // Update contract status to pending
      const { error: updateError } = await supabase
        .from('contracts')
        .update({ 
          status: 'pending', 
          updated_at: new Date().toISOString() 
        })
        .eq('contract_number', contractNumber)

      if (updateError) {
        console.warn('Error updating contract status:', updateError)
      }
      
      await fetchContracts()
      
      toast({
        title: "Success",
        description: "Contract generation started successfully",
      })
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate contract'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsGenerating(null)
    }
  }

  const duplicateContract = async (contract: Contract) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "Authentication required",
        variant: "destructive"
      })
      return
    }

    setActionLoading(contract.id)
    try {
      const timestamp = Date.now()
      const newContractNumber = `${contract.contract_number}-COPY-${timestamp}`
      
      const newContract = {
        contract_number: newContractNumber,
        first_party_name_en: contract.first_party_name_en,
        first_party_name_ar: contract.first_party_name_ar,
        first_party_crn: contract.first_party_crn,
        second_party_name_en: contract.second_party_name_en,
        second_party_name_ar: contract.second_party_name_ar,
        second_party_crn: contract.second_party_crn,
        promoter_name_en: contract.promoter_name_en,
        promoter_name_ar: contract.promoter_name_ar,
        email: contract.email,
        job_title: contract.job_title,
        work_location: contract.work_location,
        contract_start_date: contract.contract_start_date,
        contract_end_date: contract.contract_end_date,
        contract_value: contract.contract_value,
        status: 'draft',
        is_current: true,
        user_id: user.id
      }

      const { error } = await supabase
        .from('contracts')
        .insert(newContract)

      if (error) throw new Error(`Failed to duplicate contract: ${error.message}`)
      
      await fetchContracts()
      
      toast({
        title: "Success",
        description: "Contract duplicated successfully",
      })
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to duplicate contract'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const archiveContract = async (contractId: string) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "Authentication required",
        variant: "destructive"
      })
      return
    }

    setActionLoading(contractId)
    try {
      const { error } = await supabase
        .from('contracts')
        .update({ 
          is_current: false, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', contractId)

      if (error) throw new Error(`Failed to archive contract: ${error.message}`)
      
      await fetchContracts()
      
      toast({
        title: "Success",
        description: "Contract archived successfully",
      })
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to archive contract'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: 'secondary' as const, label: 'Draft', icon: Edit, color: 'bg-gray-100 text-gray-800' },
      pending: { variant: 'default' as const, label: 'Pending', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
      generated: { variant: 'default' as const, label: 'Generated', icon: FileText, color: 'bg-blue-100 text-blue-800' },
      active: { variant: 'default' as const, label: 'Active', icon: CheckCircle2, color: 'bg-green-100 text-green-800' },
      expired: { variant: 'destructive' as const, label: 'Expired', icon: AlertCircle, color: 'bg-red-100 text-red-800' },
      'soon-to-expire': { variant: 'destructive' as const, label: 'Expiring Soon', icon: AlertTriangle, color: 'bg-orange-100 text-orange-800' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { variant: 'secondary' as const, label: status || 'Unknown', icon: AlertCircle, color: 'bg-gray-100 text-gray-800' }

    const IconComponent = config.icon

    return (
      <Badge variant={config.variant} className={`flex items-center gap-1 ${config.color}`}>
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return 'N/A'
    }
  }

  const formatCurrency = (value: number) => {
    if (!value) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
  }

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
          <CardTitle>Contracts Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span>Authentication required to access contracts</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          {[...Array(6)].map((_, i) => (
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
          <h1 className="text-3xl font-bold tracking-tight">Contracts Dashboard</h1>
          <p className="text-muted-foreground">
            Manage and track all your contracts with real-time status updates and comprehensive analytics.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={fetchContracts} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Contract
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-destructive/15 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-destructive mr-2" />
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All contracts</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Being processed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Generated</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.generated}</div>
            <p className="text-xs text-muted-foreground">PDF ready</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <Edit className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
            <p className="text-xs text-muted-foreground">In preparation</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.expiringSoon}</div>
            <p className="text-xs text-muted-foreground">Next 30 days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            <p className="text-xs text-muted-foreground">Past end date</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contracts, parties, promoters, job titles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Select value={statusFilter} onValueChange={(value: ContractStatus) => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="generated">Generated</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="soon-to-expire">Expiring Soon</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Contracts ({filteredContracts.length})
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredContracts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">No contracts found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {contracts.length === 0 
                  ? "Get started by creating a new contract."
                  : "Try adjusting your filters to find what you're looking for."
                }
              </p>
              {contracts.length === 0 && (
                <div className="mt-4">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Contract
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contract ID</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Employer</TableHead>
                    <TableHead>Promoter</TableHead>
                    <TableHead>Job Details</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>PDF</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                
                <TableBody>
                  {filteredContracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">
                        <div className="space-y-1">
                          <div className="font-mono text-sm">{contract.contract_number || 'N/A'}</div>
                          {contract.contract_value && (
                            <div className="text-xs text-green-600 font-medium">
                              {formatCurrency(contract.contract_value)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-sm">
                            {contract.first_party_name_en || 'N/A'}
                          </div>
                          {contract.first_party_name_ar && (
                            <div className="text-xs text-muted-foreground">
                              {contract.first_party_name_ar}
                            </div>
                          )}
                          {contract.first_party_crn && (
                            <div className="text-xs text-muted-foreground">
                              CRN: {contract.first_party_crn}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-sm">
                            {contract.second_party_name_en || 'N/A'}
                          </div>
                          {contract.second_party_name_ar && (
                            <div className="text-xs text-muted-foreground">
                              {contract.second_party_name_ar}
                            </div>
                          )}
                          {contract.second_party_crn && (
                            <div className="text-xs text-muted-foreground">
                              CRN: {contract.second_party_crn}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-sm">
                            {contract.promoter_name_en || 'N/A'}
                          </div>
                          {contract.promoter_name_ar && (
                            <div className="text-xs text-muted-foreground">
                              {contract.promoter_name_ar}
                            </div>
                          )}
                          {contract.email && (
                            <div className="text-xs text-muted-foreground">
                              {contract.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-sm">
                            {contract.job_title || 'N/A'}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center">
                            <Building2 className="mr-1 h-3 w-3" />
                            {contract.work_location || 'N/A'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <Calendar className="mr-1 h-3 w-3" />
                            {formatDate(contract.contract_start_date)}
                          </div>
                          <div className="text-muted-foreground">
                            to {formatDate(contract.contract_end_date)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(contract.status)}</TableCell>
                      <TableCell>
                        {contract.pdf_url ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Available
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Clock className="mr-1 h-3 w-3" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            
                            {contract.pdf_url ? (
                              <>
                                <DropdownMenuItem onClick={() => window.open(contract.pdf_url, '_blank')}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => window.open(contract.pdf_url, '_blank')}>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download PDF
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => generateContract(contract.contract_number)}
                                disabled={isGenerating === contract.contract_number}
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                {isGenerating === contract.contract_number ? 'Generating...' : 'Generate PDF'}
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem onClick={() => setSelectedContract(contract)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Contract
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem 
                              onClick={() => duplicateContract(contract)}
                              disabled={actionLoading === contract.id}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              {actionLoading === contract.id ? 'Duplicating...' : 'Duplicate'}
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                                  <span className="text-destructive">Archive</span>
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Archive Contract</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to archive contract {contract.contract_number}? 
                                    This action will hide it from the main view but keep it in the database.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => archiveContract(contract.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    disabled={actionLoading === contract.id}
                                  >
                                    {actionLoading === contract.id ? 'Archiving...' : 'Archive'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contract Details Dialog */}
      {selectedContract && (
        <Dialog open={!!selectedContract} onOpenChange={() => setSelectedContract(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Contract Details: {selectedContract.contract_number}
              </DialogTitle>
              <DialogDescription>
                Complete contract information and timeline
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">General Info</TabsTrigger>
                <TabsTrigger value="parties">Parties</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Contract Number</Label>
                    <p className="text-sm font-mono">{selectedContract.contract_number}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedContract.status)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Job Title</Label>
                    <p className="text-sm">{selectedContract.job_title || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Work Location</Label>
                    <p className="text-sm">{selectedContract.work_location || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Contract Value</Label>
                    <p className="text-sm">{selectedContract.contract_value ? formatCurrency(selectedContract.contract_value) : 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">ID Card Number</Label>
                    <p className="text-sm">{selectedContract.id_card_number || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Start Date</Label>
                    <p className="text-sm">{formatDate(selectedContract.contract_start_date)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">End Date</Label>
                    <p className="text-sm">{formatDate(selectedContract.contract_end_date)}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="parties" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center">
                        <Building2 className="mr-2 h-4 w-4" />
                        Client
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <Label className="text-xs">English Name</Label>
                        <p className="text-sm font-medium">{selectedContract.first_party_name_en || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-xs">Arabic Name</Label>
                        <p className="text-sm">{selectedContract.first_party_name_ar || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-xs">CRN</Label>
                        <p className="text-sm">{selectedContract.first_party_crn || 'N/A'}</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center">
                        <Building2 className="mr-2 h-4 w-4" />
                        Employer
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <Label className="text-xs">English Name</Label>
                        <p className="text-sm font-medium">{selectedContract.second_party_name_en || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-xs">Arabic Name</Label>
                        <p className="text-sm">{selectedContract.second_party_name_ar || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-xs">CRN</Label>
                        <p className="text-sm">{selectedContract.second_party_crn || 'N/A'}</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center">
                        <Users className="mr-2 h-4 w-4" />
                        Promoter
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <Label className="text-xs">English Name</Label>
                        <p className="text-sm font-medium">{selectedContract.promoter_name_en || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-xs">Arabic Name</Label>
                        <p className="text-sm">{selectedContract.promoter_name_ar || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-xs">Email</Label>
                        <p className="text-sm">{selectedContract.email || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-xs">ID Card Number</Label>
                        <p className="text-sm">{selectedContract.id_card_number || 'N/A'}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="timeline" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Contract Created</p>
                      <p className="text-xs text-muted-foreground">{formatDate(selectedContract.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Contract Start</p>
                      <p className="text-xs text-muted-foreground">{formatDate(selectedContract.contract_start_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Contract End</p>
                      <p className="text-xs text-muted-foreground">{formatDate(selectedContract.contract_end_date)}</p>
                    </div>
                  </div>
                  {selectedContract.pdf_url && (
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">PDF Generated</p>
                        <Button variant="link" className="p-0 h-auto text-xs" onClick={() => window.open(selectedContract.pdf_url, '_blank')}>
                          <ExternalLink className="mr-1 h-3 w-3" />
                          View PDF
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedContract(null)}>
                Close
              </Button>
              {selectedContract.pdf_url && (
                <Button onClick={() => window.open(selectedContract.pdf_url, '_blank')}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open PDF
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}