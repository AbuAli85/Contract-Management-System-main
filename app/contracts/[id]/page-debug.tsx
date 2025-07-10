"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

interface ContractDetailDebug {
  id: string
  status?: string | null
  created_at?: string
  contract_start_date?: string | null
  contract_end_date?: string | null
  employer?: any
  client?: any
  promoters?: any
  google_doc_url?: string | null
  error_details?: string | null
}

export default function ContractDetailPage({ params }: { params: { id: string } }) {
  const [contract, setContract] = useState<ContractDetailDebug | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rawData, setRawData] = useState<any>(null)

  useEffect(() => {
    async function fetchContract() {
      try {
        setLoading(true)
        console.log("Fetching contract with ID:", params.id)

        // Simple query first
        const { data: basicData, error: basicError } = await supabase
          .from("contracts")
          .select("*")
          .eq("id", params.id)
          .single()

        if (basicError) {
          console.error("Basic query error:", basicError)
          setError(basicError.message)
          return
        }

        console.log("Basic contract data:", basicData)
        setRawData(basicData)

        // Enhanced query with relations
        const { data, error } = await supabase
          .from("contracts")
          .select(`
            *,
            employer:parties!contracts_employer_id_fkey (name_en, name_ar, crn),
            client:parties!contracts_client_id_fkey (name_en, name_ar, crn),
            promoters(id, name_en, name_ar, id_card_number)
          `)
          .eq("id", params.id)
          .single()

        if (error) {
          console.error("Enhanced query error:", error)
          // Use basic data if enhanced query fails
          setContract(basicData)
        } else {
          console.log("Enhanced contract data:", data)
          setContract(data)
        }
      } catch (err) {
        console.error("Exception:", err)
        setError("Failed to load contract")
      } finally {
        setLoading(false)
      }
    }

    fetchContract()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading contract details...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Error Loading Contract</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-500 mb-4">{error}</p>
              <Button asChild variant="outline">
                <Link href="/contracts">
                  <ArrowLeftIcon className="mr-2 h-4 w-4" />
                  Back to Contracts
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/contracts">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Contracts
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Contract Details</h1>
          <p className="text-gray-600">Contract ID: {params.id}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Contract ID</label>
                <p className="font-mono text-sm">{contract?.id || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <p>{contract?.status || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Created At</label>
                <p>{contract?.created_at ? new Date(contract.created_at).toLocaleString() : "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Start Date</label>
                <p>{contract?.contract_start_date ? new Date(contract.contract_start_date).toLocaleDateString() : "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">End Date</label>
                <p>{contract?.contract_end_date ? new Date(contract.contract_end_date).toLocaleDateString() : "N/A"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Parties */}
          <Card>
            <CardHeader>
              <CardTitle>Parties Involved</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Employer</label>
                <p>{contract?.employer?.name_en || "N/A"}</p>
                {contract?.employer?.name_ar && (
                  <p className="text-sm text-gray-600" dir="rtl">{contract.employer.name_ar}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Client</label>
                <p>{contract?.client?.name_en || "N/A"}</p>
                {contract?.client?.name_ar && (
                  <p className="text-sm text-gray-600" dir="rtl">{contract.client.name_ar}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Promoter</label>
                {contract?.promoters && contract.promoters.length > 0 ? (
                  <div>
                    <p>{contract.promoters[0].name_en || "N/A"}</p>
                    {contract.promoters[0].name_ar && (
                      <p className="text-sm text-gray-600" dir="rtl">{contract.promoters[0].name_ar}</p>
                    )}
                  </div>
                ) : (
                  <p>N/A</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Document */}
          {contract?.google_doc_url && (
            <Card>
              <CardHeader>
                <CardTitle>Generated Document</CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <a href={contract.google_doc_url} target="_blank" rel="noopener noreferrer">
                    View Google Document
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Debug Information */}
          <Card>
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <details>
                <summary className="cursor-pointer font-medium">Raw Data</summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(rawData, null, 2)}
                </pre>
              </details>
              <details>
                <summary className="cursor-pointer font-medium mt-2">Enhanced Data</summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(contract, null, 2)}
                </pre>
              </details>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
