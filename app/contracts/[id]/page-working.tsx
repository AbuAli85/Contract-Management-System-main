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
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading contract details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-center">
          <strong>Error:</strong> {error}
        </div>
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded text-center">
          Contract not found
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Contract Details</h1>
          <p className="text-gray-600">ID: {contract.id}</p>
          <div className="mt-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              contract.status === 'active' ? 'bg-green-100 text-green-800' :
              contract.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              contract.status === 'completed' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {contract.status || 'Unknown'}
            </span>
          </div>
        </div>
        
        {/* Basic Information */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-6 text-gray-900">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Job Title</label>
              <p className="text-gray-900">{contract.job_title || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Work Location</label>
              <p className="text-gray-900">{contract.work_location || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
              <p className="text-gray-900">{contract.email || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Contract Number</label>
              <p className="text-gray-900">{contract.contract_number || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Start Date</label>
              <p className="text-gray-900">
                {contract.contract_start_date ? new Date(contract.contract_start_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">End Date</label>
              <p className="text-gray-900">
                {contract.contract_end_date ? new Date(contract.contract_end_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Parties */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-6 text-gray-900">Parties Involved</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Party A</label>
              <p className="text-gray-900">{contract.first_party_name_en || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Party B</label>
              <p className="text-gray-900">{contract.second_party_name_en || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Promoter Information */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-6 text-gray-900">Promoter Information</h2>
          {promoter ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Promoter Name (English)</label>
                <p className="text-gray-900">{promoter.name_en}</p>
              </div>
              {promoter.name_ar && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Promoter Name (Arabic)</label>
                  <p className="text-gray-900">{promoter.name_ar}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Promoter ID</label>
                <p className="text-gray-900 font-mono text-sm">{promoter.id}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No promoter assigned</p>
          )}
        </div>

        {/* Metadata */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-6 text-gray-900">Metadata</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Created At</label>
              <p className="text-gray-900">
                {contract.created_at ? new Date(contract.created_at).toLocaleString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Raw Data Debug */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Debug Information</h2>
          <details>
            <summary className="cursor-pointer text-blue-600 hover:text-blue-800 mb-2">
              View Raw Contract Data
            </summary>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
              {JSON.stringify(contract, null, 2)}
            </pre>
          </details>
          {promoter && (
            <details className="mt-4">
              <summary className="cursor-pointer text-blue-600 hover:text-blue-800 mb-2">
                View Raw Promoter Data
              </summary>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
                {JSON.stringify(promoter, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}
