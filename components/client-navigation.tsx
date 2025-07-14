"use client"

import { useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import MainNavigation from "@/components/main-navigation"

export function ClientNavigation() {
  const { user, loading } = useAuth()

  if (loading) {
    return null // Or a loading skeleton
  }

  return <MainNavigation />
}