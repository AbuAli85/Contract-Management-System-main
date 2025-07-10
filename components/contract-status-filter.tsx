"use client"

import { useRouter, useSearchParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import React from "react"

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "all" },
  { label: "Pending Generation", value: "PENDING_GENERATION" },
  { label: "Generated Successfully", value: "GENERATED_SUCCESSFULLY" },
  { label: "Email Sent", value: "EMAIL_SENT" },
  { label: "Generation Error", value: "GENERATION_ERROR" },
]

interface ContractStatusFilterProps {
  onSelectStatus?: (status: string) => void
  selectedStatus?: string
}

function ContractStatusFilter({
  onSelectStatus,
  selectedStatus,
}: ContractStatusFilterProps = {}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentStatus = selectedStatus || searchParams?.get("status") || "all"

  const handleStatusChange = (newStatus: string) => {
    if (onSelectStatus) {
      onSelectStatus(newStatus)
    } else {
      const params = new URLSearchParams(searchParams ? searchParams.toString() : "")
      if (newStatus === "all") {
        params.delete("status")
      } else {
        params.set("status", newStatus)
      }
      router.push(`/contracts?${params.toString()}`)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="status-filter" className="text-sm font-medium">
        Filter by Status:
      </Label>
      <Select value={currentStatus} onValueChange={handleStatusChange}>
        <SelectTrigger id="status-filter" className="w-[200px]">
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default ContractStatusFilter
export { ContractStatusFilter }
