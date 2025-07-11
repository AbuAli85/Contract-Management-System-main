"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

interface SimpleContract {
  id: string
  status?: string | null
  created_at?: string
  job_title?: string | null
  first_party_name_en?: string | null
  second_party_name_en?: string | null
  promoter_id?: string | null
  work_location?: string | null
  email?: string | null
  contract_number?: string | null
  contract_start_date?: string | null
  contract_end_date?: string | null
}

interface Promoter {
  id: string
  name_en: string
  name_ar?: string | null
}

export default function ContractDetailPage() {
  const params = useParams()
  const contractId = params?.id as string
  const [contract, setContract] = useState<SimpleContract | null>(null)
  const [promoter, setPromoter] = useState<Promoter | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchContract() {
      if (!contractId) return

      try {
        setLoading(true)
        setError(null)

        console.log("Fetching contract with ID:", contractId)

        // Fetch contract details
        const { data: contractData, error: contractError } = await supabase
          .from("contracts")
          .select("*")
          .eq("id", contractId)
          .single()

        if (contractError) {
          console.error("Error fetching contract:", contractError)
          setError(`Failed to fetch contract: ${contractError.message}`)
          return
        }

        console.log("Contract data:", contractData)
        setContract(contractData)

        // Fetch promoter details if available
        if (contractData?.promoter_id) {
          const { data: promoterData, error: promoterError } = await supabase
            .from("promoters")
            .select("*")
            .eq("id", contractData.promoter_id)
            .single()

          if (!promoterError && promoterData) {
            console.log("Promoter data:", promoterData)
            setPromoter(promoterData)
          }
        }
      } catch (err) {
        console.error("Unexpected error:", err)
        setError("An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchContract()
  }, [contractId])

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <div className="mx-auto mb-4 h-32 w-32 animate-spin rounded-full border-b-2 border-blue-500"></div>
          <p>Loading contract details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="rounded border border-red-400 bg-red-100 px-4 py-3 text-center text-red-700">
          <strong>Error:</strong> {error}
        </div>
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="container mx-auto py-8">
        <div className="rounded border border-yellow-400 bg-yellow-100 px-4 py-3 text-center text-yellow-700">
          Contract not found
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Contract Details</h1>
          <p className="text-gray-600">ID: {contract.id}</p>
          <div className="mt-4">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                contract.status === "active"
                  ? "bg-green-100 text-green-800"
                  : contract.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : contract.status === "completed"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
              }`}
            >
              {contract.status || "Unknown"}
            </span>
          </div>
        </div>

        {/* Basic Information */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">Basic Information</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-500">Job Title</label>
              <p className="text-gray-900">{contract.job_title || "N/A"}</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-500">Work Location</label>
              <p className="text-gray-900">{contract.work_location || "N/A"}</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-500">Email</label>
              <p className="text-gray-900">{contract.email || "N/A"}</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-500">
                Contract Number
              </label>
              <p className="text-gray-900">{contract.contract_number || "N/A"}</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-500">Start Date</label>
              <p className="text-gray-900">
                {contract.contract_start_date
                  ? new Date(contract.contract_start_date).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-500">End Date</label>
              <p className="text-gray-900">
                {contract.contract_end_date
                  ? new Date(contract.contract_end_date).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Parties */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">Parties Involved</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-500">Party A</label>
              <p className="text-gray-900">{contract.first_party_name_en || "N/A"}</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-500">Party B</label>
              <p className="text-gray-900">{contract.second_party_name_en || "N/A"}</p>
            </div>
          </div>
        </div>

        {/* Promoter Information */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">Promoter Information</h2>
          {promoter ? (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-500">
                  Promoter Name (English)
                </label>
                <p className="text-gray-900">{promoter.name_en}</p>
              </div>
              {promoter.name_ar && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-500">
                    Promoter Name (Arabic)
                  </label>
                  <p className="text-gray-900">{promoter.name_ar}</p>
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-500">Promoter ID</label>
                <p className="font-mono text-sm text-gray-900">{promoter.id}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No promoter assigned</p>
          )}
        </div>

        {/* Metadata */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">Metadata</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-500">Created At</label>
              <p className="text-gray-900">
                {contract.created_at ? new Date(contract.created_at).toLocaleString() : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Raw Data Debug */}
        <div className="rounded-lg bg-gray-50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Debug Information</h2>
          <details>
            <summary className="mb-2 cursor-pointer text-blue-600 hover:text-blue-800">
              View Raw Contract Data
            </summary>
            <pre className="overflow-auto rounded bg-gray-100 p-4 text-xs">
              {JSON.stringify(contract, null, 2)}
            </pre>
          </details>
          {promoter && (
            <details className="mt-4">
              <summary className="mb-2 cursor-pointer text-blue-600 hover:text-blue-800">
                View Raw Promoter Data
              </summary>
              <pre className="overflow-auto rounded bg-gray-100 p-4 text-xs">
                {JSON.stringify(promoter, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}
