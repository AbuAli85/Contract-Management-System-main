"use client"

import type React from "react"
import { Toaster } from "@/components/ui/toaster"
import { Providers } from "@/app/providers"

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      {children}
      <Toaster />
    </Providers>
  )
}
