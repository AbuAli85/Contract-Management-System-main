"use client"

import { RequireAuth } from "@/components/auth/EnhancedAuth"
import { UserProfileManager } from "@/components/profile/UserProfileManager"

export default function ProfilePage() {
  return (
    <RequireAuth>
      <div className="container mx-auto py-6 px-4">
        <UserProfileManager />
      </div>
    </RequireAuth>
  )
}