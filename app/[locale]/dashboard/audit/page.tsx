"use client"

import { HistoryIcon, FilterIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function AuditLogsPage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Audit Logs</h1>
      <p className="text-gray-600">Review all system activities and changes for compliance and security.</p>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <HistoryIcon className="h-5 w-5" />
            Recent Activities
          </CardTitle>
          <div className="flex items-center gap-2">
            <Input placeholder="Search logs..." className="max-w-sm" />
            <Button variant="outline">
              <FilterIcon className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <p className="font-medium">User &apos;John Doe&apos; updated contract &apos;EMP-001&apos;</p>
              <p className="text-sm text-gray-500">2024-07-15 10:30 AM</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">New contract &apos;SVC-005&apos; created by &apos;Jane Smith&apos;</p>
              <p className="text-sm text-gray-500">2024-07-14 09:15 AM</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">System initiated automatic contract renewal for &apos;PART-010&apos;</p>
              <p className="text-sm text-gray-500">2024-07-13 02:00 AM</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">
                User &apos;Admin&apos; changed user role for &apos;Alice Brown&apos; to &apos;Editor&apos;
              </p>
              <p className="text-sm text-gray-500">2024-07-12 04:45 PM</p>
            </div>
          </div>
          <div className="mt-6 text-center">
            <Button variant="outline">Load More</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
