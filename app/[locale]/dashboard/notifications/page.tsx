'use client'

import { BellIcon, SettingsIcon, Trash2Icon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export default function NotificationsPage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Notifications</h1>
      <p className="text-gray-600">
        Manage your notification preferences and view recent alerts.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellIcon className="h-5 w-5" />
            Recent Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <p className="font-medium">Contract "EMP-001" is due for renewal in 7 days.</p>
              <p className="text-sm text-gray-500">2024-07-15 11:00 AM</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">New contract "SVC-005" has been generated.</p>
              <p className="text-sm text-gray-500">2024-07-14 09:30 AM</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Your profile information has been updated.</p>
              <p className="text-sm text-gray-500">2024-07-13 03:45 PM</p>
            </div>
          </div>
          <div className="mt-6 flex justify-between items-center">
            <Button variant="outline">Load More</Button>
            <Button variant="destructive" size="sm">
              <Trash2Icon className="mr-2 h-4 w-4" />
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-notifications">Email Notifications</Label>
            <Switch id="email-notifications" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="in-app-notifications">In-App Notifications</Label>
            <Switch id="in-app-notifications" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="renewal-reminders">Contract Renewal Reminders</Label>
            <Switch id="renewal-reminders" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
