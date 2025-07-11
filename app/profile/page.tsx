"use client"

import { RequireAuth } from "@/components/auth/EnhancedAuth"
import { UserProfileManager } from "@/components/profile/UserProfileManager"

export default function ProfilePage() {
  return (
    <RequireAuth>
      <div className="container mx-auto px-4 py-6">
        <UserProfileManager />
      </div>
    </RequireAuth>
  )
}
