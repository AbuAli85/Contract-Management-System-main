"use client"

import { useAuth } from "@/hooks/use-auth"
import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  User,
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  RefreshCw,
  ShieldCheckIcon,
  ShieldAlertIcon,
  AlertTriangleIcon,
  Upload,
  Download,
  Eye,
  Bell,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Passport,
  Camera,
  FileImage,
  ExternalLink,
  Copy,
  Filter,
  SortAsc,
  SortDesc,
  Archive,
  UserCheck,
  UserX,
  Settings,
  History,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { supabase } from "@/lib/supabase"
import { format, parseISO, differenceInDays, isPast, isValid } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

// Enhanced Promoter interface
interface Promoter {
  id: string
  name_en: string
  name_ar: string
  email: string
  phone: string
  address?: string
  national_id?: string
  crn?: string
  id_card_number: string
  id_card_expiry_date?: string
  passport_number?: string
  passport_expiry_date?: string
  id_card_url?: string
  passport_url?: string
  profile_image_url?: string
  status: "Active" | "Inactive" | "Suspended"
  created_at: string
  updated_at?: string
  notes?: string
  active_contracts_count?: number
  total_contracts_count?: number
  last_contract_date?: string
  document_status?: "valid" | "expiring" | "expired"
  notification_preferences?: {
    email: boolean
    sms: boolean
    document_expiry: boolean
    contract_updates: boolean
  }
}

interface FormData {
  name_en: string
  name_ar: string
  email: string
  phone: string
  address: string
  national_id: string
  crn: string
  id_card_number: string
  id_card_expiry_date: string
  passport_number: string
  passport_expiry_date: string
  status: "Active" | "Inactive" | "Suspended"
  notes: string
}

interface PromoterStats {
  total: number
  active: number
  inactive: number
  suspended: number
  withActiveContracts: number
  documentsExpiring: number
  documentsExpired: number
  recentlyAdded: number
  needsAttention: number
}

interface DocumentUpload {
  type: "id_card" | "passport" | "profile"
  file: File | null
  preview: string | null
  uploading: boolean
}

// Helper function to get document status
function getDocumentStatus(expiryDate?: string) {
  if (!expiryDate) {
    return {
      Icon: AlertTriangleIcon,
      text: "Missing",
      colorClass: "text-gray-500",
      bgClass: "bg-gray-100",
      tooltip: "Document expiry date not provided",
    }
  }

  const expiry = parseISO(expiryDate)
  if (!isValid(expiry)) {
    return {
      Icon: AlertTriangleIcon,
      text: "Invalid",
      colorClass: "text-gray-500",
      bgClass: "bg-gray-100",
      tooltip: "Invalid date format",
    }
  }

  const today = new Date()
  const daysUntilExpiry = differenceInDays(expiry, today)

  if (isPast(expiry)) {
    return {
      Icon: ShieldAlertIcon,
      text: "Expired",
      colorClass: "text-red-500",
      bgClass: "bg-red-100",
      tooltip: `Expired ${Math.abs(daysUntilExpiry)} days ago`,
    }
  } else if (daysUntilExpiry <= 30) {
    return {
      Icon: AlertTriangleIcon,
      text: "Expiring",
      colorClass: "text-yellow-500",
      bgClass: "bg-yellow-100",
      tooltip: `Expires in ${daysUntilExpiry} days`,
    }
  } else {
    return {
      Icon: ShieldCheckIcon,
      text: "Valid",
      colorClass: "text-green-500",
      bgClass: "bg-green-100",
      tooltip: `Expires in ${daysUntilExpiry} days`,
    }
  }
}

export function PromoterManagement() {
  const { user } = useAuth()
  const { toast } = useToast()

  // State management
  const [promoters, setPromoters] = useState<Promoter[]>([])
  const [stats, setStats] = useState<PromoterStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("name_en")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingPromoter, setEditingPromoter] = useState<Promoter | null>(null)
  const [deletePromoter, setDeletePromoter] = useState<Promoter | null>(null)
  const [selectedPromoter, setSelectedPromoter] = useState<Promoter | null>(null)
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  // Document upload state
  const [documentUploads, setDocumentUploads] = useState<{
    id_card: DocumentUpload
    passport: DocumentUpload
    profile: DocumentUpload
  }>({
    id_card: { type: "id_card", file: null, preview: null, uploading: false },
    passport: { type: "passport", file: null, preview: null, uploading: false },
    profile: { type: "profile", file: null, preview: null, uploading: false },
  })

  const [formData, setFormData] = useState<FormData>({
    name_en: "",
    name_ar: "",
    email: "",
    phone: "",
    address: "",
    national_id: "",
    crn: "",
    id_card_number: "",
    id_card_expiry_date: "",
    passport_number: "",
    passport_expiry_date: "",
    status: "Active",
    notes: "",
  })

  // Memoized filtered promoters (must come before sortedPromoters)
  const filteredPromoters = useMemo(() => {
    return promoters.filter((promoter) => {
      const matchesSearch =
        promoter.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promoter.name_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promoter.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = selectedStatus === "all" || promoter.status === selectedStatus
      return matchesSearch && matchesStatus
    })
  }, [promoters, searchTerm, selectedStatus])

  // Memoized sorted promoters (depends on filteredPromoters)
  const sortedPromoters = useMemo(() => {
    return [...filteredPromoters].sort((a, b) => {
      const aValue = a[sortBy as keyof Promoter]
      const bValue = b[sortBy as keyof Promoter]

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
      return 0
    })
  }, [filteredPromoters, sortBy, sortOrder])

  // Memoized statistics
  const memoizedStats = useMemo(() => stats, [stats])

  // Fetch promoters data
  const fetchPromotersData = useCallback(async () => {
    try {
      setLoading(true)

      const { data: promotersData, error: promotersError } = await supabase
        .from("promoters")
        .select("*")
        .order("name_en")

      if (promotersError) {
        console.error("Error fetching promoters:", promotersError)
        toast({
          title: "Error",
          description: "Failed to load promoters. Please try again.",
          variant: "destructive",
        })
        return
      }

      // Fetch contract counts for each promoter
      const promoterIds = promotersData?.map((p) => p.id) || []
      let contractsData: any[] = []

      if (promoterIds.length > 0) {
        const { data: contracts, error: contractsError } = await supabase
          .from("contracts")
          .select("promoter_id, contract_end_date, created_at")
          .in("promoter_id", promoterIds)

        if (!contractsError) {
          contractsData = contracts || []
        }
      }

      // Process promoters data
      const processedPromoters =
        promotersData?.map((promoter: any) => {
          const promoterContracts = contractsData.filter((c) => c.promoter_id === promoter.id)
          const activeContracts = promoterContracts.filter((contract: any) => {
            const endDate = new Date(contract.contract_end_date)
            return endDate >= new Date()
          })

          const lastContract = promoterContracts.sort(
            (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0]

          return {
            ...promoter,
            active_contracts_count: activeContracts.length,
            total_contracts_count: promoterContracts.length,
            last_contract_date: lastContract?.created_at || null,
          }
        }) || []

      setPromoters(processedPromoters)

      // Calculate stats
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const statsData: PromoterStats = {
        total: processedPromoters.length,
        active: processedPromoters.filter((p) => p.status === "Active").length,
        inactive: processedPromoters.filter((p) => p.status === "Inactive").length,
        suspended: processedPromoters.filter((p) => p.status === "Suspended").length,
        withActiveContracts: processedPromoters.filter((p) => (p.active_contracts_count || 0) > 0)
          .length,
        documentsExpiring: processedPromoters.filter((p) => {
          const idStatus = getDocumentStatus(p.id_card_expiry_date)
          const passportStatus = getDocumentStatus(p.passport_expiry_date)
          return idStatus.text === "Expiring" || passportStatus.text === "Expiring"
        }).length,
        documentsExpired: processedPromoters.filter((p) => {
          const idStatus = getDocumentStatus(p.id_card_expiry_date)
          const passportStatus = getDocumentStatus(p.passport_expiry_date)
          return idStatus.text === "Expired" || passportStatus.text === "Expired"
        }).length,
        recentlyAdded: processedPromoters.filter((p) => new Date(p.created_at) >= thirtyDaysAgo)
          .length,
        needsAttention: processedPromoters.filter(
          (p) => p.document_status === "expiring" || p.document_status === "expired"
        ).length,
      }

      setStats(statsData)
    } catch (error) {
      console.error("Error fetching promoters:", error)
      toast({
        title: "Error",
        description: "Failed to load promoters. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchPromotersData()
  }, [fetchPromotersData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const promoterData = {
        ...formData,
        updated_at: new Date().toISOString(),
      }

      if (editingPromoter) {
        const { error } = await supabase
          .from("promoters")
          .update(promoterData)
          .eq("id", editingPromoter.id)

        if (error) throw error

        toast({
          title: "Success",
          description: "Promoter updated successfully",
        })
      } else {
        const { error } = await supabase.from("promoters").insert([
          {
            ...promoterData,
            created_at: new Date().toISOString(),
          },
        ])

        if (error) throw error

        toast({
          title: "Success",
          description: "Promoter created successfully",
        })
      }

      setIsAddDialogOpen(false)
      setEditingPromoter(null)
      resetForm()
      fetchPromotersData()
    } catch (error) {
      console.error("Error saving promoter:", error)
      toast({
        title: "Error",
        description: "Failed to save promoter. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletePromoter) return

    try {
      const { error } = await supabase.from("promoters").delete().eq("id", deletePromoter.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Promoter deleted successfully",
      })

      setDeletePromoter(null)
      fetchPromotersData()
    } catch (error) {
      console.error("Error deleting promoter:", error)
      toast({
        title: "Error",
        description: "Failed to delete promoter. Please try again.",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name_en: "",
      name_ar: "",
      email: "",
      phone: "",
      address: "",
      national_id: "",
      crn: "",
      id_card_number: "",
      id_card_expiry_date: "",
      passport_number: "",
      passport_expiry_date: "",
      status: "Active",
      notes: "",
    })
  }

  const handleEdit = (promoter: Promoter) => {
    setEditingPromoter(promoter)
    setFormData({
      name_en: promoter.name_en,
      name_ar: promoter.name_ar,
      email: promoter.email,
      phone: promoter.phone,
      address: promoter.address || "",
      national_id: promoter.national_id || "",
      crn: promoter.crn || "",
      id_card_number: promoter.id_card_number,
      id_card_expiry_date: promoter.id_card_expiry_date || "",
      passport_number: promoter.passport_number || "",
      passport_expiry_date: promoter.passport_expiry_date || "",
      status: promoter.status,
      notes: promoter.notes || "",
    })
    setIsAddDialogOpen(true)
  }

  const handleViewDetails = (promoter: Promoter) => {
    setSelectedPromoter(promoter)
    setIsDetailsSheetOpen(true)
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("asc")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return (
          <Badge
            variant="default"
            className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
          >
            Active
          </Badge>
        )
      case "Inactive":
        return (
          <Badge
            variant="secondary"
            className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
          >
            Inactive
          </Badge>
        )
      case "Suspended":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
          >
            Suspended
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Active":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "Inactive":
        return <XCircle className="h-4 w-4 text-gray-500" />
      case "Suspended":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const handleDocumentUpload = (type: "id_card" | "passport" | "profile", file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      setDocumentUploads((prev) => ({
        ...prev,
        [type]: {
          ...prev[type],
          file,
          preview: reader.result as string,
          uploading: true,
        },
      }))
      uploadDocument(type, file)
    }
    reader.readAsDataURL(file)
  }

  const uploadDocument = async (type: "id_card" | "passport" | "profile", file: File) => {
    if (!selectedPromoter) return

    const { data, error } = await supabase.storage
      .from("promoter-documents")
      .upload(`${selectedPromoter.id}/${type}.${file.name.split(".").pop()}`, file)

    if (error) {
      console.error("Error uploading document:", error)
      toast({
        title: "Error",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      })
      setDocumentUploads((prev) => ({
        ...prev,
        [type]: {
          ...prev[type],
          uploading: false,
        },
      }))
      return
    }

    const { publicUrl } = supabase.storage.from("promoter-documents").getPublicUrl(data.path)

    const updateField = `${type}_url`
    const { error: updateError } = await supabase
      .from("promoters")
      .update({ [updateField]: publicUrl })
      .eq("id", selectedPromoter.id)

    if (updateError) {
      console.error("Error updating promoter document URL:", updateError)
      toast({
        title: "Error",
        description: "Failed to update document URL. Please try again.",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      })
      fetchPromotersData()
    }

    setDocumentUploads((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        uploading: false,
      },
    }))
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Promoter Management</h1>
            <p className="text-muted-foreground">Manage contract promoters and their information</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchPromotersData} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Promoter
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingPromoter ? "Edit Promoter" : "Add New Promoter"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name_en">English Name</Label>
                    <Input
                      id="name_en"
                      value={formData.name_en}
                      onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="name_ar">Arabic Name</Label>
                    <Input
                      id="name_ar"
                      value={formData.name_ar}
                      onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="national_id">National ID</Label>
                    <Input
                      id="national_id"
                      value={formData.national_id}
                      onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="crn">CRN</Label>
                    <Input
                      id="crn"
                      value={formData.crn}
                      onChange={(e) => setFormData({ ...formData, crn: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="id_card_number">ID Card Number</Label>
                    <Input
                      id="id_card_number"
                      value={formData.id_card_number}
                      onChange={(e) => setFormData({ ...formData, id_card_number: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="id_card_expiry_date">ID Card Expiry Date</Label>
                    <Input
                      id="id_card_expiry_date"
                      type="date"
                      value={formData.id_card_expiry_date}
                      onChange={(e) =>
                        setFormData({ ...formData, id_card_expiry_date: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="passport_number">Passport Number</Label>
                    <Input
                      id="passport_number"
                      value={formData.passport_number}
                      onChange={(e) =>
                        setFormData({ ...formData, passport_number: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="passport_expiry_date">Passport Expiry Date</Label>
                    <Input
                      id="passport_expiry_date"
                      type="date"
                      value={formData.passport_expiry_date}
                      onChange={(e) =>
                        setFormData({ ...formData, passport_expiry_date: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                        <SelectItem value="Suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {editingPromoter ? "Update" : "Create"} Promoter
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <div className="flex space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search promoters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Promoters</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{memoizedStats?.total ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{memoizedStats?.active ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
              <XCircle className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{memoizedStats?.inactive ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspended</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{memoizedStats?.suspended ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {promoters.reduce(
                  (sum, promoter) => sum + (promoter.total_contracts_count || 0),
                  0
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With Active Contracts</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{memoizedStats?.withActiveContracts ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documents Expiring</CardTitle>
              <AlertTriangleIcon className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{memoizedStats?.documentsExpiring ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documents Expired</CardTitle>
              <ShieldAlertIcon className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{memoizedStats?.documentsExpired ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recently Added</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{memoizedStats?.recentlyAdded ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
              <Bell className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{memoizedStats?.needsAttention ?? 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Promoters Table */}
        <Card>
          <CardHeader>
            <CardTitle>Promoters</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="h-12 w-12 animate-pulse rounded-full bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/4 animate-pulse rounded bg-gray-200" />
                      <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
                    </div>
                  </div>
                ))}
              </div>
            ) : sortedPromoters.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No promoters found.{" "}
                  {searchTerm || selectedStatus !== "all"
                    ? "Try adjusting your filters."
                    : "Add your first promoter to get started."}
                </AlertDescription>
              </Alert>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead onClick={() => handleSort("name_en")}>
                      Name
                      {sortBy === "name_en" &&
                        (sortOrder === "asc" ? (
                          <SortAsc className="ml-2 h-4 w-4" />
                        ) : (
                          <SortDesc className="ml-2 h-4 w-4" />
                        ))}
                    </TableHead>
                    <TableHead onClick={() => handleSort("email")}>
                      Email
                      {sortBy === "email" &&
                        (sortOrder === "asc" ? (
                          <SortAsc className="ml-2 h-4 w-4" />
                        ) : (
                          <SortDesc className="ml-2 h-4 w-4" />
                        ))}
                    </TableHead>
                    <TableHead onClick={() => handleSort("status")}>
                      Status
                      {sortBy === "status" &&
                        (sortOrder === "asc" ? (
                          <SortAsc className="ml-2 h-4 w-4" />
                        ) : (
                          <SortDesc className="ml-2 h-4 w-4" />
                        ))}
                    </TableHead>
                    <TableHead onClick={() => handleSort("active_contracts_count")}>
                      Contracts
                      {sortBy === "active_contracts_count" &&
                        (sortOrder === "asc" ? (
                          <SortAsc className="ml-2 h-4 w-4" />
                        ) : (
                          <SortDesc className="ml-2 h-4 w-4" />
                        ))}
                    </TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead onClick={() => handleSort("created_at")}>
                      Created
                      {sortBy === "created_at" &&
                        (sortOrder === "asc" ? (
                          <SortAsc className="ml-2 h-4 w-4" />
                        ) : (
                          <SortDesc className="ml-2 h-4 w-4" />
                        ))}
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPromoters.map((promoter) => (
                    <TableRow key={promoter.id}>
                      <TableCell className="font-medium">{promoter.name_en}</TableCell>
                      <TableCell>{promoter.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(promoter.status)}
                          {getStatusBadge(promoter.status)}
                        </div>
                      </TableCell>
                      <TableCell>{promoter.active_contracts_count}</TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger>
                            <div
                              className={`${getDocumentStatus(promoter.id_card_expiry_date).colorClass}`}
                            >
                              {getDocumentStatus(promoter.id_card_expiry_date).text}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {getDocumentStatus(promoter.id_card_expiry_date).tooltip}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{new Date(promoter.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(promoter)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewDetails(promoter)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeletePromoter(promoter)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        {deletePromoter && (
          <AlertDialog open={!!deletePromoter} onOpenChange={() => setDeletePromoter(null)}>
            <AlertDialogTrigger />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the promoter{" "}
                  <strong>{deletePromoter.name_en}</strong>.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Promoter Details Sheet */}
        {selectedPromoter && (
          <Sheet open={isDetailsSheetOpen} onOpenChange={setIsDetailsSheetOpen}>
            <SheetTrigger />
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>{selectedPromoter.name_en}</SheetTitle>
                <SheetDescription>
                  View and manage details of {selectedPromoter.name_en}.
                </SheetDescription>
              </SheetHeader>
              <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>
                <TabsContent value="overview">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Avatar>
                          <AvatarImage
                            src={selectedPromoter.profile_image_url}
                            alt={selectedPromoter.name_en}
                          />
                          <AvatarFallback>{selectedPromoter.name_en.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-lg font-semibold">{selectedPromoter.name_en}</p>
                          <p className="text-sm text-muted-foreground">{selectedPromoter.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(selectedPromoter.status)}
                        {getStatusBadge(selectedPromoter.status)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Phone</p>
                        <p className="text-sm text-muted-foreground">{selectedPromoter.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Address</p>
                        <p className="text-sm text-muted-foreground">{selectedPromoter.address}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">National ID</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedPromoter.national_id}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">CRN</p>
                        <p className="text-sm text-muted-foreground">{selectedPromoter.crn}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Last Contract Date</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedPromoter.last_contract_date
                            ? new Date(selectedPromoter.last_contract_date).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Active Contracts</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedPromoter.active_contracts_count}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Notes</p>
                      <p className="text-sm text-muted-foreground">{selectedPromoter.notes}</p>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="documents">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-semibold">Documents</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(selectedPromoter.id_card_url, "_blank")}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download ID Card
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">ID Card</p>
                        <div className="relative mt-2">
                          {documentUploads.id_card.preview ? (
                            <img
                              src={documentUploads.id_card.preview}
                              alt="ID Card Preview"
                              className="h-48 w-full rounded-md object-cover"
                            />
                          ) : selectedPromoter.id_card_url ? (
                            <img
                              src={selectedPromoter.id_card_url}
                              alt="ID Card"
                              className="h-48 w-full rounded-md object-cover"
                            />
                          ) : (
                            <div className="flex h-48 w-full items-center justify-center rounded-md bg-gray-100">
                              <Camera className="h-12 w-12 text-gray-300" />
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              e.target.files && handleDocumentUpload("id_card", e.target.files[0])
                            }
                            ref={(el) => el && documentUploads.id_card.uploading && el.click()}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 w-full"
                            onClick={() => document.querySelector(`input[type="file"]`)?.click()}
                          >
                            {documentUploads.id_card.uploading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload ID Card
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Passport</p>
                        <div className="relative mt-2">
                          {documentUploads.passport.preview ? (
                            <img
                              src={documentUploads.passport.preview}
                              alt="Passport Preview"
                              className="h-48 w-full rounded-md object-cover"
                            />
                          ) : selectedPromoter.passport_url ? (
                            <img
                              src={selectedPromoter.passport_url}
                              alt="Passport"
                              className="h-48 w-full rounded-md object-cover"
                            />
                          ) : (
                            <div className="flex h-48 w-full items-center justify-center rounded-md bg-gray-100">
                              <Passport className="h-12 w-12 text-gray-300" />
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              e.target.files && handleDocumentUpload("passport", e.target.files[0])
                            }
                            ref={(el) => el && documentUploads.passport.uploading && el.click()}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 w-full"
                            onClick={() => document.querySelector(`input[type="file"]`)?.click()}
                          >
                            {documentUploads.passport.uploading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Passport
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Profile Image</p>
                      <div className="relative mt-2">
                        {documentUploads.profile.preview ? (
                          <img
                            src={documentUploads.profile.preview}
                            alt="Profile Image Preview"
                            className="h-48 w-full rounded-md object-cover"
                          />
                        ) : selectedPromoter.profile_image_url ? (
                          <img
                            src={selectedPromoter.profile_image_url}
                            alt="Profile Image"
                            className="h-48 w-full rounded-md object-cover"
                          />
                        ) : (
                          <div className="flex h-48 w-full items-center justify-center rounded-md bg-gray-100">
                            <Avatar className="h-24 w-24">
                              <AvatarImage
                                src={selectedPromoter.profile_image_url}
                                alt={selectedPromoter.name_en}
                              />
                              <AvatarFallback>{selectedPromoter.name_en.charAt(0)}</AvatarFallback>
                            </Avatar>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            e.target.files && handleDocumentUpload("profile", e.target.files[0])
                          }
                          ref={(el) => el && documentUploads.profile.uploading && el.click()}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 w-full"
                          onClick={() => document.querySelector(`input[type="file"]`)?.click()}
                        >
                          {documentUploads.profile.uploading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-4 w-4" />
                              Upload Profile Image
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </TooltipProvider>
  )
}
