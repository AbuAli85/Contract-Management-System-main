"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Settings, DatabaseZap, Mail, FileSpreadsheet } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input" // For file input
import type React from "react"

export default function AdminTools() {
  const { toast } = useToast()

  const handleBulkImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      toast({
        title: "File Selected",
        description: `Selected file: ${file.name}. Upload logic not implemented.`,
      })
      // Placeholder for actual CSV upload and processing logic
      // e.g., using Supabase Edge Functions or a server-side API route
    }
  }

  const adminActions = [
    {
      label: "Manage Users",
      labelAr: "إدارة المستخدمين",
      icon: Users,
      action: () =>
        toast({
          title: "Manage Users",
          description: "Navigate to user management page (not implemented).",
        }),
    },
    {
      label: "System Settings",
      labelAr: "إعدادات النظام",
      icon: Settings,
      action: () =>
        toast({
          title: "System Settings",
          description: "Navigate to settings page (not implemented).",
        }),
    },
    {
      label: "Database Backup",
      labelAr: "نسخ احتياطي لقاعدة البيانات",
      icon: DatabaseZap,
      action: () =>
        toast({
          title: "Database Backup",
          description: "Trigger database backup (not implemented).",
        }),
    },
    {
      label: "Email Templates",
      labelAr: "قوالب البريد الإلكتروني",
      icon: Mail,
      action: () =>
        toast({
          title: "Email Templates",
          description: "Navigate to email template editor (not implemented).",
        }),
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Tools / أدوات المسؤول</CardTitle>
        <CardDescription>
          Quick access to administrative functions. / وصول سريع إلى الوظائف الإدارية.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {adminActions.map((tool) => (
          <Button
            key={tool.label}
            variant="outline"
            onClick={tool.action}
            className="w-full justify-start p-4 text-left"
          >
            <tool.icon className="mr-3 h-5 w-5" />
            <div>
              <p>{tool.label}</p>
              <p className="text-xs text-muted-foreground">{tool.labelAr}</p>
            </div>
          </Button>
        ))}
        <div className="space-y-2 rounded-md border p-4">
          <label
            htmlFor="bulk-import-input"
            className="flex cursor-pointer items-center gap-2 font-semibold"
          >
            <FileSpreadsheet className="h-5 w-5" />
            <div>
              <p>Bulk Contract Import</p>
              <p className="text-xs text-muted-foreground">استيراد جماعي للعقود</p>
            </div>
          </label>
          <Input
            id="bulk-import-input"
            type="file"
            accept=".csv"
            onChange={handleBulkImport}
            className="mt-1"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Upload a CSV file to import multiple contracts.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
