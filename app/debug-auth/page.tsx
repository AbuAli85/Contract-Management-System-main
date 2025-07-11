"use client"

import { useAuth } from "@/hooks/use-auth"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function DebugAuthPage() {
  const auth = useAuth()
  const [supabaseSession, setSupabaseSession] = useState<any>(null)
  const [cookies, setCookies] = useState<string>("")

  useEffect(() => {
    // Check Supabase session directly
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      setSupabaseSession({ session, error })
    }
    checkSession()

    // Check cookies
    setCookies(document.cookie)
  }, [])

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug</h1>
      
      <div className="space-y-6">
        <div className="border p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">useAuth Hook State:</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            {JSON.stringify({
              user: auth.user,
              isAuthenticated: auth.isAuthenticated,
              loading: auth.loading,
              initialized: auth.initialized
            }, null, 2)}
          </pre>
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Direct Supabase Session:</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            {JSON.stringify(supabaseSession, null, 2)}
          </pre>
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Browser Cookies:</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            {cookies}
          </pre>
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Current URL:</h2>
          <p className="text-sm">{typeof window !== 'undefined' ? window.location.href : 'SSR'}</p>
        </div>
      </div>
    </div>
  )
}