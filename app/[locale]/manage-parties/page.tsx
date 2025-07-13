"use client"

import { useEffect, useState } from "react"

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
  </div>
)

export default function ManagePartiesPage() {
  const [isClient, setIsClient] = useState(false)
  const [ManagePartiesContent, setManagePartiesContent] = useState<any>(null)

  useEffect(() => {
    setIsClient(true)

    // Dynamically import the component only on client side
    import("./manage-parties-content").then((module) => {
      setManagePartiesContent(() => module.default)
    })
  }, [])

  if (!isClient || !ManagePartiesContent) {
    return <LoadingSpinner />
  }

  return <ManagePartiesContent />
}
