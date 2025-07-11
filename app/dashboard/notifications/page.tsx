"use client"

import DashboardLayout from "@/components/dashboard/dashboard-layout"
import { NotificationCenter } from "@/components/notifications/NotificationCenter"

export default function NotificationsPage() {
  return (
    <DashboardLayout>
      <div className="p-4 md:p-8">
        <NotificationCenter />
      </div>
    </DashboardLayout>
  )
}
