"use client"

import DashboardLayout from "@/components/dashboard/dashboard-layout"
import { EnhancedDashboard } from "@/components/dashboard/EnhancedDashboard"

export default function DashboardContent() {
  return (
    <DashboardLayout>
      <EnhancedDashboard />
    </DashboardLayout>
  )
}