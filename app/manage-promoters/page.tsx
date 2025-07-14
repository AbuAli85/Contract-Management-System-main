"use client"

import type React from "react"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  User,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Eye,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { TooltipProvider } from "@/components/ui/tooltip"
import { supabase } from "@/lib/supabase"
import { format, parseISO } from "date-fns"

// Promoter interface
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
  recentlyAdded: number
}

export default function ManagePromotersPage() {
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

  const [formError, setFormError] = useState<string | null>(null)

  // Fetch promoters data
  const fetchPromoters = useCallback(async () => {
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

      // Process promoters data
      const processedPromoters = promotersData || []
      setPromoters(processedPromoters)

      // Calculate stats
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const statsData: PromoterStats = {
        total: processedPromoters.length,
        active: processedPromoters.filter((p) => p.status === "Active").length,
        inactive: processedPromoters.filter((p) => p.status === "Inactive").length,
        suspended: processedPromoters.filter((p) => p.status === "Suspended").length,
        withActiveContracts: processedPromoters.filter((p) => (p.active_contracts_count || 0) > 0).length,
        recentlyAdded: processedPromoters.filter((p) => new Date(p.created_at) >= thirtyDaysAgo).length,
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

  // Setup realtime subscription
  const setupRealtimeSubscription = useCallback(() => {
    const subscription = supabase
      .channel("promoters_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "promoters",
        },
        () => {
          fetchPromoters()
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchPromoters])

  // Apply filters
  const applyFilters = useCallback(() => {
    return promoters.filter((promoter) => {
      const matchesSearch =
        promoter.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promoter.name_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promoter.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = selectedStatus === "all" || promoter.status === selectedStatus
      return matchesSearch && matchesStatus
    })
  }, [promoters, searchTerm, selectedStatus])

  // Memoized filtered promoters
  const filteredPromoters = useMemo(() => {
    return applyFilters()
  }, [applyFilters])

  // Memoized sorted promoters
  const sortedPromoters = useMemo(() => {
    return [...filteredPromoters].sort((a, b) => {
      const aValue = a[sortBy as keyof Promoter]
      const bValue = b[sortBy as keyof Promoter]

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
      return 0
    })
  }, [filteredPromoters, sortBy, sortOrder])

  useEffect(() => {
    fetchPromoters()
    setupRealtimeSubscription()
  }, [fetchPromoters, setupRealtimeSubscription])

  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)

    try {
      const promoterData = {
        ...formData,
        updated_at: new Date().toISOString(),
      }

      let result
      if (editingPromoter) {
        result = await supabase
          .from("promoters")
          .update(promoterData)
          .eq("id", editingPromoter.id)
      } else {
        result = await supabase
          .from("promoters")
          .insert([
            {
              ...promoterData,
              created_at: new Date().toISOString(),
            },
          ])
      }

      if (result.error) {
        throw result.error
      }

      toast({
        title: "Success",
        description: `Promoter ${editingPromoter ? "updated" : "created"} successfully.`,
      })

      // Reset form and close dialog
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
      setIsAddDialogOpen(false)
      setEditingPromoter(null)
      fetchPromoters()
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
      fetchPromoters()
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
          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            Active
          </Badge>
        )
      case "Inactive":
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100">
            Inactive
          </Badge>
        )
      case "Suspended":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
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

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "MMM dd, yyyy")
    } catch {
      return "Invalid date"
    }
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
            <Button variant="outline" onClick={fetchPromoters} disabled={loading}>
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
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingPromoter ? "Edit Promoter" : "Add New Promoter"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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
                        onChange={(e) => setFormData({ ...formData, id_card_expiry_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="passport_number">Passport Number</Label>
                      <Input
                        id="passport_number"
                        value={formData.passport_number}
                        onChange={(e) => setFormData({ ...formData, passport_number: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="passport_expiry_date">Passport Expiry Date</Label>
                      <Input
                        id="passport_expiry_date"
                        type="date"
                        value={formData.passport_expiry_date}
                        onChange={(e) => setFormData({ ...formData, passport_expiry_date: e.target.value })}
                      />
                    </div>
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

                  {formError && <div className="text-sm font-medium text-red-600">{formError}</div>}

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {editingPromoter ? "Updating..." : "Creating..."}
                        </>
                      ) : (
                        <>{editingPromoter ? "Update" : "Create"} Promoter</>
                      )}
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
              <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.active ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
              <XCircle className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.inactive ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspended</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.suspended ?? 0}</div>
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
                    <TableHead onClick={() => handleSort("name_en")} className="cursor-pointer">
                      Name
                    </TableHead>
                    <TableHead onClick={() => handleSort("email")} className="cursor-pointer">
                      Email
                    </TableHead>
                    <TableHead onClick={() => handleSort("status")} className="cursor-pointer">
                      Status
                    </TableHead>
                    <TableHead>Contracts</TableHead>
                    <TableHead onClick={() => handleSort("created_at")} className="cursor-pointer">
                      Created
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPromoters.map((promoter) => (
                    <TableRow key={promoter.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{promoter.name_en}</div>
                          {promoter.name_ar && (
                            <div className="text-sm text-muted-foreground" dir="rtl">
                              {promoter.name_ar}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{promoter.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(promoter.status)}
                          {getStatusBadge(promoter.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Active: {promoter.active_contracts_count || 0}</div>
                          <div className="text-muted-foreground">Total: {promoter.total_contracts_count || 0}</div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(promoter.created_at)}</TableCell>
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
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDeletePromoter(promoter)} className="text-red-600">
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
                  <strong>&quot;{deletePromoter.name_en}&quot;</strong> and remove all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </TooltipProvider>
  )
}
