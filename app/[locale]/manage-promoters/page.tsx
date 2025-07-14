"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useEffect, useState, useRef, useMemo, useCallback } from "react"
import Link from "next/link"
import {
  EditIcon,
  PlusCircleIcon,
  ArrowLeftIcon,
  UserIcon,
  FileTextIcon,
  Loader2,
  BriefcaseIcon,
  EyeIcon,
  Search,
  Download,
  MoreHorizontal,
    Trash2,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getDocumentStatus } from "@/lib/document-status"
import PromoterForm from "@/components/promoter-form"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

interface PromoterWithContracts extends Promoter {
  active_contracts_count?: number
  total_contracts_count?: number
  latest_contract_date?: string
}

export default function ManagePromotersPage() {
  const [promoters, setPromoters] = useState<PromoterWithContracts[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPromoter, setSelectedPromoter] = useState<PromoterWithContracts | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterDocumentStatus, setFilterDocumentStatus] = useState("all")
  const [sortBy, setSortBy] = useState("name_en")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")
  const [selectedPromoters, setSelectedPromoters] = useState<string[]>([])
  const { toast } = useToast()
  const isMountedRef = useRef(true)

  const fetchPromotersWithContractCount = useCallback(async () => {
    if (!isMountedRef.current) return
    setIsLoading(true)

    try {
      const { data: promotersData, error: promotersError } = await supabase
        .from("promoters")
        .select("*")
        .order(sortBy, { ascending: sortOrder === "asc" })

      if (promotersError) {
        console.error("Error fetching promoters:", promotersError)
        toast({
          title: "Error fetching promoters",
          description: promotersError.message,
          variant: "destructive",
        })
        if (isMountedRef.current) {
          setPromoters([])
          setIsLoading(false)
        }
        return
      }

      if (!promotersData || promotersData.length === 0) {
        if (isMountedRef.current) {
          setPromoters([])
          setIsLoading(false)
        }
        return
      }

      // Fetch contract counts for each promoter
      const promoterIds = promotersData.map((p: Promoter) => p.id)
      const { data: contractsData, error: contractsError } = await supabase
        .from("contracts")
        .select("promoter_id, contract_end_date, created_at")
        .in("promoter_id", promoterIds)

      if (contractsError) {
        console.error("Error fetching contract data:", contractsError)
        toast({
          title: "Error fetching contract data",
          description: contractsError.message,
          variant: "destructive",
        })
      }

      const todayStr = format(new Date(), "yyyy-MM-dd")

      const promotersWithCounts = promotersData
        .filter((promoter: Promoter) => promoter.id)
        .map((promoter: Promoter) => {
          const promoterContracts = contractsData?.filter(c => c.promoter_id === promoter.id) || []
          const activeContracts = promoterContracts.filter(
            c => c.contract_end_date && c.contract_end_date >= todayStr
          ).length
          const totalContracts = promoterContracts.length
          const latestContract = promoterContracts.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0]

          return {
            ...promoter,
            active_contracts_count: activeContracts,
            total_contracts_count: totalContracts,
            latest_contract_date: latestContract?.created_at
          }
        })

      if (isMountedRef.current) {
        setPromoters(promotersWithCounts)
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Unexpected error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
      if (isMountedRef.current) {
        setPromoters([])
        setIsLoading(false)
      }
    }
  }, [toast, sortBy, sortOrder])

  useEffect(() => {
    isMountedRef.current = true
    fetchPromotersWithContractCount()

    const promotersChannel = supabase
      .channel("public:promoters:manage")
      .on("postgres_changes", { event: "*", schema: "public", table: "promoters" }, () =>
        fetchPromotersWithContractCount()
      )
      .subscribe()

    const contractsChannel = supabase
      .channel("public:contracts:manage")
      .on("postgres_changes", { event: "*", schema: "public", table: "contracts" }, () =>
        fetchPromotersWithContractCount()
      )
      .subscribe()

    return () => {
      isMountedRef.current = false
      supabase.removeChannel(promotersChannel)
      supabase.removeChannel(contractsChannel)
    }
  }, [fetchPromotersWithContractCount])

  const handleEdit = (promoter: PromoterWithContracts) => {
    setSelectedPromoter(promoter)
    setShowForm(true)
  }

  const handleAddNew = () => {
    setSelectedPromoter(null)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setSelectedPromoter(null)
    fetchPromotersWithContractCount()
  }

  const handleDelete = async (promoterId: string) => {
    try {
      const { error } = await supabase
        .from("promoters")
        .delete()
        .eq("id", promoterId)

      if (error) {
        toast({
          title: "Error deleting promoter",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Promoter deleted successfully",
      })
      
      fetchPromotersWithContractCount()
    } catch (error) {
      console.error("Error deleting promoter:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const handleBulkDelete = async () => {
    if (selectedPromoters.length === 0) return

    try {
      const { error } = await supabase
        .from("promoters")
        .delete()
        .in("id", selectedPromoters)

      if (error) {
        toast({
          title: "Error deleting promoters",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: `${selectedPromoters.length} promoters deleted successfully`,
      })
      
      setSelectedPromoters([])
      fetchPromotersWithContractCount()
    } catch (error) {
      console.error("Error deleting promoters:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const handleExport = () => {
    const csvContent = [
      ["Name (EN)", "Name (AR)", "ID Card", "Phone", "Email", "Active Contracts", "Total Contracts"],
      ...filteredPromoters.map(p => [
        p.name_en,
        p.name_ar,
        p.id_card_number,
        p.phone || "",
        p.email || "",
        p.active_contracts_count || 0,
        p.total_contracts_count || 0
      ])
    ].map(row => row.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `promoters-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Enhanced filtering logic
  const filteredPromoters = useMemo(() => {
    return promoters.filter((promoter) => {
      const matchesSearchTerm =
        promoter.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promoter.name_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promoter.id_card_number.includes(searchTerm) ||
        (promoter.phone || "").includes(searchTerm) ||
        (promoter.email || "").toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatusFilter =
        filterStatus === "all" ||
        (filterStatus === "active" && (promoter.active_contracts_count || 0) > 0) ||
        (filterStatus === "inactive" && (promoter.active_contracts_count || 0) === 0)

      const idCardStatus = getDocumentStatus(promoter.id_card_expiry_date)
      const matchesDocumentStatusFilter =
        filterDocumentStatus === "all" ||
        filterDocumentStatus === idCardStatus

      return matchesSearchTerm && matchesStatusFilter && matchesDocumentStatusFilter
    })
  }, [promoters, searchTerm, filterStatus, filterDocumentStatus])

  return (
    <div className="container mx-auto py-6">
      <Tabs defaultValue="table" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
        </TabsList>
        <TabsContent value="table">
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterDocumentStatus} onValueChange={setFilterDocumentStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by document status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="valid">Valid</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleExport} disabled={isLoading}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button onClick={handleAddNew} disabled={isLoading}>
                <PlusCircleIcon className="mr-2 h-4 w-4" />
                Add New
              </Button>
            </div>
          </div>
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell className="w-4">
                      <Label className="hidden sm:flex">Select</Label>
                    </TableCell>
                    <TableHead>Name (EN)</TableHead>
                    <TableHead>Name (AR)</TableHead>
                    <TableHead>ID Card</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Active Contracts</TableHead>
                    <TableHead>Total Contracts</TableHead>
                    <TableHead>Latest Contract</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center">
                        <Loader2 className="animate-spin h-6 w-6 mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : filteredPromoters.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center">
                        No promoters found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPromoters.map((promoter) => (
                      <TableRow key={promoter.id}>
                        <TableCell className="w-4">
                          <Label className="hidden sm:flex">
                            <input
                              type="checkbox"
                              className="checkbox"
                              checked={selectedPromoters.includes(promoter.id)}
                              onChange={(e) =>
                                setSelectedPromoters((prev) =>
                                  e.target.checked
                                    ? [...prev, promoter.id]
                                    : prev.filter((id) => id !== promoter.id)
                                )
                              }
                            />
                          </Label>
                        </TableCell>
                        <TableCell>{promoter.name_en}</TableCell>
                        <TableCell>{promoter.name_ar}</TableCell>
                        <TableCell>{promoter.id_card_number}</TableCell>
                        <TableCell>{promoter.phone}</TableCell>
                        <TableCell>{promoter.email}</TableCell>
                        <TableCell>{promoter.active_contracts_count}</TableCell>
                        <TableCell>{promoter.total_contracts_count}</TableCell>
                        <TableCell>
                          {promoter.latest_contract_date
                            ? format(new Date(promoter.latest_contract_date), "dd/MM/yyyy")
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleEdit(promoter)}>
                                <EditIcon className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(promoter.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          {selectedPromoters.length > 0 && (
            <div className="mt-4">
              <Button variant="destructive" onClick={handleBulkDelete} disabled={isLoading}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected ({selectedPromoters.length})
              </Button>
            </div>
          )}
        </TabsContent>
        <TabsContent value="grid">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {isLoading ? (
              <div className="col-span-full flex justify-center items-center h-24">
                <Loader2 className="animate-spin h-6 w-6" />
              </div>
            ) : filteredPromoters.length === 0 ? (
              <div className="col-span-full flex justify-center items-center h-24">
                No promoters found.
              </div>
            ) : (
              filteredPromoters.map((promoter) => (
                <Card key={promoter.id}>
                  <CardHeader>
                    <CardTitle>{promoter.name_en}</CardTitle>
                    <CardDescription>{promoter.name_ar}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between space-x-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">ID Card</p>
                        <p className="text-sm text-muted-foreground">{promoter.id_card_number}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">Phone</p>
                        <p className="text-sm text-muted-foreground">{promoter.phone}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">Email</p>
                        <p className="text-sm text-muted-foreground">{promoter.email}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">Active Contracts</p>
                        <p className="text-sm text-muted-foreground">{promoter.active_contracts_count}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">Total Contracts</p>
                        <p className="text-sm text-muted-foreground">{promoter.total_contracts_count}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">Latest Contract</p>
                        <p className="text-sm text-muted-foreground">
                          {promoter.latest_contract_date
                            ? format(new Date(promoter.latest_contract_date), "dd/MM/yyyy")
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="ghost" onClick={() => handleEdit(promoter)}>
                      <EditIcon className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the promoter and all related data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>No, cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(promoter.id)}>Yes, delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
      {showForm && (
        <PromoterForm
          promoter={selectedPromoter}
          onClose={handleFormClose}
        />
      )}
    </div>
  )
}