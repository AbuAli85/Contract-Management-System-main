"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Download } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import clsx from "clsx";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

interface AuditLogItem {
  id: string;
  user_id?: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: any;
  created_at: string;
  user_email?: string | null;
  ip_address?: string | null;
  timestamp: string;
}

// Define a type for the payload from Supabase
interface AuditLogPayload {
  new: {
    id: string;
    user_id?: string | null;
    action: string;
    entity_type: string;
    entity_id: string;
    details?: any;
    created_at: string;
  };
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<keyof AuditLogItem>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [error, setError] = useState<string | null>(null);

  // Fetch logs
  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("id, user_id, action, entity_type, entity_id, details, created_at")
        .order(sortKey, { ascending: sortDirection === "asc" });
      if (error) throw error;
      
      // Transform the data to add compatibility fields
      const transformedData = (data || []).map(log => ({
        ...log,
        user_email: log.user_id || null, // For compatibility
        ip_address: null, // Column doesn't exist in schema
        timestamp: log.created_at // Map created_at to timestamp
      }));
      
      setLogs(transformedData);
    } catch (err: any) {
      setError(err.message);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [sortKey, sortDirection]);

  // Fetch logs when sort changes
  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // Real-time subscription (once)
  useEffect(() => {
    const channel = supabase
      .channel("public:audit_logs:feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "audit_logs" },
        (payload: AuditLogPayload) => {
          // Transform the new log data to match our expected format
          const newLog: AuditLogItem = {
            ...payload.new,
            user_email: payload.new.user_id || null,
            ip_address: null, // Column doesn't exist in schema
            timestamp: payload.new.created_at, // Map created_at to timestamp
          };
          setLogs((prev) => [newLog, ...prev]);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filtering, sorting, and pagination
  const filteredLogs = useMemo(() => {
    let filtered = logs;
    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          (log.user_email || "System").toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (log.entity_type && log.entity_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (log.entity_id && log.entity_id.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
          (log.details &&
            typeof log.details === "string" &&
            log.details.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (log.details &&
            typeof log.details === "object" &&
            JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    // Sort
    filtered = [...filtered].sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];
      if (sortKey === "created_at" || sortKey === "timestamp") {
        valA = valA ? new Date(valA as string).getTime() : 0;
        valB = valB ? new Date(valB as string).getTime() : 0;
      }
      if (typeof valA === "string" && typeof valB === "string") {
        return sortDirection === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }
      return 0;
    });
    return filtered;
  }, [logs, searchTerm, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, page, pageSize]);

  // Sorting
  const handleSort = (key: keyof AuditLogItem) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  // Export to CSV
  const exportCSV = () => {
    const headers = ["Timestamp", "User", "Action", "Entity Type", "Entity ID", "Details"];
    const rows = filteredLogs.map((log) => [
      log.timestamp,
      log.user_email || "System",
      log.action,
      log.entity_type || "",
      log.entity_id || "",
      typeof log.details === "object" ? JSON.stringify(log.details) : log.details || "",
    ]);
    const csv =
      [headers, ...rows]
        .map((row) =>
          row
            .map((cell) =>
              typeof cell === "string" && cell.includes(",")
                ? `"${cell.replace(/"/g, '""')}"`
                : cell
            )
            .join(",")
        )
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit_logs.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Reset page on filter/search/page size change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, pageSize]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Audit Logs / سجلات تدقيق النظام</CardTitle>
        <CardDescription>
          Track all system activities and user actions. Search, filter, sort, and export logs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs by user, action, IP, or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8"
              aria-label="Search audit logs"
            />
          </div>
          <div className="flex gap-2 items-center">
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="border rounded px-2 py-1"
              aria-label="Page size"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
            <Button variant="outline" onClick={exportCSV} aria-label="Export CSV">
              <Download className="h-4 w-4 mr-1" /> Export CSV
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("created_at")}
                  aria-sort={sortKey === "created_at" ? (sortDirection === "asc" ? "ascending" : "descending") : undefined}
                >
                  Timestamp {sortKey === "created_at" && (sortDirection === "asc" ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />)}
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("user_id")}
                  aria-sort={sortKey === "user_id" ? (sortDirection === "asc" ? "ascending" : "descending") : undefined}
                >
                  User {sortKey === "user_id" && (sortDirection === "asc" ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />)}
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("action")}
                  aria-sort={sortKey === "action" ? (sortDirection === "asc" ? "ascending" : "descending") : undefined}
                >
                  Action {sortKey === "action" && (sortDirection === "asc" ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />)}
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("entity_type")}
                  aria-sort={sortKey === "entity_type" ? (sortDirection === "asc" ? "ascending" : "descending") : undefined}
                >
                  Entity Type {sortKey === "entity_type" && (sortDirection === "asc" ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />)}
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("entity_id")}
                  aria-sort={sortKey === "entity_id" ? (sortDirection === "asc" ? "ascending" : "descending") : undefined}
                >
                  Entity ID {sortKey === "entity_id" && (sortDirection === "asc" ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />)}
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("details")}
                  aria-sort={sortKey === "details" ? (sortDirection === "asc" ? "ascending" : "descending") : undefined}
                >
                  Details {sortKey === "details" && (sortDirection === "asc" ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />)}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : paginatedLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <span className="text-4xl mb-2">🗒️</span>
                    <div>No logs found matching your criteria.</div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-blue-50 transition">
                    <TableCell>{log.timestamp ? format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss') : "-"}</TableCell>
                    <TableCell>{log.user_email || "System"}</TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>{log.entity_type || "-"}</TableCell>
                    <TableCell>{log.entity_id || "-"}</TableCell>
                    <TableCell>
                      {typeof log.details === "object"
                        ? JSON.stringify(log.details)
                        : log.details || "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center gap-2 mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <span>
              Page {page} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              aria-label="Next page"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="text-sm text-muted-foreground mt-2">
          Showing {paginatedLogs.length} of {filteredLogs.length} logs
        </div>
        {error && (
          <div className="text-red-600 mt-2" role="alert">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
