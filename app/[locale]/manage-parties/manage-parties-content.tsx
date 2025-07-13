"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit, Plus, Search } from "lucide-react"
import { toast } from "sonner"

interface Party {
  id: string
  name: string
  email: string
  phone: string
  type: "individual" | "company"
  status: "active" | "inactive"
  created_at: string
  updated_at: string
}

// Mock data for parties
const mockParties: Party[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1-555-0123",
    type: "individual",
    status: "active",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "2",
    name: "Acme Corporation",
    email: "contact@acme.com",
    phone: "+1-555-0456",
    type: "company",
    status: "active",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "3",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    phone: "+1-555-0789",
    type: "individual",
    status: "inactive",
    created_at: new Date(Date.now() - 259200000).toISOString(),
    updated_at: new Date(Date.now() - 259200000).toISOString(),
  },
]

export default function ManagePartiesContent() {
  const [parties, setParties] = useState<Party[]>(mockParties)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingParty, setEditingParty] = useState<Party | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    type: "individual" as "individual" | "company",
    status: "active" as "active" | "inactive",
  })

  const filteredParties = parties.filter(
    (party) =>
      party.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      party.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (editingParty) {
        // Update existing party
        const updatedParty = {
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
          updated_at: new Date().toISOString(),
        }
        setParties((prev) => [...prev, newParty])
        toast.success("Party created successfully")
      }

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        type: "individual",
        status: "active",
      })
      setEditingParty(null)
      setShowForm(false)
    } catch (error) {
      toast.error("Failed to save party")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (party: Party) => {
    setEditingParty(party)
    setFormData({
      name: party.name,
      email: party.email,
      phone: party.phone,
      type: party.type,
      status: party.status,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this party?")) return

    setIsLoading(true)
    try {
      setParties((prev) => prev.filter((p) => p.id !== id))
      toast.success("Party deleted successfully")
    } catch (error) {
      toast.error("Failed to delete party")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      type: "individual",
      status: "active",
    })
    setEditingParty(null)
    setShowForm(false)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Parties</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Party
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search parties..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingParty ? "Edit Party" : "Add New Party"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
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
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, type: e.target.value as "individual" | "company" }))
                    }
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="individual">Individual</option>
                    <option value="company">Company</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, status: e.target.value as "active" | "inactive" }))
                    }
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : editingParty ? "Update" : "Create"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Parties List */}
      <div className="grid gap-4">
        {filteredParties.map((party) => (
          <Card key={party.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{party.name}</h3>
                    <Badge variant={party.type === "company" ? "default" : "secondary"}>{party.type}</Badge>
                    <Badge variant={party.status === "active" ? "default" : "destructive"}>{party.status}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">{party.email}</p>
                  {party.phone && <p className="text-sm text-gray-600">{party.phone}</p>}
                  <p className="text-xs text-gray-400">Created: {new Date(party.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(party)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(party.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredParties.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No parties found.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
