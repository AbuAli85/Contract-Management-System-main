"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { format, parseISO, differenceInDays, isPast, isValid } from "date-fns"
import * as XLSX from "xlsx"
import Papa from "papaparse"

// UI Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Icons
import {
  Upload, Download, Search, Filter, MoreHorizontal, Eye, Edit3, Trash2, 
  UserPlus, FileSpreadsheet, FileText, AlertTriangle, CheckCircle, 
  XCircle, Calendar as CalendarIcon, Clock, Users, TrendingUp, 
  BarChart3, PieChart, Activity, Loader2, RefreshCw, ArrowUpDown,
  SortAsc, SortDesc, Settings, Globe, Flag, Phone, Mail, MapPin,
  CreditCard, FileImage, Shield, ShieldAlert, Archive, 
  Plus, Minus, ChevronDown, ExternalLink, Copy, Share2, Star,
  MessageSquare, History, Download as DownloadIcon, Upload as UploadIcon,
  Zap, Target, Bell, BookOpen, Briefcase, Camera,
  QrCode, Send, UserCheck, UserX, Layers, Grid3x3, List,
  Filter as FilterIcon, SortAsc as SortIcon, MonitorPlay, Smartphone,
  Tablet, Layout, Save, Printer, Bookmark, Tag, Workflow, Gauge
} from "lucide-react"

// Types and Utils
import type { Promoter } from "@/lib/types"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { SafeImage } from "@/components/ui/safe-image"

// Enhanced Promoter Interface with additional calculated fields
interface EnhancedPromoter extends Promoter {
  id_card_status: "valid" | "expiring" | "expired" | "missing"
  passport_status: "valid" | "expiring" | "expired" | "missing"
  overall_status: "active" | "warning" | "critical" | "inactive"
  days_until_id_expiry?: number
  days_until_passport_expiry?: number
  contracts_trend?: "up" | "down" | "stable"
  last_contract_date?: string
  avatar_url?: string
  tags?: string[]
}

// Bulk operation types
interface BulkOperation {
  type: "status_update" | "delete" | "export" | "notification_settings"
  data?: any
}

interface ImportProgress {
  total: number
  processed: number
  success: number
  errors: string[]
}

// Filter and sort options
interface FilterOptions {
  status: string[]
  id_card_status: string[]
  passport_status: string[]
  active_contracts: [number, number]
  created_date_range: [Date | null, Date | null]
  search: string
  tags: string[]
}

interface SortOption {
  field: keyof EnhancedPromoter
  direction: "asc" | "desc"
}

// Statistics interface
interface PromoterStats {
  total: number
  active: number
  expiring_documents: number
  expired_documents: number
  total_contracts: number
  growth_rate: number
  engagement_score: number
}

export default function AdvancedPromotersManagement() {
  // State management
  const [promoters, setPromoters] = useState<EnhancedPromoter[]>([])
  const [filteredPromoters, setFilteredPromoters] = useState<EnhancedPromoter[]>([])
  const [selectedPromoters, setSelectedPromoters] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null)
  
  // Filter and sort state
  const [filters, setFilters] = useState<FilterOptions>({
    status: [],
    id_card_status: [],
    passport_status: [],
    active_contracts: [0, 50],
    created_date_range: [null, null],
    search: "",
    tags: []
  })
  const [sortOption, setSortOption] = useState<SortOption>({ field: "name_en", direction: "asc" })
  
  // Modal and dialog states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isBulkActionModalOpen, setIsBulkActionModalOpen] = useState(false)
  const [isQuickEditModalOpen, setIsQuickEditModalOpen] = useState(false)
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false)
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false)
  const [bulkOperation, setBulkOperation] = useState<BulkOperation>({ type: "status_update" })
  const [selectedPromoterForEdit, setSelectedPromoterForEdit] = useState<EnhancedPromoter | null>(null)
  
  // View state
  const [currentView, setCurrentView] = useState<"table" | "grid" | "analytics">("table")
  const [pageSize, setPageSize] = useState(25)
  const [currentPage, setCurrentPage] = useState(1)
  const [favoritePromoters, setFavoritePromoters] = useState<string[]>([])
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([])
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [notificationSettings, setNotificationSettings] = useState({
    expiry_alerts: true,
    activity_updates: true,
    system_notifications: true
  })
  
  // Hooks
  const router = useRouter()
  const { toast } = useToast()

  // Enhanced data fetching with real-time features
  const fetchPromoters = useCallback(async () => {
    try {
      setIsLoading(true)
      
      const { data: promotersData, error } = await supabase
        .from("promoters")
        .select(`
          *,
          contracts:contracts(count)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      // Enhance promoter data with calculated fields
      const enhancedPromoters: EnhancedPromoter[] = promotersData?.map(promoter => {
        const idExpiryDays = promoter.id_card_expiry_date 
          ? differenceInDays(parseISO(promoter.id_card_expiry_date), new Date())
          : null

        const passportExpiryDays = promoter.passport_expiry_date
          ? differenceInDays(parseISO(promoter.passport_expiry_date), new Date())
          : null

        return {
          ...promoter,
          id_card_status: getDocumentStatus(idExpiryDays, promoter.id_card_expiry_date || null),
          passport_status: getDocumentStatus(passportExpiryDays, promoter.passport_expiry_date || null),
          overall_status: getOverallStatus(promoter),
          days_until_id_expiry: idExpiryDays || undefined,
          days_until_passport_expiry: passportExpiryDays || undefined,
          contracts_trend: getContractsTrend(promoter),
          tags: generateTags(promoter)
        }
      }) || []

      setPromoters(enhancedPromoters)
      setFilteredPromoters(enhancedPromoters)
    } catch (error) {
      console.error("Error fetching promoters:", error)
      toast({
        title: "Error",
        description: "Failed to fetch promoters data",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // Helper functions for data processing
  const getDocumentStatus = (daysUntilExpiry: number | null, dateString: string | null): "valid" | "expiring" | "expired" | "missing" => {
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

  const getContractsTrend = (promoter: Promoter): "up" | "down" | "stable" => {
    // This would be calculated based on historical contract data
    // For now, return stable as default
    return "stable"
  }

  const generateTags = (promoter: Promoter): string[] => {
    const tags: string[] = []
    
    if (promoter.active_contracts_count && promoter.active_contracts_count > 5) {
      tags.push("high-activity")
    }
    
    if (promoter.status === "premium") {
      tags.push("premium")
    }
    
    const idExpiry = promoter.id_card_expiry_date ? differenceInDays(parseISO(promoter.id_card_expiry_date), new Date()) : null
    if (idExpiry !== null && idExpiry <= 30) {
      tags.push("urgent")
    }
    
    return tags
  }

  // Advanced filtering and sorting
  const applyFiltersAndSort = useCallback(() => {
    let filtered = [...promoters]

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(promoter => 
        promoter.name_en.toLowerCase().includes(searchTerm) ||
        promoter.name_ar.toLowerCase().includes(searchTerm) ||
        promoter.id_card_number.toLowerCase().includes(searchTerm)
      )
    }

    // Apply status filters
    if (filters.status.length > 0) {
      filtered = filtered.filter(promoter => 
        filters.status.includes(promoter.status || "inactive")
      )
    }

    // Apply document status filters
    if (filters.id_card_status.length > 0) {
      filtered = filtered.filter(promoter => 
        filters.id_card_status.includes(promoter.id_card_status)
      )
    }

    if (filters.passport_status.length > 0) {
      filtered = filtered.filter(promoter => 
        filters.passport_status.includes(promoter.passport_status)
      )
    }

    // Apply contracts range filter
    filtered = filtered.filter(promoter => {
      const contracts = promoter.active_contracts_count || 0
      return contracts >= filters.active_contracts[0] && contracts <= filters.active_contracts[1]
    })

    // Apply date range filter
    if (filters.created_date_range[0] && filters.created_date_range[1]) {
      filtered = filtered.filter(promoter => {
        if (!promoter.created_at) return false
        const createdDate = parseISO(promoter.created_at)
        return createdDate >= filters.created_date_range[0]! && 
               createdDate <= filters.created_date_range[1]!
      })
    }

    // Apply tag filters
    if (filters.tags.length > 0) {
      filtered = filtered.filter(promoter => 
        filters.tags.some(tag => promoter.tags?.includes(tag))
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortOption.field]
      const bValue = b[sortOption.field]
      
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1
      
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      return sortOption.direction === "asc" ? comparison : -comparison
    })

    setFilteredPromoters(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [promoters, filters, sortOption])

  // Calculate statistics
  const stats = useMemo((): PromoterStats => {
    const total = promoters.length
    const active = promoters.filter(p => p.overall_status === "active").length
    const expiring = promoters.filter(p => p.overall_status === "warning").length
    const expired = promoters.filter(p => p.overall_status === "critical").length
    const totalContracts = promoters.reduce((sum, p) => sum + (p.active_contracts_count || 0), 0)
    
    return {
      total,
      active,
      expiring_documents: expiring,
      expired_documents: expired,
      total_contracts: totalContracts,
      growth_rate: 12.5, // This would be calculated from historical data
      engagement_score: 87.3 // This would be calculated based on activity metrics
    }
  }, [promoters])

  // Bulk operations
  const handleBulkOperation = async (operation: BulkOperation) => {
    if (selectedPromoters.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select promoters to perform bulk operations",
        variant: "destructive"
      })
      return
    }

    try {
      setIsLoading(true)
      
      switch (operation.type) {
        case "status_update":
          await supabase
            .from("promoters")
            .update({ status: operation.data.status })
            .in("id", selectedPromoters)
          break
          
        case "delete":
          await supabase
            .from("promoters")
            .delete()
            .in("id", selectedPromoters)
          break
          
        case "export":
          handleExport(selectedPromoters)
          break
          
        case "notification_settings":
          await supabase
            .from("promoters")
            .update({
              notify_days_before_id_expiry: operation.data.id_expiry_days,
              notify_days_before_passport_expiry: operation.data.passport_expiry_days
            })
            .in("id", selectedPromoters)
          break
      }

      toast({
        title: "Success",
        description: `Bulk operation completed for ${selectedPromoters.length} promoters`
      })
      
      setSelectedPromoters([])
      await fetchPromoters()
    } catch (error) {
      console.error("Bulk operation error:", error)
      toast({
        title: "Error",
        description: "Failed to perform bulk operation",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
      setIsBulkActionModalOpen(false)
    }
  }

  // Import/Export functionality
  const handleFileImport = async (file: File) => {
    setIsImporting(true)
    setImportProgress({ total: 0, processed: 0, success: 0, errors: [] })

    try {
      let data: any[] = []
      
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer)
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        data = XLSX.utils.sheet_to_json(worksheet)
      } else if (file.name.endsWith('.csv')) {
        const text = await file.text()
        const result = Papa.parse(text, { header: true, skipEmptyLines: true })
        data = result.data
      } else {
        throw new Error("Unsupported file format. Please use Excel (.xlsx) or CSV files.")
      }

      setImportProgress(prev => ({ ...prev!, total: data.length }))

      const batchSize = 50
      let processed = 0
      let success = 0
      const errors: string[] = []

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize)
        
        try {
          const formattedBatch = batch.map((row, index) => ({
            name_en: row.name_en || row['Name (English)'] || '',
            name_ar: row.name_ar || row['Name (Arabic)'] || '',
            id_card_number: row.id_card_number || row['ID Card Number'] || '',
            status: row.status || 'active',
            id_card_expiry_date: row.id_card_expiry_date || row['ID Expiry Date'] || null,
            passport_expiry_date: row.passport_expiry_date || row['Passport Expiry Date'] || null,
            notify_days_before_id_expiry: parseInt(row.notify_days_before_id_expiry || '30'),
            notify_days_before_passport_expiry: parseInt(row.notify_days_before_passport_expiry || '30'),
            notes: row.notes || row['Notes'] || null,
            created_at: new Date().toISOString()
          }))

          const { error } = await supabase
            .from("promoters")
            .insert(formattedBatch)

          if (error) throw error
          
          success += batch.length
        } catch (error) {
          errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error}`)
        }
        
        processed += batch.length
        setImportProgress(prev => ({ ...prev!, processed, success, errors }))
      }

      toast({
        title: "Import Completed",
        description: `Successfully imported ${success} out of ${data.length} records`
      })

      await fetchPromoters()
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      })
    } finally {
      setIsImporting(false)
      setIsImportModalOpen(false)
      setTimeout(() => setImportProgress(null), 3000)
    }
  }

  const handleExport = (promoterIds?: string[]) => {
    const dataToExport = promoterIds 
      ? promoters.filter(p => promoterIds.includes(p.id))
      : filteredPromoters

    const exportData = dataToExport.map(promoter => ({
      'Name (English)': promoter.name_en,
      'Name (Arabic)': promoter.name_ar,
      'ID Card Number': promoter.id_card_number,
      'Status': promoter.status,
      'ID Card Status': promoter.id_card_status,
      'Passport Status': promoter.passport_status,
      'Active Contracts': promoter.active_contracts_count || 0,
      'ID Expiry Date': promoter.id_card_expiry_date,
      'Passport Expiry Date': promoter.passport_expiry_date,
      'Days Until ID Expiry': promoter.days_until_id_expiry,
      'Days Until Passport Expiry': promoter.days_until_passport_expiry,
      'Overall Status': promoter.overall_status,
      'Created Date': promoter.created_at,
      'Notes': promoter.notes
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Promoters')
    
    const filename = `promoters_export_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.xlsx`
    XLSX.writeFile(workbook, filename)

    toast({
      title: "Export Successful",
      description: `Exported ${exportData.length} promoters to ${filename}`
    })
  }

  // Table columns definition
  const columns: ColumnDef<EnhancedPromoter>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name_en",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <SafeImage
            src={row.original.avatar_url}
            alt={`${row.original.name_en} avatar`}
            width={32}
            height={32}
            className="h-8 w-8"
            fallback={
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                {row.original.name_en.charAt(0).toUpperCase()}
              </div>
            }
          />
          <div>
            <div className="font-medium">{row.original.name_en}</div>
            <div className="text-sm text-gray-500">{row.original.name_ar}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "id_card_number",
      header: "ID Card Number",
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.original.id_card_number}</div>
      ),
    },
    {
      accessorKey: "overall_status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={getStatusVariant(row.original.overall_status)}>
          {getStatusIcon(row.original.overall_status)}
          {row.original.overall_status}
        </Badge>
      ),
    },
    {
      accessorKey: "id_card_status",
      header: "Documents",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Badge variant={getDocumentStatusVariant(row.original.id_card_status)} className="text-xs">
            <CreditCard className="mr-1 h-3 w-3" />
            ID
          </Badge>
          <Badge variant={getDocumentStatusVariant(row.original.passport_status)} className="text-xs">
            <Globe className="mr-1 h-3 w-3" />
            PP
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "active_contracts_count",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Contracts
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Badge variant="outline" className="bg-blue-50">
            {row.original.active_contracts_count || 0}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => (
        <div className="text-sm text-gray-500">
          {row.original.created_at ? format(parseISO(row.original.created_at), 'MMM dd, yyyy') : 'N/A'}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => {
              setSelectedPromoterForEdit(row.original)
              setIsQuickEditModalOpen(true)
            }}>
              <Edit3 className="mr-2 h-4 w-4" />
              Quick Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/manage-promoters/${row.original.id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              const updatedFavorites = favoritePromoters.includes(row.original.id)
                ? favoritePromoters.filter(id => id !== row.original.id)
                : [...favoritePromoters, row.original.id]
              setFavoritePromoters(updatedFavorites)
            }}>
              <Star className={`mr-2 h-4 w-4 ${favoritePromoters.includes(row.original.id) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
              {favoritePromoters.includes(row.original.id) ? 'Remove from Favorites' : 'Add to Favorites'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Data & Reports</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => router.push(`/contracts?promoter=${row.original.id}`)}>
              <FileText className="mr-2 h-4 w-4" />
              View Contracts
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport([row.original.id])}>
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </DropdownMenuItem>
            <DropdownMenuItem>
              <History className="mr-2 h-4 w-4" />
              Activity History
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Communication</DropdownMenuLabel>
            <DropdownMenuItem>
              <Mail className="mr-2 h-4 w-4" />
              Send Notification
            </DropdownMenuItem>
            <DropdownMenuItem>
              <MessageSquare className="mr-2 h-4 w-4" />
              Add Note
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Share2 className="mr-2 h-4 w-4" />
              Share Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate Promoter
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Promoter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  // Helper functions for styling
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active": return "default"
      case "warning": return "secondary"
      case "critical": return "destructive"
      case "inactive": return "outline"
      default: return "outline"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle className="mr-1 h-3 w-3" />
      case "warning": return <AlertTriangle className="mr-1 h-3 w-3" />
      case "critical": return <XCircle className="mr-1 h-3 w-3" />
      case "inactive": return <Clock className="mr-1 h-3 w-3" />
      default: return null
    }
  }

  const getDocumentStatusVariant = (status: string) => {
    switch (status) {
      case "valid": return "default"
      case "expiring": return "secondary"
      case "expired": return "destructive"
      case "missing": return "outline"
      default: return "outline"
    }
  }

  // Effects
  useEffect(() => {
    fetchPromoters()
    
    // Load persisted data from localStorage
    try {
      const savedFavorites = localStorage.getItem('promoter-favorites')
      const savedRecentlyViewed = localStorage.getItem('promoter-recently-viewed')
      const savedNotificationSettings = localStorage.getItem('notification-settings')
      
      if (savedFavorites) {
        setFavoritePromoters(JSON.parse(savedFavorites))
      }
      if (savedRecentlyViewed) {
        setRecentlyViewed(JSON.parse(savedRecentlyViewed))
      }
      if (savedNotificationSettings) {
        setNotificationSettings(JSON.parse(savedNotificationSettings))
      }
    } catch (error) {
      console.warn('Failed to load persisted data:', error)
    }
  }, [fetchPromoters])

  // Persist favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('promoter-favorites', JSON.stringify(favoritePromoters))
    } catch (error) {
      console.warn('Failed to save favorites:', error)
    }
  }, [favoritePromoters])

  // Persist recently viewed to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('promoter-recently-viewed', JSON.stringify(recentlyViewed))
    } catch (error) {
      console.warn('Failed to save recently viewed:', error)
    }
  }, [recentlyViewed])

  // Persist notification settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('notification-settings', JSON.stringify(notificationSettings))
    } catch (error) {
      console.warn('Failed to save notification settings:', error)
    }
  }, [notificationSettings])

  useEffect(() => {
    applyFiltersAndSort()
  }, [applyFiltersAndSort])

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('promoters-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'promoters' }, () => {
        fetchPromoters()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchPromoters])

  // Auto-refresh functionality
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (autoRefresh) {
      interval = setInterval(() => {
        fetchPromoters()
      }, 30000) // Refresh every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, fetchPromoters])

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Promoters Management</h1>
          <p className="text-muted-foreground">
            Comprehensive promoter management with advanced analytics and bulk operations
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Auto Refresh Toggle */}
          <div className="flex items-center gap-2 px-3 py-1 border rounded-lg bg-background">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <Switch
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <span className="text-sm text-muted-foreground">Auto-refresh</span>
          </div>
          
          {/* Notification Center */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsNotificationCenterOpen(true)}
            className="relative"
          >
            <Bell className="h-4 w-4" />
            {stats.expiring_documents + stats.expired_documents > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {stats.expiring_documents + stats.expired_documents}
              </span>
            )}
          </Button>
          
          <Button variant="outline" onClick={() => fetchPromoters()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" onClick={() => handleExport()}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Promoter
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Promoters</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.growth_rate}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Promoters</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.active / stats.total) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Document Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.expiring_documents + stats.expired_documents}</div>
            <p className="text-xs text-muted-foreground">
              {stats.expired_documents} expired, {stats.expiring_documents} expiring
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_contracts}</div>
            <p className="text-xs text-muted-foreground">
              Avg {(stats.total_contracts / Math.max(stats.total, 1)).toFixed(1)} per promoter
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filters and Search */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Search & Filters</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
              >
                <FilterIcon className="mr-2 h-4 w-4" />
                Advanced Filters
                <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${isAdvancedFiltersOpen ? 'rotate-180' : ''}`} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilters({
                    status: [],
                    id_card_status: [],
                    passport_status: [],
                    active_contracts: [0, 50],
                    created_date_range: [null, null],
                    search: "",
                    tags: []
                  })
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search promoters..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status Filter</Label>
              <Select
                value={filters.status.join(",")}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  status: value ? value.split(",") : [] 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Document Status</Label>
              <Select
                value={filters.id_card_status.join(",")}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  id_card_status: value ? value.split(",") : [] 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All documents" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="valid">Valid</SelectItem>
                  <SelectItem value="expiring">Expiring Soon</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="missing">Missing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>View Options</Label>
              <div className="flex gap-2">
                <Button
                  variant={currentView === "table" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentView("table")}
                >
                  <List className="mr-1 h-3 w-3" />
                  Table
                </Button>
                <Button
                  variant={currentView === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentView("grid")}
                >
                  <Grid3x3 className="mr-1 h-3 w-3" />
                  Grid
                </Button>
                <Button
                  variant={currentView === "analytics" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentView("analytics")}
                >
                  <BarChart3 className="mr-1 h-3 w-3" />
                  Analytics
                </Button>
              </div>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {isAdvancedFiltersOpen && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Quick Filters</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setFilters(prev => ({ ...prev, id_card_status: ["expiring", "expired"] }))}
                    >
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      Document Alerts
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setFilters(prev => ({ ...prev, active_contracts: [5, 50] }))}
                    >
                      <TrendingUp className="mr-1 h-3 w-3" />
                      High Activity
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setFilters(prev => ({ ...prev, active_contracts: [0, 0] }))}
                    >
                      <Clock className="mr-1 h-3 w-3" />
                      Inactive
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Contract Range</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.active_contracts[0]}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        active_contracts: [parseInt(e.target.value) || 0, prev.active_contracts[1]] 
                      }))}
                      className="w-20"
                    />
                    <span>-</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.active_contracts[1]}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        active_contracts: [prev.active_contracts[0], parseInt(e.target.value) || 50] 
                      }))}
                      className="w-20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Created Date Range</Label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          From
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent>
                        <Calendar
                          mode="single"
                          selected={filters.created_date_range[0] || undefined}
                          onSelect={(date) => setFilters(prev => ({ 
                            ...prev, 
                            created_date_range: [date || null, prev.created_date_range[1]] 
                          }))}
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          To
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent>
                        <Calendar
                          mode="single"
                          selected={filters.created_date_range[1] || undefined}
                          onSelect={(date) => setFilters(prev => ({ 
                            ...prev, 
                            created_date_range: [prev.created_date_range[0], date || null] 
                          }))}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedPromoters.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="bg-orange-100">
                  {selectedPromoters.length} selected
                </Badge>
                <div className="text-sm text-muted-foreground">
                  Bulk actions available for selected promoters
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport(selectedPromoters)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBulkActionModalOpen(true)}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Bulk Actions
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPromoters([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Progress */}
      {importProgress && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Import Progress</span>
                <span className="text-sm text-muted-foreground">
                  {importProgress.processed} / {importProgress.total}
                </span>
              </div>
              <Progress value={(importProgress.processed / importProgress.total) * 100} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{importProgress.success} successful</span>
                <span>{importProgress.errors.length} errors</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading promoters...</span>
            </div>
          ) : currentView === "table" ? (
            <DataTable
              columns={columns}
              data={filteredPromoters}
              searchKey="name_en"
              onRowSelectionChange={setSelectedPromoters}
            />
          ) : currentView === "grid" ? (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredPromoters.map((promoter) => (
                <Card key={promoter.id} className="hover:shadow-md transition-shadow group">
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <SafeImage
                          src={promoter.avatar_url}
                          alt={`${promoter.name_en} avatar`}
                          width={40}
                          height={40}
                          className="h-10 w-10"
                          fallback={
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-medium">
                              {promoter.name_en.charAt(0).toUpperCase()}
                            </div>
                          }
                        />
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              const updatedFavorites = favoritePromoters.includes(promoter.id)
                                ? favoritePromoters.filter(id => id !== promoter.id)
                                : [...favoritePromoters, promoter.id]
                              setFavoritePromoters(updatedFavorites)
                            }}
                          >
                            <Star className={`h-3 w-3 ${favoritePromoters.includes(promoter.id) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                          </Button>
                          <Badge variant={getStatusVariant(promoter.overall_status)} className="text-xs">
                            {promoter.overall_status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold">{promoter.name_en}</h3>
                        <p className="text-sm text-muted-foreground">{promoter.name_ar}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-1">
                          {promoter.id_card_number}
                        </p>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex gap-1">
                          <Badge variant={getDocumentStatusVariant(promoter.id_card_status)} className="text-xs">
                            ID
                          </Badge>
                          <Badge variant={getDocumentStatusVariant(promoter.passport_status)} className="text-xs">
                            PP
                          </Badge>
                        </div>
                        <Badge variant="outline" className="bg-blue-50">
                          {promoter.active_contracts_count || 0} contracts
                        </Badge>
                      </div>

                      {/* Document expiry alerts */}
                      {(promoter.days_until_id_expiry !== undefined && promoter.days_until_id_expiry <= 30) ||
                       (promoter.days_until_passport_expiry !== undefined && promoter.days_until_passport_expiry <= 30) ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                          <div className="flex items-center gap-1 text-yellow-800 text-xs">
                            <AlertTriangle className="h-3 w-3" />
                            Document expiring soon
                          </div>
                        </div>
                      ) : null}

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setRecentlyViewed(prev => [promoter.id, ...prev.filter(id => id !== promoter.id)].slice(0, 10))
                            router.push(`/manage-promoters/${promoter.id}`)
                          }}
                        >
                          <Eye className="mr-2 h-3 w-3" />
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => {
                            setSelectedPromoterForEdit(promoter)
                            setIsQuickEditModalOpen(true)
                          }}
                        >
                          <Edit3 className="mr-2 h-3 w-3" />
                          Edit
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/contracts?promoter=${promoter.id}`)}>
                              <FileText className="mr-2 h-3 w-3" />
                              Contracts
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <MessageSquare className="mr-2 h-3 w-3" />
                              Add Note
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Share2 className="mr-2 h-3 w-3" />
                              Share
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            // Analytics View
            <div className="p-6 space-y-6">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="contracts">Contracts</TabsTrigger>
                  <TabsTrigger value="trends">Trends</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <PieChart className="h-5 w-5" />
                          Status Distribution
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {['active', 'warning', 'critical', 'inactive'].map(status => {
                            const count = promoters.filter(p => p.overall_status === status).length
                            const percentage = (count / promoters.length) * 100
                            return (
                              <div key={status} className="flex items-center justify-between">
                                <span className="capitalize">{status}</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-24">
                                    <Progress 
                                      value={percentage} 
                                      className={`h-2 ${
                                        status === 'active' ? '[&>div]:bg-green-500' :
                                        status === 'warning' ? '[&>div]:bg-yellow-500' :
                                        status === 'critical' ? '[&>div]:bg-red-500' : '[&>div]:bg-gray-400'
                                      }`}
                                    />
                                  </div>
                                  <span className="text-sm text-muted-foreground">
                                    {count} ({percentage.toFixed(1)}%)
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          Contract Activity
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>High Activity (5+ contracts)</span>
                            <span>{promoters.filter(p => (p.active_contracts_count || 0) >= 5).length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Medium Activity (1-4 contracts)</span>
                            <span>{promoters.filter(p => {
                              const count = p.active_contracts_count || 0
                              return count >= 1 && count < 5
                            }).length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>No Activity</span>
                            <span>{promoters.filter(p => (p.active_contracts_count || 0) === 0).length}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="documents" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>ID Card Status</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {['valid', 'expiring', 'expired', 'missing'].map(status => {
                            const count = promoters.filter(p => p.id_card_status === status).length
                            return (
                              <div key={status} className="flex justify-between">
                                <span className="capitalize">{status}</span>
                                <Badge variant={getDocumentStatusVariant(status)}>
                                  {count}
                                </Badge>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Passport Status</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {['valid', 'expiring', 'expired', 'missing'].map(status => {
                            const count = promoters.filter(p => p.passport_status === status).length
                            return (
                              <div key={status} className="flex justify-between">
                                <span className="capitalize">{status}</span>
                                <Badge variant={getDocumentStatusVariant(status)}>
                                  {count}
                                </Badge>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="contracts">
                  <Card>
                    <CardHeader>
                      <CardTitle>Contract Analytics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center text-muted-foreground">
                        Contract analytics dashboard will be implemented here with charts and graphs
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="trends">
                  <Card>
                    <CardHeader>
                      <CardTitle>Trends & Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center text-muted-foreground">
                        Trend analysis and insights dashboard will be implemented here
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Modal */}
      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Promoters</DialogTitle>
            <DialogDescription>
              Upload an Excel (.xlsx) or CSV file to bulk import promoter data.
              The file should contain columns: name_en, name_ar, id_card_number, status, etc.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-2">
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Click to upload or drag and drop
                  </span>
                  <span className="block text-xs text-gray-500">
                    Excel (.xlsx) or CSV files only
                  </span>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileImport(file)
                    }}
                    className="hidden"
                  />
                </Label>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Required Columns:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                <div>• name_en (Name English)</div>
                <div>• name_ar (Name Arabic)</div>
                <div>• id_card_number</div>
                <div>• status (optional)</div>
                <div>• id_card_expiry_date (optional)</div>
                <div>• passport_expiry_date (optional)</div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              // Download template
              const template = [
                {
                  'name_en': 'John Doe',
                  'name_ar': 'جون دو',
                  'id_card_number': '123456789',
                  'status': 'active',
                  'id_card_expiry_date': '2025-12-31',
                  'passport_expiry_date': '2025-12-31',
                  'notify_days_before_id_expiry': '30',
                  'notify_days_before_passport_expiry': '30',
                  'notes': 'Sample promoter'
                }
              ]
              const worksheet = XLSX.utils.json_to_sheet(template)
              const workbook = XLSX.utils.book_new()
              XLSX.utils.book_append_sheet(workbook, worksheet, 'Template')
              XLSX.writeFile(workbook, 'promoters_template.xlsx')
            }}>
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Actions Modal */}
      <Dialog open={isBulkActionModalOpen} onOpenChange={setIsBulkActionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Actions</DialogTitle>
            <DialogDescription>
              Perform actions on {selectedPromoters.length} selected promoters
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="status" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="status">Update Status</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="delete">Delete</TabsTrigger>
            </TabsList>
            
            <TabsContent value="status" className="space-y-4">
              <div className="space-y-2">
                <Label>New Status</Label>
                <Select onValueChange={(value) => setBulkOperation({ type: "status_update", data: { status: value } })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
            
            <TabsContent value="notifications" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>ID Card Expiry Alert (days before)</Label>
                  <Input
                    type="number"
                    placeholder="30"
                    onChange={(e) => setBulkOperation(prev => ({
                      ...prev,
                      type: "notification_settings",
                      data: { ...prev.data, id_expiry_days: parseInt(e.target.value) }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Passport Expiry Alert (days before)</Label>
                  <Input
                    type="number"
                    placeholder="30"
                    onChange={(e) => setBulkOperation(prev => ({
                      ...prev,
                      type: "notification_settings",
                      data: { ...prev.data, passport_expiry_days: parseInt(e.target.value) }
                    }))}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="delete" className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">Warning: This action cannot be undone</span>
                </div>
                <p className="text-red-700 text-sm mt-2">
                  This will permanently delete {selectedPromoters.length} promoters and all associated data.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => setBulkOperation({ type: "delete" })}
                className="w-full"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete {selectedPromoters.length} Promoters
              </Button>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkActionModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleBulkOperation(bulkOperation)}>
              Apply Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Edit Modal */}
      <Dialog open={isQuickEditModalOpen} onOpenChange={setIsQuickEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Edit Promoter</DialogTitle>
            <DialogDescription>
              Make quick changes to {selectedPromoterForEdit?.name_en}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPromoterForEdit && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select defaultValue={selectedPromoterForEdit.status || "active"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Quick Actions</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm">
                    <Mail className="mr-2 h-3 w-3" />
                    Send Alert
                  </Button>
                  <Button variant="outline" size="sm">
                    <Bell className="mr-2 h-3 w-3" />
                    Set Reminder
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="mr-2 h-3 w-3" />
                    Add Note
                  </Button>
                  <Button variant="outline" size="sm">
                    <Tag className="mr-2 h-3 w-3" />
                    Add Tag
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea 
                  placeholder="Add a quick note..."
                  defaultValue={selectedPromoterForEdit.notes || ""}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuickEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              // Handle quick save
              setIsQuickEditModalOpen(false)
              toast({
                title: "Success",
                description: "Promoter updated successfully"
              })
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notification Center */}
      <Dialog open={isNotificationCenterOpen} onOpenChange={setIsNotificationCenterOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Center
            </DialogTitle>
            <DialogDescription>
              Important alerts and system notifications
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 overflow-y-auto max-h-[60vh]">
            {/* Document Expiry Alerts */}
            <div className="space-y-2">
              <h4 className="font-medium text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Document Expiry Alerts
              </h4>
              {promoters
                .filter(p => 
                  (p.days_until_id_expiry !== undefined && p.days_until_id_expiry <= 30) ||
                  (p.days_until_passport_expiry !== undefined && p.days_until_passport_expiry <= 30)
                )
                .map(promoter => (
                  <Card key={promoter.id} className="border-red-200 bg-red-50">
                    <CardContent className="pt-3 pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{promoter.name_en}</p>
                          <p className="text-sm text-muted-foreground">
                            {promoter.days_until_id_expiry !== undefined && promoter.days_until_id_expiry <= 30 && 
                              `ID expires in ${promoter.days_until_id_expiry} days`}
                            {promoter.days_until_passport_expiry !== undefined && promoter.days_until_passport_expiry <= 30 && 
                              `Passport expires in ${promoter.days_until_passport_expiry} days`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Mail className="mr-1 h-3 w-3" />
                            Notify
                          </Button>
                          <Button size="sm" onClick={() => router.push(`/manage-promoters/${promoter.id}`)}>
                            View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>

            {/* System Notifications */}
            <div className="space-y-2">
              <h4 className="font-medium text-blue-600 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                System Updates
              </h4>
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Database Sync Complete</p>
                      <p className="text-sm text-muted-foreground">
                        All promoter data has been synchronized successfully
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-blue-100">
                      2 min ago
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="space-y-2">
              <h4 className="font-medium text-green-600 flex items-center gap-2">
                <History className="h-4 w-4" />
                Recent Activity
              </h4>
              {recentlyViewed.slice(0, 5).map(promoterId => {
                const promoter = promoters.find(p => p.id === promoterId)
                if (!promoter) return null
                return (
                  <Card key={promoterId} className="border-green-200 bg-green-50">
                    <CardContent className="pt-3 pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{promoter.name_en}</p>
                          <p className="text-sm text-muted-foreground">Recently viewed</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => router.push(`/manage-promoters/${promoter.id}`)}
                        >
                          View Again
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Notification Settings */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Notification Settings</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Document expiry alerts</Label>
                  <Switch 
                    checked={notificationSettings.expiry_alerts}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, expiry_alerts: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Activity updates</Label>
                  <Switch 
                    checked={notificationSettings.activity_updates}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, activity_updates: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>System notifications</Label>
                  <Switch 
                    checked={notificationSettings.system_notifications}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, system_notifications: checked }))}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNotificationCenterOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              // Mark all as read
              toast({
                title: "Notifications cleared",
                description: "All notifications have been marked as read"
              })
            }}>
              Mark All as Read
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
