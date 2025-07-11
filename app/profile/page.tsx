"use client"

import { AuthProvider, RequireAuth } from "@/components/auth/EnhancedAuth"
import { UserProfileManager } from "@/components/profile/UserProfileManager"

export default function ProfilePage() {
  return (
    <AuthProvider>
      <RequireAuth>
        <div className="container mx-auto py-6 px-4">
          <UserProfileManager />
        </div>
      </RequireAuth>
    </AuthProvider>
  )
}