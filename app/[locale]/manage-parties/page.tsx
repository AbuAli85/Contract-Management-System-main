"use client"

import { useEffect, useState, useRef, useMemo, useCallback } from "react"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
  Filter,
  Download,
  Upload,
  MoreHorizontal,
  Trash2,
  Phone,
  Mail,
  Calendar,
  MapPin,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Building,
  Users,
  Globe,
  CreditCard,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getDocumentStatus } from "@/lib/document-status"
import PartyForm from "@/components/party-form"
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
import { Checkbox } from "@/components/ui/checkbox"
import type { Party } from "@/types/supabase"

interface PartyWithContracts extends Party {
  active_contracts_count?: number
  total_contracts_count?: number
  latest_contract_date?: string
  total_contract_value?: number
}

interface PartyStats {
  total: number
  active: number
  inactive: number
  individuals: number
  companies: number
  organizations: number
  withActiveContracts: number
  recentlyAdded: number
}

export default function ManagePartiesPage() {
  const [parties, setParties] = useState<PartyWithContracts[]>([])
  const [stats, setStats] = useState<PartyStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedParty, setSelectedParty] = useState<PartyWithContracts | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [filterDocumentStatus, setFilterDocumentStatus] = useState("all")
  const [sortBy, setSortBy] = useState("name_en")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")
  const [selectedParties, setSelectedParties] = useState<string[]>([])
  const { toast } = useToast()
  const isMountedRef = useRef(true)

  const fetchPartiesWithContractCount = useCallback(async () => {
    if (!isMountedRef.current) return
    setIsLoading(true)

    try {
      const { data: partiesData, error: partiesError } = await supabase
        .from("parties")
        .select("*")
        .order(sortBy, { ascending: sortOrder === "asc" })

      if (partiesError) {
        console.error("Error fetching parties:", partiesError)
        toast({
          title: "Error fetching parties",
          description: partiesError.message,
          variant: "destructive",
        })
        if (isMountedRef.current) {
          setParties([])
          setIsLoading(false)
        }
        return
      }

      if (!partiesData || partiesData.length === 0) {
        if (isMountedRef.current) {
          setParties([])
          setStats({
            total: 0,
            active: 0,
            inactive: 0,
            individuals: 0,
            companies: 0,
            organizations: 0,
            withActiveContracts: 0,
            recentlyAdded: 0,
          })
          setIsLoading(false)
        }
        return
      }

      // Fetch contract counts and values for each party using the new schema
      const partyIds = partiesData.map((p: Party) => p.id)
      
      // Try the new schema first (first_party_id, second_party_id)
      let { data: contractsData, error: contractsError } = await supabase
        .from("contracts")
        .select("first_party_id, second_party_id, contract_end_date, created_at, contract_value, status")
        .or(`first_party_id.in.(${partyIds.join(",")}),second_party_id.in.(${partyIds.join(",")})`)

      // If new schema fails, try fallback schemas
      if (contractsError && contractsError.message.includes('column')) {
        console.warn("New schema failed, trying fallback schemas...")
        
        // Try employer_id, client_id schema
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("contracts")
          .select("employer_id, client_id, contract_end_date, created_at, contract_value, status")
          .or(`employer_id.in.(${partyIds.join(",")}),client_id.in.(${partyIds.join(",")})`)

        if (fallbackError) {
          // Try party_id schema as last resort
          const { data: legacyData, error: legacyError } = await supabase
            .from("contracts")
            .select("party_id, contract_end_date, created_at, contract_value, status")
            .in("party_id", partyIds)

          if (legacyError) {
            console.error("Error fetching contract data:", legacyError)
            toast({
              title: "Error fetching contract data",
              description: legacyError.message,
              variant: "destructive",
            })
            contractsData = []
          } else {
            contractsData = legacyData
          }
        } else {
          contractsData = fallbackData
        }
      }

      const todayStr = format(new Date(), "yyyy-MM-dd")
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

      const partiesWithCounts = partiesData
        .filter((party: Party) => party.id)
        .map((party: Party) => {
          // Filter contracts for this party based on available schema
          let partyContracts: any[] = []
          
          if (contractsData && contractsData.length > 0) {
            const firstContract = contractsData[0]
            
            if ('first_party_id' in firstContract || 'second_party_id' in firstContract) {
              // New schema
              partyContracts = contractsData.filter(c => 
                c.first_party_id === party.id || c.second_party_id === party.id
              )
            } else if ('employer_id' in firstContract || 'client_id' in firstContract) {
              // Fallback schema
              partyContracts = contractsData.filter(c => 
                c.employer_id === party.id || c.client_id === party.id
              )
            } else if ('party_id' in firstContract) {
              // Legacy schema
              partyContracts = contractsData.filter(c => c.party_id === party.id)
            }
          }

          const activeContracts = partyContracts.filter(
            c => c.status === 'active' || (c.contract_end_date && c.contract_end_date >= todayStr)
          ).length
          
          const totalContracts = partyContracts.length
          const totalValue = partyContracts.reduce((sum, c) => sum + (c.contract_value || 0), 0)
          const latestContract = partyContracts.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0]

          return {
            ...party,
            active_contracts_count: activeContracts,
            total_contracts_count: totalContracts,
            total_contract_value: totalValue,
            latest_contract_date: latestContract?.created_at
          }
        })

      // Calculate stats
      const statsData: PartyStats = {
        total: partiesWithCounts.length,
        active: partiesWithCounts.filter(p => p.status === "Active").length,
        inactive: partiesWithCounts.filter(p => p.status === "Inactive").length,
        individuals: partiesWithCounts.filter(p => p.party_type === "individual").length,
        companies: partiesWithCounts.filter(p => p.party_type === "company").length,
        organizations: partiesWithCounts.filter(p => p.party_type === "organization").length,
        withActiveContracts: partiesWithCounts.filter(p => (p.active_contracts_count || 0) > 0).length,
        recentlyAdded: partiesWithCounts.filter(p => new Date(p.created_at) >= thirtyDaysAgo).length,
      }

      if (isMountedRef.current) {
        setParties(partiesWithCounts)
        setStats(statsData)
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
        setParties([])
        setIsLoading(false)
      }
    }
  }, [toast, sortBy, sortOrder])

  useEffect(() => {
    isMountedRef.current = true
    fetchPartiesWithContractCount()

    const partiesChannel = supabase
      .channel("public:parties:manage")
      .on("postgres_changes", { event: "*", schema: "public", table: "parties" }, () =>
        fetchPartiesWithContractCount()
      )
      .subscribe()

    const contractsChannel = supabase
      .channel("public:contracts:manage")
      .on("postgres_changes", { event: "*", schema: "public", table: "contracts" }, () =>
        fetchPartiesWithContractCount()
      )
      .subscribe()

    return () => {
      isMountedRef.current = false
      supabase.removeChannel(partiesChannel)
      supabase.removeChannel(contractsChannel)
    }
  }, [fetchPartiesWithContractCount])

  const handleEdit = (party: PartyWithContracts) => {
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
    fetchPartiesWithContractCount()
  }

  const handleDelete = async (partyId: string) => {
    try {
      const { error } = await supabase
        .from("parties")
        .delete()
        .eq("id", partyId)

      if (error) {
        toast({
          title: "Error deleting party",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Party deleted successfully",
      })
      
      fetchPartiesWithContractCount()
    } catch (error) {
      console.error("Error deleting party:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const handleBulkDelete = async () => {
    if (selectedParties.length === 0) return

    try {
      const { error } = await supabase
        .from("parties")
        .delete()
        .in("id", selectedParties)

      if (error) {
        toast({
          title: "Error deleting parties",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: `${selectedParties.length} parties deleted successfully`,
      })
      
      setSelectedParties([])
      fetchPartiesWithContractCount()
    } catch (error) {
      console.error("Error deleting parties:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const handleExport = () => {
    const csvContent = [
      ["Name (EN)", "Name (AR)", "Type", "Registration Number", "Phone", "Email", "Active Contracts", "Total Contracts", "Total Value"],
      ...filteredParties.map(p => [
        p.name_en,
        p.name_ar,
        p.party_type,
        p.registration_number || "",
        p.phone || "",
        p.email || "",
        p.active_contracts_count || 0,
        p.total_contracts_count || 0,
        p.total_contract_value || 0
      ])
    ].map(row => row.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `parties-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getPartyTypeIcon = (type: string) => {
    switch (type) {
      case "individual":
        return UserIcon
      case "company":
        return Building
      case "organization":
        return Users
      default:
        return Building
    }
  }

  const getPartyTypeBadge = (type: string) => {
    const variants = {
      individual: "default",
      company: "secondary",
      organization: "outline"
    }
    return variants[type as keyof typeof variants] || "default"
  }

  const togglePartySelection = (partyId: string) => {
    setSelectedParties(prev => prev.includes(partyId) ? prev.filter(id => id !== partyId) : [...prev, partyId])
  }

  // Enhanced filtering logic
  const filteredParties = useMemo(() => {
    return parties.filter((party) => {
      const matchesSearchTerm =
        party.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
        party.name_ar.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === "all" || party.status === filterStatus
      const matchesType = filterType === "all" || party.party_type === filterType
      const matchesDocumentStatus = filterDocumentStatus === "all" || getDocumentStatus(party.document_status) === filterDocumentStatus

      return matchesSearchTerm && matchesStatus && matchesType && matchesDocumentStatus
    })
  }, [parties, searchTerm, filterStatus, filterType, filterDocumentStatus])

  if (!isMountedRef.current) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <>
      {showForm ? (
        <PartyForm party={selectedParty} onClose={handleFormClose} />
      ) : (
        <div className="space-y-4">
          {/* Your existing UI components and logic here */}
        </div>
      )}
    </>
  )
}