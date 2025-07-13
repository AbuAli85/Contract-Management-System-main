"use client"

import type React from "react"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useParams } from "next/navigation"
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
} from "@/components/ui/alert-dialog"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  User,
  Building,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Eye,
  ArrowUpDown,
  FileText,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { TooltipProvider } from "@/components/ui/tooltip"
import { supabase } from "@/lib/supabase"
import { format, parseISO } from "date-fns"

// Party interface
interface Party {
  id: string
  name_en: string
  name_ar: string
  email: string
  phone: string
  address?: string
  type: "individual" | "company"
  status: "active" | "inactive" | "suspended"
  created_at: string
  updated_at?: string
  notes?: string
  crn?: string
  national_id?: string
  contact_person?: string
  website?: string
  industry?: string
  tax_number?: string
  bank_account?: string
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
  type: "individual" | "company"
  status: "active" | "inactive" | "suspended"
  notes: string
  crn: string
  national_id: string
  contact_person: string
  website: string
  industry: string
  tax_number: string
  bank_account: string
}

interface PartyStats {
  total: number
  active: number
  inactive: number
  suspended: number
  individuals: number
  companies: number
  withActiveContracts: number
  recentlyAdded: number
}

export default function ManagePartiesPage() {
  const params = useParams()
  const { toast } = useToast()

  // State management
  const [parties, setParties] = useState<Party[]>([])
  const [stats, setStats] = useState<PartyStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("name_en")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingParty, setEditingParty] = useState<Party | null>(null)
  const [deleteParty, setDeleteParty] = useState<Party | null>(null)

  const [formData, setFormData] = useState<FormData>({
    name_en: "",
    name_ar: "",
    email: "",
    phone: "",
    address: "",
    type: "individual",
    status: "active",
    notes: "",
    crn: "",
    national_id: "",
    contact_person: "",
    website: "",
    industry: "",
    tax_number: "",
    bank_account: "",
  })

  const [formError, setFormError] = useState<string | null>(null)

  // Fetch parties data
  const fetchParties = useCallback(async () => {
    try {
      setIsLoading(true)

      const { data: partiesData, error: partiesError } = await supabase.from("parties").select("*").order("name_en")

      if (partiesError) {
        console.error("Error fetching parties:", partiesError)
        toast({
          title: "Error",
          description: "Failed to load parties. Please try again.",
          variant: "destructive",
        })
        return
      }

      // Fetch contract counts for each party
      const partyIds = partiesData?.map((p) => p.id) || []
      let contractsData: any[] = []

      if (partyIds.length > 0) {
        const { data: contracts, error: contractsError } = await supabase
          .from("contracts")
          .select("party_a_id, party_b_id, contract_end_date, created_at")
          .or(`party_a_id.in.(${partyIds.join(",")}),party_b_id.in.(${partyIds.join(",")})`)

        if (!contractsError) {
          contractsData = contracts || []
        }
      }

      // Process parties data
      const processedParties =
        partiesData?.map((party: any) => {
          const partyContracts = contractsData.filter((c) => c.party_a_id === party.id || c.party_b_id === party.id)
          const activeContracts = partyContracts.filter((contract: any) => {
            const endDate = new Date(contract.contract_end_date)
            return endDate >= new Date()
          })

          const lastContract = partyContracts.sort(
            (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
          )[0]

          return {
            ...party,
            active_contracts_count: activeContracts.length,
            total_contracts_count: partyContracts.length,
            last_contract_date: lastContract?.created_at || null,
          }
        }) || []

      setParties(processedParties)

      // Calculate stats
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const statsData: PartyStats = {
        total: processedParties.length,
        active: processedParties.filter((p) => p.status === "active").length,
        inactive: processedParties.filter((p) => p.status === "inactive").length,
        suspended: processedParties.filter((p) => p.status === "suspended").length,
        individuals: processedParties.filter((p) => p.type === "individual").length,
        companies: processedParties.filter((p) => p.type === "company").length,
        withActiveContracts: processedParties.filter((p) => (p.active_contracts_count || 0) > 0).length,
        recentlyAdded: processedParties.filter((p) => new Date(p.created_at) >= thirtyDaysAgo).length,
      }

      setStats(statsData)
    } catch (error) {
      console.error("Error fetching parties:", error)
      toast({
        title: "Error",
        description: "Failed to load parties. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // Apply filters
  const applyFilters = useCallback(() => {
    let filtered = [...parties]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (party) =>
          party.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
          party.name_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
          party.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Type filter
    if (selectedType !== "all") {
      filtered = filtered.filter((party) => party.type === selectedType)
    }

    // Status filter
    if (selectedStatus !== "all") {
      filtered = filtered.filter((party) => party.status === selectedStatus)
    }

    return filtered
  }, [parties, searchTerm, selectedType, selectedStatus])

  // Memoized filtered parties
  const filteredParties = useMemo(() => {
    return applyFilters()
  }, [applyFilters])

  // Memoized sorted parties
  const sortedParties = useMemo(() => {
    return [...filteredParties].sort((a, b) => {
      const aValue = a[sortBy as keyof Party]
      const bValue = b[sortBy as keyof Party]

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
      return 0
    })
  }, [filteredParties, sortBy, sortOrder])

  useEffect(() => {
    fetchParties()
  }, [fetchParties])

  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)

    try {
      const partyData = {
        ...formData,
        updated_at: new Date().toISOString(),
      }

      if (editingParty) {
        const { error } = await supabase.from("parties").update(partyData).eq("id", editingParty.id)

        if (error) throw error

        toast({
          title: "Success",
          description: "Party updated successfully",
        })
      } else {
        const { error } = await supabase.from("parties").insert([
          {
            ...partyData,
            created_at: new Date().toISOString(),
          },
        ])

        if (error) throw error

        toast({
          title: "Success",
          description: "Party created successfully",
        })
      }

      setIsAddDialogOpen(false)
      setEditingParty(null)
      resetForm()
      fetchParties()
    } catch (error) {
      console.error("Error saving party:", error)
      toast({
        title: "Error",
        description: "Failed to save party. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteParty) return

    try {
      const { error } = await supabase.from("parties").delete().eq("id", deleteParty.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Party deleted successfully",
      })

      setDeleteParty(null)
      fetchParties()
    } catch (error) {
      console.error("Error deleting party:", error)
      toast({
        title: "Error",
        description: "Failed to delete party. Please try again.",
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
      type: "individual",
      status: "active",
      notes: "",
      crn: "",
      national_id: "",
      contact_person: "",
      website: "",
      industry: "",
      tax_number: "",
      bank_account: "",
    })
  }

  const handleEdit = (party: Party) => {
    setEditingParty(party)
    setFormData({
      name_en: party.name_en,
      name_ar: party.name_ar,
      email: party.email,
      phone: party.phone,
      address: party.address || "",
      type: party.type,
      status: party.status,
      notes: party.notes || "",
      crn: party.crn || "",
      national_id: party.national_id || "",
      contact_person: party.contact_person || "",
      website: party.website || "",
      industry: party.industry || "",
      tax_number: party.tax_number || "",
      bank_account: party.bank_account || "",
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
      case "active":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            Active
          </Badge>
        )
      case "inactive":
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100">
            Inactive
          </Badge>
        )
      case "suspended":
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
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "inactive":
        return <XCircle className="h-4 w-4 text-gray-500" />
      case "suspended":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "individual":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
            <User className="mr-1 h-3 w-3" />
            Individual
          </Badge>
        )
      case "company":
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
            <Building className="mr-1 h-3 w-3" />
            Company
          </Badge>
        )
      default:
        return <Badge variant="secondary">{type}</Badge>
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
            <h1 className="text-3xl font-bold tracking-tight">Party Management</h1>
            <p className="text-muted-foreground">Manage contract parties and their information</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchParties} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Party
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingParty ? "Edit Party" : "Add New Party"}</DialogTitle>
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
                      <Label htmlFor="type">Type</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData({ ...formData, type: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">Individual</SelectItem>
                          <SelectItem value="company">Company</SelectItem>
                        </SelectContent>
                      </Select>
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
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {formData.type === "company" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="crn">Commercial Registration Number</Label>
                        <Input
                          id="crn"
                          value={formData.crn}
                          onChange={(e) => setFormData({ ...formData, crn: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="contact_person">Contact Person</Label>
                        <Input
                          id="contact_person"
                          value={formData.contact_person}
                          onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  {formData.type === "individual" && (
                    <div>
                      <Label htmlFor="national_id">National ID</Label>
                      <Input
                        id="national_id"
                        value={formData.national_id}
                        onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                      />
                    </div>
                  )}

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
                          {editingParty ? "Updating..." : "Creating..."}
                        </>
                      ) : (
                        <>{editingParty ? "Update" : "Create"} Party</>
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
                placeholder="Search parties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="individual">Individual</SelectItem>
              <SelectItem value="company">Company</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Parties</CardTitle>
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
              <CardTitle className="text-sm font-medium">Companies</CardTitle>
              <Building className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.companies ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With Contracts</CardTitle>
              <FileText className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.withActiveContracts ?? 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Parties Table */}
        <Card>
          <CardHeader>
            <CardTitle>Parties</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
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
            ) : sortedParties.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No parties found.{" "}
                  {searchTerm || selectedType !== "all" || selectedStatus !== "all"
                    ? "Try adjusting your filters."
                    : "Add your first party to get started."}
                </AlertDescription>
              </Alert>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead onClick={() => handleSort("name_en")} className="cursor-pointer">
                      Name
                      {sortBy === "name_en" && <ArrowUpDown className="ml-2 inline h-4 w-4" />}
                    </TableHead>
                    <TableHead onClick={() => handleSort("email")} className="cursor-pointer">
                      Email
                      {sortBy === "email" && <ArrowUpDown className="ml-2 inline h-4 w-4" />}
                    </TableHead>
                    <TableHead onClick={() => handleSort("type")} className="cursor-pointer">
                      Type
                      {sortBy === "type" && <ArrowUpDown className="ml-2 inline h-4 w-4" />}
                    </TableHead>
                    <TableHead onClick={() => handleSort("status")} className="cursor-pointer">
                      Status
                      {sortBy === "status" && <ArrowUpDown className="ml-2 inline h-4 w-4" />}
                    </TableHead>
                    <TableHead>Contracts</TableHead>
                    <TableHead onClick={() => handleSort("created_at")} className="cursor-pointer">
                      Created
                      {sortBy === "created_at" && <ArrowUpDown className="ml-2 inline h-4 w-4" />}
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedParties.map((party) => (
                    <TableRow key={party.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{party.name_en}</div>
                          {party.name_ar && (
                            <div className="text-sm text-muted-foreground" dir="rtl">
                              {party.name_ar}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{party.email}</TableCell>
                      <TableCell>{getTypeBadge(party.type)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(party.status)}
                          {getStatusBadge(party.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Active: {party.active_contracts_count || 0}</div>
                          <div className="text-muted-foreground">Total: {party.total_contracts_count || 0}</div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(party.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(party)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDeleteParty(party)} className="text-red-600">
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
        {deleteParty && (
          <AlertDialog open={!!deleteParty} onOpenChange={() => setDeleteParty(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the party{" "}
                  <strong>&quot;{deleteParty.name_en}&quot;</strong> and remove all associated data.
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
