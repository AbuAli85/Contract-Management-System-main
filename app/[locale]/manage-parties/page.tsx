"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"

// Dynamically import the component to prevent SSR issues
const ManagePartiesContent = dynamic(() => import("./manage-parties-content"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>
  ),
})

export default function ManagePartiesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      }
    >
      <ManagePartiesContent />
    </Suspense>
  )
}
