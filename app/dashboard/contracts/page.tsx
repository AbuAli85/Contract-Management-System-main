"use client"
import DashboardLayout from "@/components/dashboard/dashboard-layout"
import ContractReportsTable from "@/components/dashboard/contract-reports-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { FilePlus2Icon } from "lucide-react"

export default function ContractsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Manage Contracts / إدارة العقود</h1>
          <Button asChild>
            <Link href="/generate-contract">
              <FilePlus2Icon className="mr-2 h-5 w-5" />
              Generate New Contract
            </Link>
          </Button>
        </div>
        <ContractReportsTable />
        {/* Additional contract management features can be added here */}
      </div>
    </DashboardLayout>
  )
}
