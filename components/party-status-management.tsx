"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Users,
  Activity,
  MoreHorizontal,
  RefreshCw,
  Download,
  Upload,
} from "lucide-react"
import {
  updatePartyStatus,
  bulkUpdatePartyStatus,
  fetchPartiesWithContractCount,
  searchParties,
} from "@/lib/party-service"
import type { Party } from "@/lib/types"
import { getOverallStatus } from "@/lib/party-utils"

type PartyStatus = "Active" | "Inactive" | "Suspended"
type FilterStatus = "all" | PartyStatus

interface PartyWithStatus extends Party {
  contract_count?: number
  overall_status?: "active" | "warning" | "critical" | "inactive"
}

export function PartyStatusManagement() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const { toast } = useToast()

  const [parties, setParties] = useState<PartyWithStatus[]>([])
  const [filteredParties, setFilteredParties] = useState<PartyWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedParties, setSelectedParties] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all")
  const [bulkStatus, setBulkStatus] = useState<PartyStatus>("Active")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      fetchParties()
    }
  }, [isAuthenticated])

  useEffect(() => {
    filterParties()
  }, [parties, searchTerm, statusFilter])

  const fetchParties = async () => {
    try {
      setError(null)
      setLoading(true)
      const data = await fetchPartiesWithContractCount()

      // Enhance with overall status
      const enhancedData = data.map((party) => ({
        ...party,
        overall_status: getOverallStatus(party),
      }))

      setParties(enhancedData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch parties"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterParties = () => {
    let filtered = parties

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (party) =>
          party.name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          party.name_ar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          party.crn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          party.contact_person?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((party) => party.status === statusFilter)
    }

    setFilteredParties(filtered)
  }

  const handleStatusUpdate = async (partyId: string, newStatus: PartyStatus) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "Authentication required",
        variant: "destructive",
      })
      return
    }

    setActionLoading(partyId)
    try {
      await updatePartyStatus(partyId, newStatus)

      // Update local state
      setParties((prev) =>
        prev.map((party) =>
          party.id === partyId
            ? {
                ...party,
                status: newStatus,
                overall_status: getOverallStatus({ ...party, status: newStatus }),
              }
            : party
        )
      )

      toast({
        title: "Success",
        description: `Party status updated to ${newStatus}`,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update status"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleBulkStatusUpdate = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "Authentication required",
        variant: "destructive",
      })
      return
    }

    if (selectedParties.length === 0) {
      toast({
        title: "Error",
        description: "Please select parties to update",
        variant: "destructive",
      })
      return
    }

    setActionLoading("bulk")
    try {
      await bulkUpdatePartyStatus(selectedParties, bulkStatus)

      // Update local state
      setParties((prev) =>
        prev.map((party) =>
          selectedParties.includes(party.id)
            ? {
                ...party,
                status: bulkStatus,
                overall_status: getOverallStatus({ ...party, status: bulkStatus }),
              }
            : party
        )
      )

      setSelectedParties([])
      toast({
        title: "Success",
        description: `Updated ${selectedParties.length} parties to ${bulkStatus}`,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update statuses"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedParties(filteredParties.map((party) => party.id))
    } else {
      setSelectedParties([])
    }
  }

  const handleSelectParty = (partyId: string, checked: boolean) => {
    if (checked) {
      setSelectedParties((prev) => [...prev, partyId])
    } else {
      setSelectedParties((prev) => prev.filter((id) => id !== partyId))
    }
  }

  const getStatusBadge = (status?: string | null) => {
    switch (status) {
      case "Active":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Active
          </Badge>
        )
      case "Inactive":
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            Inactive
          </Badge>
        )
      case "Suspended":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            Suspended
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getOverallStatusBadge = (status?: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Active
          </Badge>
        )
      case "warning":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="mr-1 h-3 w-3" />
            Warning
          </Badge>
        )
      case "critical":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Critical
          </Badge>
        )
      case "inactive":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            Inactive
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getStatusStats = () => {
    const stats = parties.reduce(
      (acc, party) => {
        const status = party.status || "Unknown"
        acc[status] = (acc[status] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return {
      total: parties.length,
      active: stats.Active || 0,
      inactive: stats.Inactive || 0,
      suspended: stats.Suspended || 0,
      unknown: stats.Unknown || 0,
    }
  }

  // Show loading state while authentication is being checked
  if (authLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Party Status Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            <span className="ml-2">Checking authentication...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show authentication required message
  if (!isAuthenticated || !user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Party Status Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <AlertTriangle className="mr-2 h-5 w-5" />
            <span>Authentication required to access party status management</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const stats = getStatusStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Party Status Management
          </CardTitle>
          <CardDescription>
            Manage party statuses, view overall health, and perform bulk operations
          </CardDescription>
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="ml-auto h-auto p-1"
              >
                ×
              </Button>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Parties</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inactive</p>
                <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
              </div>
              <Clock className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Suspended</p>
                <p className="text-2xl font-bold text-red-600">{stats.suspended}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Selected</p>
                <p className="text-2xl font-bold text-blue-600">{selectedParties.length}</p>
              </div>
              <Filter className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            {/* Search and Filter */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1">
                <Label htmlFor="search">Search Parties</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name, CRN, or contact person..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="sm:w-48">
                <Label htmlFor="status-filter">Filter by Status</Label>
                <Select
                  value={statusFilter}
                  onValueChange={(value: FilterStatus) => setStatusFilter(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button variant="outline" onClick={fetchParties} disabled={loading}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </div>

            <Separator />

            {/* Bulk Operations */}
            <div className="flex flex-col items-end gap-4 sm:flex-row">
              <div className="flex-1">
                <Label>Bulk Status Update</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedParties.length} parties selected
                </p>
              </div>

              <div className="sm:w-48">
                <Label htmlFor="bulk-status">New Status</Label>
                <Select
                  value={bulkStatus}
                  onValueChange={(value: PartyStatus) => setBulkStatus(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleBulkStatusUpdate}
                disabled={selectedParties.length === 0 || actionLoading === "bulk"}
              >
                {actionLoading === "bulk" ? (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-current"></div>
                ) : null}
                Update Selected
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parties Table */}
      <Card>
        <CardHeader>
          <CardTitle>Parties ({filteredParties.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
              <span className="ml-2">Loading parties...</span>
            </div>
          ) : filteredParties.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Users className="mx-auto mb-4 h-12 w-12" />
              <p>No parties found matching your criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-3 text-left">
                      <Checkbox
                        checked={
                          selectedParties.length === filteredParties.length &&
                          filteredParties.length > 0
                        }
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="px-2 py-3 text-left font-medium">Party Name</th>
                    <th className="px-2 py-3 text-left font-medium">CRN</th>
                    <th className="px-2 py-3 text-left font-medium">Type</th>
                    <th className="px-2 py-3 text-left font-medium">Status</th>
                    <th className="px-2 py-3 text-left font-medium">Overall Health</th>
                    <th className="px-2 py-3 text-left font-medium">Contracts</th>
                    <th className="px-2 py-3 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParties.map((party) => (
                    <tr key={party.id} className="border-b hover:bg-muted/50">
                      <td className="px-2 py-3">
                        <Checkbox
                          checked={selectedParties.includes(party.id)}
                          onCheckedChange={(checked) =>
                            handleSelectParty(party.id, checked as boolean)
                          }
                        />
                      </td>
                      <td className="px-2 py-3">
                        <div>
                          <p className="font-medium">{party.name_en}</p>
                          {party.name_ar && (
                            <p className="text-xs text-muted-foreground">{party.name_ar}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-3">{party.crn}</td>
                      <td className="px-2 py-3">
                        <Badge variant="outline">{party.type || "N/A"}</Badge>
                      </td>
                      <td className="px-2 py-3">{getStatusBadge(party.status)}</td>
                      <td className="px-2 py-3">{getOverallStatusBadge(party.overall_status)}</td>
                      <td className="px-2 py-3">
                        <Badge variant="secondary">{party.contract_count || 0}</Badge>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex gap-2">
                          <Select
                            value={party.status || ""}
                            onValueChange={(value: PartyStatus) =>
                              handleStatusUpdate(party.id, value)
                            }
                            disabled={actionLoading === party.id}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Set status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Active">Active</SelectItem>
                              <SelectItem value="Inactive">Inactive</SelectItem>
                              <SelectItem value="Suspended">Suspended</SelectItem>
                            </SelectContent>
                          </Select>
                          {actionLoading === party.id && (
                            <div className="flex items-center">
                              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary"></div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
