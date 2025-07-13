"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
  </div>
)

// Dynamically import the component to prevent SSR issues
const ManagePartiesContent = dynamic(() => import("./manage-parties-content"), {
  ssr: false,
  loading: LoadingSpinner,
})

export default function ManagePartiesPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ManagePartiesContent />
    </Suspense>
  )
}
