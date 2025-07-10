"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/date-picker-with-range"
import { Badge } from "@/components/ui/badge"
import { Download, Search, ArrowUpDown, Loader2 } from "lucide-react"
import type { ContractReportItem } from "@/lib/dashboard-types"
import { supabase } from "@/lib/supabase"
import { devLog } from "@/lib/dev-log"
import { format, parseISO, isValid } from "date-fns"
import type { DateRange } from "react-day-picker"
import { useToast } from "@/hooks/use-toast"

type SortKey =
  | keyof ContractReportItem
  | "contract_id"
  | "promoter_name"
  | "employer_name"
  | "client_name"
  | "start_date"
  | "end_date"
  | "status"
  | null

export default function ContractReportsTable() {
  const [contracts, setContracts] = useState<ContractReportItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [sortKey, setSortKey] = useState<SortKey>("start_date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const { toast } = useToast()

  const fetchContracts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("contracts")
        .select(
          `id, 
           contract_start_date, 
           contract_end_date, 
           status,
           job_title,
           first_party:parties!first_party_id(name_en),
           second_party:parties!second_party_id(name_en),
           promoter:promoters!promoter_id(name_en)`
        )
        .order(sortKey === 'start_date' ? 'contract_start_date' : sortKey === 'end_date' ? 'contract_end_date' : sortKey || "contract_start_date", { ascending: sortDirection === "asc" })

      if (error) throw error
      
      // Map the data to match ContractReportItem structure
      const mappedData = data?.map(contract => ({
        id: contract.id,
        contract_id: contract.id, // Using id as contract_id since contract_number doesn't exist
        promoter_name: contract.promoter?.name_en || '',
        employer_name: contract.second_party?.name_en || '', // Party B (Employer)
        client_name: contract.first_party?.name_en || '', // Party A (Client)
        start_date: contract.contract_start_date,
        end_date: contract.contract_end_date,
        status: contract.status
      })) || []
      
      setContracts(mappedData as ContractReportItem[])
    } catch (error: any) {
      console.error("Error fetching contracts:", error)
      toast({
        title: "Error Fetching Contracts",
        description: error.message,
        variant: "destructive",
      })
      setContracts([]) // Clear contracts on error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContracts()
  }, [sortKey, sortDirection])

  useEffect(() => {
    // For views, Supabase Realtime listens to changes on the underlying tables.
    // So, we subscribe to `contracts`, `promoters`, and `parties`.
    const handleTableChange = (payload: any, tableName: string) => {
      devLog(`${tableName} table change for view:`, payload)
      toast({
        title: "Contract Data Updated",
        description: `Refreshing contract list due to changes in ${tableName}.`,
      })
      fetchContracts() // Refetch data from the view
    }

    const contractsBaseChannel = supabase
      .channel("public:contracts:for-view")
      .on("postgres_changes", { event: "*", schema: "public", table: "contracts" }, (p) =>
        handleTableChange(p, "contracts"),
      )
      .subscribe()
    const promotersChannel = supabase
      .channel("public:promoters:for-view")
      .on("postgres_changes", { event: "*", schema: "public", table: "promoters" }, (p) =>
        handleTableChange(p, "promoters"),
      )
      .subscribe()
    const partiesChannel = supabase
      .channel("public:parties:for-view")
      .on("postgres_changes", { event: "*", schema: "public", table: "parties" }, (p) =>
        handleTableChange(p, "parties"),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(contractsBaseChannel)
      supabase.removeChannel(promotersChannel)
      supabase.removeChannel(partiesChannel)
    }
  }, []) // subscribe once

  const filteredData = useMemo(() => {
    if (!contracts) return []
    return contracts.filter((item) => {
      const sDate = parseISO(item.start_date)
      const eDate = parseISO(item.end_date)

      const matchesSearch =
        (item.contract_id?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (item.promoter_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (item.employer_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (item.client_name?.toLowerCase() || "").includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || item.status === statusFilter
      const matchesDate =
        !dateRange ||
        !dateRange.from ||
        !dateRange.to ||
        (isValid(sDate) && isValid(eDate) && sDate >= dateRange.from && eDate <= dateRange.to)
      return matchesSearch && matchesStatus && matchesDate
    })
  }, [contracts, searchTerm, statusFilter, dateRange])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDirection("asc")
    }
  }

  const getStatusBadgeClass = (status: ContractReportItem["status"]) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-700 border-green-300 dark:bg-green-700/20 dark:text-green-300 dark:border-green-700"
      case "Expired":
        return "bg-red-100 text-red-700 border-red-300 dark:bg-red-700/20 dark:text-red-300 dark:border-red-700"
      case "Soon-to-Expire":
        return "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-700/20 dark:text-orange-300 dark:border-orange-700"
      default: // Covers "Pending Approval", "Draft", and any other status
        return "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-700/20 dark:text-gray-300 dark:border-gray-700"
    }
  }

  const handleExportCSV = () => {
    const headers = [
      "Contract ID",
      "Promoter",
      "Employer",
      "Client",
      "Start Date",
      "End Date",
      "Status",
    ]
    const rows = filteredData.map((item) =>
      [
        item.contract_id,
        item.promoter_name,
        item.employer_name,
        item.client_name,
        isValid(parseISO(item.start_date)) ? format(parseISO(item.start_date), "dd-MM-yyyy") : "",
        isValid(parseISO(item.end_date)) ? format(parseISO(item.end_date), "dd-MM-yyyy") : "",
        item.status,
      ].join(","),
    )
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n")
    const link = document.createElement("a")
    link.setAttribute("href", encodeURI(csvContent))
    link.setAttribute("download", "contract_reports.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const SortableHeader = ({
    tKey,
    label,
    labelAr,
  }: {
    tKey: SortKey
    label: string
    labelAr: string
  }) => (
    <TableHead onClick={() => handleSort(tKey)} className="cursor-pointer hover:bg-muted/50">
      <div className="flex items-center">
        {label} / {labelAr}
        {sortKey === tKey && <ArrowUpDown className="ml-2 h-4 w-4" />}
      </div>
    </TableHead>
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <CardTitle>Contract Reports / تقارير العقود</CardTitle>
            <CardDescription>Detailed list of contracts. / قائمة مفصلة بالعقود.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={loading || filteredData.length === 0}
            >
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex flex-col gap-4 rounded-md border bg-muted/50 p-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID, Promoter, Company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Expired">Expired</SelectItem>
              <SelectItem value="Soon-to-Expire">Soon-to-Expire</SelectItem>
              <SelectItem value="Pending Approval">Pending Approval</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
            </SelectContent>
          </Select>
          <DatePickerWithRange
            date={dateRange}
            onDateChange={setDateRange}
            className="w-full md:w-auto"
          />
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader tKey="contract_id" label="Contract ID" labelAr="معرف العقد" />
                <SortableHeader tKey="promoter_name" label="Promoter" labelAr="المروج" />
                <SortableHeader tKey="employer_name" label="Party B" labelAr="الطرف ب" />
                <SortableHeader tKey="client_name" label="Party A" labelAr="الطرف أ" />
                <SortableHeader tKey="start_date" label="Start Date" labelAr="تاريخ البدء" />
                <SortableHeader tKey="end_date" label="End Date" labelAr="تاريخ الانتهاء" />
                <SortableHeader tKey="status" label="Status" labelAr="الحالة" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.contract_id}</TableCell>
                    <TableCell>{item.promoter_name}</TableCell>
                    <TableCell>{item.employer_name}</TableCell>
                    <TableCell>{item.client_name}</TableCell>
                    <TableCell>
                      {isValid(parseISO(item.start_date))
                        ? format(parseISO(item.start_date), "dd-MM-yyyy")
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {isValid(parseISO(item.end_date))
                        ? format(parseISO(item.end_date), "dd-MM-yyyy")
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeClass(item.status)}>{item.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No contracts found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
