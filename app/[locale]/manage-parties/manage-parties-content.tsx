"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Plus, Search, Edit, Trash2, Building, User, Phone, Mail, MapPin } from "lucide-react"

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

const initialFormData: FormData = {
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
}

export default function ManagePartiesContent() {
  const [parties, setParties] = useState<Party[]>([])
  const [filteredParties, setFilteredParties] = useState<Party[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingParty, setEditingParty] = useState<Party | null>(null)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<PartyStats>({
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0,
    individuals: 0,
    companies: 0,
    withActiveContracts: 0,
    recentlyAdded: 0,
  })

  // Mock data for demonstration
  useEffect(() => {
    const mockParties: Party[] = [
      {
        id: "1",
        name_en: "John Doe",
        name_ar: "جون دو",
        email: "john.doe@example.com",
        phone: "+1234567890",
        address: "123 Main St, City",
        type: "individual",
        status: "active",
        created_at: new Date().toISOString(),
        notes: "Regular client",
        national_id: "123456789",
        active_contracts_count: 2,
        total_contracts_count: 5,
        last_contract_date: "2024-01-15",
      },
      {
        id: "2",
        name_en: "ABC Corporation",
        name_ar: "شركة أي بي سي",
        email: "contact@abc-corp.com",
        phone: "+1987654321",
        address: "456 Business Ave, City",
        type: "company",
        status: "active",
        created_at: new Date().toISOString(),
        notes: "Large enterprise client",
        crn: "CR123456789",
        contact_person: "Jane Smith",
        website: "https://abc-corp.com",
        industry: "Technology",
        tax_number: "TAX123456",
        active_contracts_count: 5,
        total_contracts_count: 12,
        last_contract_date: "2024-01-20",
      },
    ]

    setParties(mockParties)
    setFilteredParties(mockParties)

    // Calculate stats
    const newStats: PartyStats = {
      total: mockParties.length,
      active: mockParties.filter((p) => p.status === "active").length,
      inactive: mockParties.filter((p) => p.status === "inactive").length,
      suspended: mockParties.filter((p) => p.status === "suspended").length,
      individuals: mockParties.filter((p) => p.type === "individual").length,
      companies: mockParties.filter((p) => p.type === "company").length,
      withActiveContracts: mockParties.filter((p) => (p.active_contracts_count || 0) > 0).length,
      recentlyAdded: mockParties.filter((p) => {
        const createdDate = new Date(p.created_at)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        return createdDate > thirtyDaysAgo
      }).length,
    }

    setStats(newStats)
    setLoading(false)
  }, [])

  // Filter parties based on search and filters
  useEffect(() => {
    let filtered = parties

    if (searchTerm) {
      filtered = filtered.filter(
        (party) =>
          party.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
          party.name_ar.includes(searchTerm) ||
          party.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          party.phone.includes(searchTerm),
      )
    }

    if (selectedType !== "all") {
      filtered = filtered.filter((party) => party.type === selectedType)
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter((party) => party.status === selectedStatus)
    }

    setFilteredParties(filtered)
  }, [parties, searchTerm, selectedType, selectedStatus])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingParty) {
        // Update existing party
        const updatedParty: Party = {
          ...editingParty,
          ...formData,
          updated_at: new Date().toISOString(),
        }

        setParties((prev) => prev.map((p) => (p.id === editingParty.id ? updatedParty : p)))
        toast.success("Party updated successfully")
      } else {
        // Create new party
        const newParty: Party = {
          id: Date.now().toString(),
          ...formData,
          created_at: new Date().toISOString(),
          active_contracts_count: 0,
          total_contracts_count: 0,
        }

        setParties((prev) => [...prev, newParty])
        toast.success("Party created successfully")
      }

      setIsDialogOpen(false)
      setEditingParty(null)
      setFormData(initialFormData)
    } catch (error) {
      toast.error("Failed to save party")
    }
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
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this party?")) {
      try {
        setParties((prev) => prev.filter((p) => p.id !== id))
        toast.success("Party deleted successfully")
      } catch (error) {
        toast.error("Failed to delete party")
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      case "suspended":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manage Parties</h1>
          <p className="text-gray-600">Manage individuals and companies in your system</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingParty(null)
                setFormData(initialFormData)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Party
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingParty ? "Edit Party" : "Add New Party"}</DialogTitle>
              <DialogDescription>
                {editingParty ? "Update party information" : "Create a new party in the system"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name_en">Name (English)</Label>
                  <Input
                    id="name_en"
                    value={formData.name_en}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name_en: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="name_ar">Name (Arabic)</Label>
                  <Input
                    id="name_ar"
                    value={formData.name_ar}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name_ar: e.target.value }))}
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
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: "individual" | "company") =>
                      setFormData((prev) => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                    onValueChange={(value: "active" | "inactive" | "suspended") =>
                      setFormData((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                />
              </div>

              {formData.type === "individual" && (
                <div>
                  <Label htmlFor="national_id">National ID</Label>
                  <Input
                    id="national_id"
                    value={formData.national_id}
                    onChange={(e) => setFormData((prev) => ({ ...prev, national_id: e.target.value }))}
                  />
                </div>
              )}

              {formData.type === "company" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="crn">Commercial Registration Number</Label>
                    <Input
                      id="crn"
                      value={formData.crn}
                      onChange={(e) => setFormData((prev) => ({ ...prev, crn: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_person">Contact Person</Label>
                    <Input
                      id="contact_person"
                      value={formData.contact_person}
                      onChange={(e) => setFormData((prev) => ({ ...prev, contact_person: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      value={formData.industry}
                      onChange={(e) => setFormData((prev) => ({ ...prev, industry: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingParty ? "Update" : "Create"} Party</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Parties</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <div className="h-2 w-2 bg-green-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.companies}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Active Contracts</CardTitle>
            <div className="h-2 w-2 bg-blue-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withActiveContracts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
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
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="company">Company</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Parties List */}
      <div className="grid gap-4">
        {filteredParties.map((party) => (
          <Card key={party.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {party.type === "company" ? (
                      <Building className="h-5 w-5 text-blue-500" />
                    ) : (
                      <User className="h-5 w-5 text-green-500" />
                    )}
                    <div>
                      <h3 className="text-lg font-semibold">{party.name_en}</h3>
                      <p className="text-sm text-gray-600">{party.name_ar}</p>
                    </div>
                    <Badge className={getStatusColor(party.status)}>{party.status}</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{party.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{party.phone}</span>
                    </div>
                    {party.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{party.address}</span>
                      </div>
                    )}
                    <div className="text-sm text-gray-600">
                      Contracts: {party.active_contracts_count}/{party.total_contracts_count}
                    </div>
                  </div>

                  {party.notes && <p className="text-sm text-gray-600 mt-2">{party.notes}</p>}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(party)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(party.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredParties.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No parties found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedType !== "all" || selectedStatus !== "all"
                ? "Try adjusting your filters"
                : "Get started by adding your first party"}
            </p>
            {!searchTerm && selectedType === "all" && selectedStatus === "all" && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Party
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
