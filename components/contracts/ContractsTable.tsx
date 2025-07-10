'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  ExternalLink
} from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
  
  // Party A (Client) - Direct fields
  first_party_name_en?: string
  first_party_name_ar?: string
  first_party_crn?: string
  first_party_logo_url?: string
  
  // Party B (Employer) - Direct fields
  second_party_name_en?: string
  second_party_name_ar?: string
  second_party_crn?: string
  
  // Promoter - Direct fields
  promoter_name_en?: string
  promoter_name_ar?: string
  email?: string
  id_card_number?: string
  promoter_id_card_url?: string
  promoter_passport_url?: string
  
  // Additional fields
  notify_days_before_contract_expiry?: number
  promo_ref?: string
  extra_field?: string
}

interface DashboardStats {
  total: number
  active: number
  pending: number
  generated: number
  draft: number
  expired: number
}

export default function ContractsTable() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isGenerating, setIsGenerating] = useState<string | null>(null)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    active: 0,
    pending: 0,
    generated: 0,
    draft: 0,
    expired: 0
  })

  useEffect(() => {
    debugDatabaseContent()
    fetchContracts()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [contracts, searchTerm, statusFilter])

  const fetchContracts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Fetching contracts using simple query...')
      
      // Use a simple query to get contracts first
      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false })

      if (contractsError) {
        console.error('❌ Contracts fetch error:', contractsError)
        throw contractsError
      }

      console.log('📄 Contracts from simple query:', contractsData)

      if (!contractsData || contractsData.length === 0) {
        console.log('📭 No contracts found')
        setContracts([])
        setFilteredContracts([])
        return
      }

      console.log('✅ First contract sample:', contractsData[0])
      setContracts(contractsData)
      
      // Calculate statistics
      const statsData: DashboardStats = {
        total: contractsData.length,
        active: contractsData.filter(c => c.status === 'active').length,
        pending: contractsData.filter(c => c.status === 'pending').length,
        generated: contractsData.filter(c => c.status === 'generated').length,
        draft: contractsData.filter(c => c.status === 'draft').length,
        expired: contractsData.filter(c => c.status === 'expired').length,
      }
      setStats(statsData)
      
    } catch (err) {
      console.error('❌ Error fetching contracts:', err)
      setError('Failed to load contracts. Please check your database connection.')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = contracts

    if (searchTerm) {
      filtered = filtered.filter(contract =>
        contract.contract_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.first_party_name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.second_party_name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.promoter_name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.work_location?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(contract => contract.status === statusFilter)
    }

    setFilteredContracts(filtered)
  }

  const generateContract = async (contractNumber: string) => {
    try {
      setIsGenerating(contractNumber)
      console.log('🚀 Generating contract:', contractNumber)
      
      const response = await fetch('/api/webhook/makecom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contract_number: contractNumber }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to trigger contract generation')
      }

      const data = await response.json()
      console.log('✅ Contract generation triggered:', data)
      
      // Update contract status to pending
      const { error: updateError } = await supabase
        .from('contracts')
        .update({ status: 'pending', updated_at: new Date().toISOString() })
        .eq('contract_number', contractNumber)

      if (updateError) {
        console.error('❌ Error updating contract status:', updateError)
      }
      
      // Refresh contracts
      await fetchContracts()
      
    } catch (err) {
      console.error('❌ Error generating contract:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate contract')
    } finally {
      setIsGenerating(null)
    }
  }

  const duplicateContract = async (contract: Contract) => {
    try {
      // Create a new contract with similar data but new number
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
        is_current: true
      }

      const { error } = await supabase
        .from('contracts')
        .insert(newContract)

      if (error) throw error
      
      await fetchContracts()
      console.log('✅ Contract duplicated successfully')
      
    } catch (err) {
      console.error('❌ Error duplicating contract:', err)
      setError('Failed to duplicate contract')
    }
  }

  const archiveContract = async (contractId: string) => {
    try {
      const { error } = await supabase
        .from('contracts')
        .update({ is_current: false, updated_at: new Date().toISOString() })
        .eq('id', contractId)

      if (error) throw error
      
      await fetchContracts()
      console.log('✅ Contract archived successfully')
      
    } catch (err) {
      console.error('❌ Error archiving contract:', err)
      setError('Failed to archive contract')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: 'secondary' as const, label: 'Draft', icon: Edit },
      pending: { variant: 'default' as const, label: 'Pending', icon: Clock },
      generated: { variant: 'default' as const, label: 'Generated', icon: FileText },
      active: { variant: 'default' as const, label: 'Active', icon: CheckCircle2 },
      expired: { variant: 'destructive' as const, label: 'Expired', icon: AlertCircle },
      'soon-to-expire': { variant: 'destructive' as const, label: 'Soon to Expire', icon: AlertCircle }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { variant: 'secondary' as const, label: status || 'Unknown', icon: AlertCircle }

    const IconComponent = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
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
    return new Intl.NumberFormat('en-OM', {
      style: 'currency',
      currency: 'OMR'
    }).format(value)
  }

  // Add this temporary debug function to your ContractsTable component
  const debugDatabaseContent = async () => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .limit(1)

      console.log('🔍 Raw database data:', data)
      console.log('❌ Database error:', error)
      
      if (data && data.length > 0) {
        const contract = data[0]
        console.log('📋 Sample contract fields:')
        console.log('  - contract_number:', contract.contract_number)
        console.log('  - first_party_name_en:', contract.first_party_name_en)
        console.log('  - second_party_name_en:', contract.second_party_name_en)
        console.log('  - promoter_name_en:', contract.promoter_name_en)
        console.log('  - contract_start_date:', contract.contract_start_date)
        console.log('  - contract_end_date:', contract.contract_end_date)
        console.log('  - status:', contract.status)
        console.log('  - All fields:', Object.keys(contract))
      }
    } catch (err) {
      console.error('💥 Debug error:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading contracts...</p>
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
            View, manage, and track all your contracts in real-time. 
            <span className="font-medium text-primary ml-2">Party A = Client, Party B = Employer</span>
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={fetchContracts}>
            <RefreshCw className="mr-2 h-4 w-4" />
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Generated</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.generated}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <Edit className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, parties, promoter, job title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="generated">Generated</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="soon-to-expire">Soon to Expire</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                }}
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
              All Contracts ({filteredContracts.length})
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
                <div className="mt-4 space-y-2">
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
                    <TableHead>Party A (Client)</TableHead>
                    <TableHead>Party B (Employer)</TableHead>
                    <TableHead>Promoter</TableHead>
                    <TableHead>Job Details</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>PDF</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                
                <TableBody>
                  {filteredContracts.slice(0, 1).map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell colSpan={9}>
                        <div className="p-4 bg-gray-100 text-xs">
                          <h4 className="font-bold mb-2">🔍 DEBUG: Raw Contract Data</h4>
                          <pre>{JSON.stringify(contract, null, 2)}</pre>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Your regular rows */}
                  {filteredContracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">
                        <div className="space-y-1">
                          <div>{contract.contract_number || 'N/A'}</div>
                          {contract.contract_value && (
                            <div className="text-xs text-green-600 font-medium">
                              {formatCurrency(contract.contract_value)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>ALL POSSIBLE NAMES:</div>
                          <div>first_party_name_en: {String(contract.first_party_name_en)}</div>
                          <div>first_party_name_ar: {String(contract.first_party_name_ar)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>second_party_name_en: {String(contract.second_party_name_en)}</div>
                          <div>second_party_name_ar: {String(contract.second_party_name_ar)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>promoter_name_en: {String(contract.promoter_name_en)}</div>
                          <div>promoter_name_ar: {String(contract.promoter_name_ar)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-sm">
                            {contract.job_title || 'N/A'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            📍 {contract.work_location || 'N/A'}
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
                            Available
                          </Badge>
                        ) : (
                          <Badge variant="secondary">N/A</Badge>
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
                            
                            <DropdownMenuItem onClick={() => duplicateContract(contract)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
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
                                  >
                                    Archive
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
                Complete contract information with updated party roles (Party A = Client, Party B = Employer)
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
                    <p className="text-sm">{selectedContract.contract_number}</p>
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
                    <Label className="text-sm font-medium">Promo Reference</Label>
                    <p className="text-sm">{selectedContract.promo_ref || 'N/A'}</p>
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
                        Party A (Client)
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
                        Party B (Employer)
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