"use client"
import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Search, Loader2, ArrowUpDown } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { devLog } from "@/lib/dev-log"
import type { AuditLogItem, AuditLogRow } from "@/lib/dashboard-types"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

type AuditSortKey =
  | keyof AuditLogItem
  | "user"
  | "action"
  | "ipAddress"
  | "timestamp"
  | "details"
  | null

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortKey, setSortKey] = useState<AuditSortKey>("timestamp")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const { toast } = useToast()

  const fetchAuditLogs = async () => {
    setLoading(true)
    try {
      // Mock data for demonstration - replace with actual API call when audit_logs table exists
      const mockData = [
        {
          id: "1",
          user: "admin@example.com",
          action: "contract_created",
          ipAddress: "192.168.1.100",
          timestamp: new Date().toISOString(),
          details: { contract_id: "CT-2024-001", contract_number: "2024-001" }
        },
        {
          id: "2",
          user: "user@example.com",
          action: "contract_updated",
          ipAddress: "192.168.1.101",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          details: { contract_id: "CT-2024-002", field: "status", old_value: "draft", new_value: "active" }
        },
        {
          id: "3",
          user: "System",
          action: "contract_expired",
          ipAddress: "127.0.0.1",
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          details: { contract_id: "CT-2024-003", expiry_date: "2024-01-01" }
        }
      ]
      
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API delay
      setLogs(mockData)
    } catch (error: any) {
      console.error("Error fetching audit logs:", error)
      toast({
        title: "Error Fetching Audit Logs",
        description: error.message,
        variant: "destructive",
      })
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAuditLogs()
  }, [sortKey, sortDirection])

  const filteredLogs = useMemo(() => {
    if (!logs) return []
    return logs.filter(
      (log) =>
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.ipAddress && log.ipAddress.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.details &&
          typeof log.details === "string" && // Basic check for string details
          log.details.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.details &&
          typeof log.details === "object" &&
          JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase())), // Search in stringified JSON
    )
  }, [logs, searchTerm])

  const handleSort = (key: AuditSortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDirection("asc")
    }
  }

  const SortableHeader = ({
    tKey,
    label,
    labelAr,
  }: {
    tKey: AuditSortKey
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
        <CardTitle>Audit Logs / سجلات التدقيق</CardTitle>
        <CardDescription>
          Track system activities and user actions. / تتبع أنشطة النظام وإجراءات المستخدم.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs by user, action, IP, or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8"
          />
        </div>
        <ScrollArea className="h-[400px] rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader tKey="timestamp" label="Timestamp" labelAr="التوقيت" />
                <SortableHeader tKey="user" label="User" labelAr="المستخدم" />
                <SortableHeader tKey="action" label="Action" labelAr="الإجراء" />
                <SortableHeader tKey="ipAddress" label="IP Address" labelAr="عنوان IP" />
                <SortableHeader tKey="details" label="Details" labelAr="التفاصيل" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                  </TableCell>
                </TableRow>
              )}
              {!loading && filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No logs found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{format(new Date(log.timestamp), "MMM d, yyyy HH:mm:ss")}</TableCell>
                    <TableCell>{log.user}</TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>{log.ipAddress}</TableCell>
                    <TableCell className="max-w-xs truncate text-xs">
                      {typeof log.details === "object"
                        ? JSON.stringify(log.details)
                        : log.details || "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
