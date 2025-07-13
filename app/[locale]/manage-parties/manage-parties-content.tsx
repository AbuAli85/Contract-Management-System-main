"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Edit, Trash2, Building, User } from "lucide-react"
import { toast } from "sonner"

interface Party {
  id: string
  name_en: string
  name_ar: string
  type: "individual" | "company"
  email?: string
  phone?: string
  address?: string
  contact_person?: string
  notes?: string
  status: "active" | "inactive"
  created_at: string
}

// Mock data for development
const mockParties: Party[] = [
  {
    id: "1",
    name_en: "John Doe",
    name_ar: "جون دو",
    type: "individual",
    email: "john@example.com",
    phone: "+971501234567",
    address: "Dubai, UAE",
    status: "active",
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    name_en: "ABC Company",
    name_ar: "شركة أي بي سي",
    type: "company",
    email: "info@abc.com",
    phone: "+971507654321",
    address: "Abu Dhabi, UAE",
    contact_person: "Jane Smith",
    status: "active",
    created_at: new Date().toISOString(),
  },
]

export default function ManagePartiesContent() {
  const [parties, setParties] = useState<Party[]>(mockParties)
  const [filteredParties, setFilteredParties] = useState<Party[]>(mockParties)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingParty, setEditingParty] = useState<Party | null>(null)
  const [loading, setLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name_en: "",
    name_ar: "",
    type: "individual" as "individual" | "company",
    email: "",
    phone: "",
    address: "",
    contact_person: "",
    notes: "",
    status: "active" as "active" | "inactive",
  })

  // Filter parties based on search and filters
  useEffect(() => {
    let filtered = parties

    if (searchTerm) {
      filtered = filtered.filter(
        (party) =>
          party.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
          party.name_ar.includes(searchTerm) ||
          party.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          party.phone?.includes(searchTerm),
      )
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((party) => party.type === typeFilter)
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((party) => party.status === statusFilter)
    }

    setFilteredParties(filtered)
  }, [parties, searchTerm, typeFilter, statusFilter])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingParty) {
        // Update existing party
        const updatedParty = {
          ...editingParty,
          ...formData,
        }
        setParties((prev) => prev.map((p) => (p.id === editingParty.id ? updatedParty : p)))
        toast.success("Party updated successfully")
      } else {
        // Create new party
        const newParty: Party = {
          id: Date.now().toString(),
          ...formData,
          created_at: new Date().toISOString(),
        }
        setParties((prev) => [...prev, newParty])
        toast.success("Party created successfully")
      }

      resetForm()
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error saving party:", error)
      toast.error("Failed to save party")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (party: Party) => {
    setEditingParty(party)
    setFormData({
      name_en: party.name_en,
      name_ar: party.name_ar,
      type: party.type,
      email: party.email || "",
      phone: party.phone || "",
      address: party.address || "",
      contact_person: party.contact_person || "",
      notes: party.notes || "",
      status: party.status,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this party?")) {
      return
    }

    try {
      setParties((prev) => prev.filter((p) => p.id !== id))
      toast.success("Party deleted successfully")
    } catch (error) {
      console.error("Error deleting party:", error)
      toast.error("Failed to delete party")
    }
  }

  const resetForm = () => {
    setFormData({
      name_en: "",
      name_ar: "",
      type: "individual",
      email: "",
      phone: "",
      address: "",
      contact_person: "",
      notes: "",
      status: "active",
    })
    setEditingParty(null)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    resetForm()
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manage Parties</h1>
          <p className="text-muted-foreground">Manage individuals and companies in your system</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Party
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
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
                    onValueChange={(value: "active" | "inactive") =>
                      setFormData((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
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
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                />
              </div>

              {formData.type === "company" && (
                <div>
                  <Label htmlFor="contact_person">Contact Person</Label>
                  <Input
                    id="contact_person"
                    value={formData.contact_person}
                    onChange={(e) => setFormData((prev) => ({ ...prev, contact_person: e.target.value }))}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : editingParty ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="type-filter">Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parties Table */}
      <Card>
        <CardHeader>
          <CardTitle>Parties ({filteredParties.length})</CardTitle>
          <CardDescription>List of all parties in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParties.map((party) => (
                <TableRow key={party.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {party.type === "company" ? (
                        <Building className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <User className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <div className="font-medium">{party.name_en}</div>
                        <div className="text-sm text-muted-foreground">{party.name_ar}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={party.type === "company" ? "default" : "secondary"}>{party.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {party.email && <div>{party.email}</div>}
                      {party.phone && <div className="text-muted-foreground">{party.phone}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={party.status === "active" ? "default" : "secondary"}>{party.status}</Badge>
                  </TableCell>
                  <TableCell>{new Date(party.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(party)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(party.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredParties.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No parties found matching your criteria.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
