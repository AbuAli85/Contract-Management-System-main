"use client"

import { useEffect, useState, useMemo } from "react"
import PartyForm from "@/components/party-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useSupabase } from "@/components/supabase-provider"
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
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  EditIcon, 
  PlusCircleIcon, 
  ArrowLeftIcon, 
  BuildingIcon, 
  Loader2, 
  MoreHorizontal,
  Trash2,
  Search,
  Filter,
  Download,
  Upload,
  Building2,
  Users,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Hash,
  Eye
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format, parseISO, isAfter, isBefore, addDays } from "date-fns"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

interface PartyStats {
  total: number
  active: number
  inactive: number
  suspended: number
  expiringSoon: number
}

export default function ManagePartiesPage() {
  const [parties, setParties] = useState<Party[]>([])
  const [filteredParties, setFilteredParties] = useState<Party[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedParty, setSelectedParty] = useState<Party | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [partyToDelete, setPartyToDelete] = useState<Party | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [showDetails, setShowDetails] = useState<Party | null>(null)
  const { toast } = useToast()
  const { supabase } = useSupabase()

  // Calculate statistics
  const stats = useMemo<PartyStats>(() => {
    const now = new Date()
    const thirtyDaysFromNow = addDays(now, 30)
    
    return {
      total: parties.length,
      active: parties.filter(p => p.status === "Active").length,
      inactive: parties.filter(p => p.status === "Inactive").length,
      suspended: parties.filter(p => p.status === "Suspended").length,
      expiringSoon: parties.filter(p => {
        if (!p.cr_expiry_date) return false
        const expiryDate = parseISO(p.cr_expiry_date)
        return isAfter(expiryDate, now) && isBefore(expiryDate, thirtyDaysFromNow)
      }).length
    }
  }, [parties])

  async function fetchParties() {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("parties")
        .select("*")
        .order("created_at", { ascending: false })
      
      if (error) throw error
      setParties(data || [])
      setFilteredParties(data || [])
    } catch (error: any) {
      toast({ 
        title: "Error fetching parties", 
        description: error.message, 
        variant: "destructive" 
      })
      setParties([])
      setFilteredParties([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchParties()
  }, [])

  // Filter parties based on search and filters
  useEffect(() => {
    let filtered = parties

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(party => 
        party.name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        party.name_ar?.includes(searchTerm) ||
        party.crn?.includes(searchTerm) ||
        party.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        party.contact_person?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(party => party.status === statusFilter)
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(party => party.type === typeFilter)
    }

    setFilteredParties(filtered)
  }, [searchTerm, statusFilter, typeFilter, parties])

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
    fetchParties()
  }

  const handleDelete = async (party: Party) => {
    setPartyToDelete(party)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!partyToDelete) return

    try {
      const { error } = await supabase
        .from("parties")
        .delete()
        .eq("id", partyToDelete.id)

      if (error) throw error

      toast({
        title: "Party deleted",
        description: "The party has been successfully deleted.",
      })
      
      fetchParties()
    } catch (error: any) {
      toast({
        title: "Error deleting party",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setShowDeleteDialog(false)
      setPartyToDelete(null)
    }
  }

  const exportParties = () => {
    const csv = [
      ["Name (EN)", "Name (AR)", "CRN", "Type", "Status", "Contact Person", "Contact Email", "Contact Phone"],
      ...filteredParties.map(party => [
        party.name_en,
        party.name_ar,
        party.crn,
        party.type,
        party.status,
        party.contact_person || "",
        party.contact_email || "",
        party.contact_phone || ""
      ])
    ].map(row => row.join(",")).join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `parties-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: any }> = {
      Active: { variant: "default", icon: CheckCircle },
      Inactive: { variant: "secondary", icon: XCircle },
      Suspended: { variant: "destructive", icon: AlertCircle }
    }
    
    const config = variants[status] || variants.Active
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    )
  }

  const getTypeBadge = (type: string) => {
    return (
      <Badge variant="outline" className="gap-1">
        <Building2 className="h-3 w-3" />
        {type}
      </Badge>
    )
  }

  const isExpiringDocument = (date: string | null) => {
    if (!date) return false
    const expiryDate = parseISO(date)
    const thirtyDaysFromNow = addDays(new Date(), 30)
    return isAfter(expiryDate, new Date()) && isBefore(expiryDate, thirtyDaysFromNow)
  }

  const isExpiredDocument = (date: string | null) => {
    if (!date) return false
    return isBefore(parseISO(date), new Date())
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-7xl">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            {[1, 2, 3, 4].map(i => (
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
            Back to Party List
          </Button>
          <PartyForm partyToEdit={selectedParty} onFormSubmit={handleFormClose} />
        </div>
      </div>
    )
  }

  if (showDetails) {
    return (
      <div className="min-h-screen bg-background px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-4xl">
          <Button variant="outline" onClick={() => setShowDetails(null)} className="mb-4">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Party List
          </Button>
          
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{showDetails.name_en}</CardTitle>
                  {showDetails.name_ar && (
                    <p className="text-lg text-muted-foreground mt-1" dir="rtl">{showDetails.name_ar}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {getStatusBadge(showDetails.status)}
                  {getTypeBadge(showDetails.type)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Basic Information
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">CRN:</span>
                    <span className="font-medium">{showDetails.crn}</span>
                  </div>
                  {showDetails.role && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Role:</span>
                      <span className="font-medium">{showDetails.role}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              {(showDetails.contact_person || showDetails.contact_email || showDetails.contact_phone) && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Contact Information
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {showDetails.contact_person && (
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Contact:</span>
                        <span className="font-medium">{showDetails.contact_person}</span>
                      </div>
                    )}
                    {showDetails.contact_email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${showDetails.contact_email}`} className="font-medium text-primary hover:underline">
                          {showDetails.contact_email}
                        </a>
                      </div>
                    )}
                    {showDetails.contact_phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${showDetails.contact_phone}`} className="font-medium text-primary hover:underline">
                          {showDetails.contact_phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Legal Information */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Legal Information
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {showDetails.cr_expiry_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">CR Expiry:</span>
                      <span className={cn(
                        "font-medium",
                        isExpiredDocument(showDetails.cr_expiry_date) && "text-destructive",
                        isExpiringDocument(showDetails.cr_expiry_date) && "text-orange-600"
                      )}>
                        {format(parseISO(showDetails.cr_expiry_date), "dd MMM yyyy")}
                        {isExpiredDocument(showDetails.cr_expiry_date) && " (Expired)"}
                        {isExpiringDocument(showDetails.cr_expiry_date) && " (Expiring Soon)"}
                      </span>
                    </div>
                  )}
                  {showDetails.tax_number && (
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Tax Number:</span>
                      <span className="font-medium">{showDetails.tax_number}</span>
                    </div>
                  )}
                  {showDetails.license_number && (
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">License:</span>
                      <span className="font-medium">{showDetails.license_number}</span>
                    </div>
                  )}
                  {showDetails.license_expiry_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">License Expiry:</span>
                      <span className={cn(
                        "font-medium",
                        isExpiredDocument(showDetails.license_expiry_date) && "text-destructive",
                        isExpiringDocument(showDetails.license_expiry_date) && "text-orange-600"
                      )}>
                        {format(parseISO(showDetails.license_expiry_date), "dd MMM yyyy")}
                        {isExpiredDocument(showDetails.license_expiry_date) && " (Expired)"}
                        {isExpiringDocument(showDetails.license_expiry_date) && " (Expiring Soon)"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Address */}
              {(showDetails.address_en || showDetails.address_ar) && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address
                  </h3>
                  <div className="space-y-2">
                    {showDetails.address_en && (
                      <p className="text-sm">{showDetails.address_en}</p>
                    )}
                    {showDetails.address_ar && (
                      <p className="text-sm" dir="rtl">{showDetails.address_ar}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {showDetails.notes && (
                <div>
                  <h3 className="font-semibold mb-3">Notes</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{showDetails.notes}</p>
                </div>
              )}

              {/* Metadata */}
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Created on {format(parseISO(showDetails.created_at), "dd MMM yyyy 'at' HH:mm")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Manage Parties</h1>
              <p className="text-muted-foreground mt-1">
                Manage your business partners, clients, and employers
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportParties}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button onClick={handleAddNew}>
                <PlusCircleIcon className="mr-2 h-4 w-4" />
                Add Party
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Parties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Inactive
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Suspended
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.suspended}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Expiring Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.expiringSoon}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search parties..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Employer">Employer</SelectItem>
                  <SelectItem value="Client">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Parties Table */}
        {filteredParties.length === 0 ? (
          <Card className="py-10 text-center">
            <CardHeader>
              <BuildingIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <CardTitle>No Parties Found</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                  ? "No parties match your current filters. Try adjusting your search criteria."
                  : "Get started by adding your first party. Click the 'Add Party' button."}
              </CardDescription>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Party Name</TableHead>
                      <TableHead>CRN</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Documents</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredParties.map((party) => (
                      <TableRow key={party.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{party.name_en}</p>
                            {party.name_ar && (
                              <p className="text-sm text-muted-foreground" dir="rtl">{party.name_ar}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm">{party.crn}</code>
                        </TableCell>
                        <TableCell>{getTypeBadge(party.type)}</TableCell>
                        <TableCell>{getStatusBadge(party.status)}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {party.contact_person && (
                              <p className="text-sm">{party.contact_person}</p>
                            )}
                            {party.contact_email && (
                              <p className="text-xs text-muted-foreground">{party.contact_email}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {party.cr_expiry_date && (
                              <div className="text-xs">
                                {isExpiredDocument(party.cr_expiry_date) ? (
                                  <Badge variant="destructive" className="gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    CR Expired
                                  </Badge>
                                ) : isExpiringDocument(party.cr_expiry_date) ? (
                                  <Badge variant="outline" className="gap-1 border-orange-600 text-orange-600">
                                    <Clock className="h-3 w-3" />
                                    CR Expiring
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                                    <CheckCircle className="h-3 w-3" />
                                    CR Valid
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
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
                              <DropdownMenuItem onClick={() => setShowDetails(party)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(party)}>
                                <EditIcon className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDelete(party)}
                                className="text-destructive"
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
              </div>
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
              This will permanently delete the party "{partyToDelete?.name_en}". 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}