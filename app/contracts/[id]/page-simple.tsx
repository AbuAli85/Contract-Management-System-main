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
}

export default function ContractDetailPageSimple() {
  const params = useParams()
  const contractId = params?.id as string
  const [contract, setContract] = useState<SimpleContract | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchContract() {
      if (!contractId) return

      try {
        setLoading(true)
        setError(null)

        console.log("Fetching contract with ID:", contractId)

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
        <div className="text-center">Loading contract details...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-red-500 text-center">Error: {error}</div>
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Contract not found</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Contract Details</h1>
          <p className="text-gray-600">ID: {contract.id}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Contract Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-medium">Status:</label>
              <p>{contract.status || 'N/A'}</p>
            </div>
            <div>
              <label className="font-medium">Job Title:</label>
              <p>{contract.job_title || 'N/A'}</p>
            </div>
            <div>
              <label className="font-medium">Party A:</label>
              <p>{contract.first_party_name_en || 'N/A'}</p>
            </div>
            <div>
              <label className="font-medium">Party B:</label>
              <p>{contract.second_party_name_en || 'N/A'}</p>
            </div>
            <div>
              <label className="font-medium">Created:</label>
              <p>{contract.created_at ? new Date(contract.created_at).toLocaleString() : 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
