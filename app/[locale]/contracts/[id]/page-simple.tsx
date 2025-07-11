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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <h3 className="text-lg font-semibold">Loading...</h3>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-4 text-3xl font-bold">Contract Detail (Simple)</h1>
        <div className="rounded-lg bg-white p-6 shadow">
          <p>
            <strong>Contract ID:</strong> {contractId}
          </p>
          <p>
            <strong>Locale:</strong> {locale}
          </p>
          <p className="mt-4 text-green-600">✅ Page loaded successfully!</p>
        </div>
      </div>
    </div>
  )
}
