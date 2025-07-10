"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"

export default function SimpleContractDetailPage() {
  const params = useParams()
  const contractId = params?.id as string
  const locale = params?.locale as string
  
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log("Contract ID:", contractId)
    console.log("Locale:", locale)
    setLoading(false)
  }, [contractId, locale])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold">Loading...</h3>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Contract Detail (Simple)</h1>
        <div className="bg-white p-6 rounded-lg shadow">
          <p><strong>Contract ID:</strong> {contractId}</p>
          <p><strong>Locale:</strong> {locale}</p>
          <p className="mt-4 text-green-600">✅ Page loaded successfully!</p>
        </div>
      </div>
    </div>
  )
}
