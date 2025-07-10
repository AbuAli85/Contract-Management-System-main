"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { Promoter } from "@/lib/types"

export default function TestPromotersPage() {
  const [promoters, setPromoters] = useState<Promoter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPromoters() {
      console.log("Fetching promoters...")
      setIsLoading(true)
      setError(null)

      try {
        const { data, error } = await supabase
          .from("promoters")
          .select("*")
          .order("name_en")

        console.log("Supabase response:", { data, error })

        if (error) {
          console.error("Error fetching promoters:", error)
          setError(error.message)
        } else {
          console.log("Promoters fetched successfully:", data)
          setPromoters(data || [])
        }
      } catch (err) {
        console.error("Unexpected error:", err)
        setError("Unexpected error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPromoters()
  }, [])

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Test Promoters Page</h1>
        <p>Loading promoters...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Test Promoters Page</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Promoters Page</h1>
      
      <div className="mb-4">
        <p className="text-green-600 font-semibold">
          ✅ Successfully fetched {promoters.length} promoters
        </p>
      </div>

      {promoters.length === 0 ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <strong>No promoters found</strong> - The database query returned an empty array.
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Promoters in Database:</h2>
          {promoters.map((promoter) => (
            <div key={promoter.id} className="border border-gray-200 p-4 rounded">
              <h3 className="font-semibold">{promoter.name_en}</h3>
              <p className="text-gray-600" dir="rtl">{promoter.name_ar}</p>
              <p className="text-sm text-gray-500">ID: {promoter.id_card_number}</p>
              <p className="text-sm text-gray-500">Status: {promoter.status}</p>
              <p className="text-sm text-gray-500">Database ID: {promoter.id}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Debug Information:</h3>
        <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
        <p><strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing'}</p>
        <p><strong>Supabase Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}</p>
      </div>
    </div>
  )
}
