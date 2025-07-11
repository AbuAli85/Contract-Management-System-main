"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function TestSupabasePage() {
  const [status, setStatus] = useState<string>("Checking...")
  const [error, setError] = useState<string | null>(null)
  const [details, setDetails] = useState<any>(null)

  const testSupabase = async () => {
    try {
      setStatus("Testing Supabase client...")
      setError(null)

      // Check environment variables
      const envCheck = {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ Set" : "✗ Missing",
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓ Set" : "✗ Missing",
      }

      // Try to create client
      const supabase = createClient()

      // Check if client is created
      if (!supabase) {
        throw new Error("Supabase client is undefined")
      }

      // Check if auth object exists
      if (!supabase.auth) {
        throw new Error("Supabase auth object is undefined")
      }

      // Try to get session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      // Try to get user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      setDetails({
        envCheck,
        clientCreated: !!supabase,
        authExists: !!supabase.auth,
        sessionCheck: sessionError
          ? `Error: ${sessionError.message}`
          : session
            ? "Session exists"
            : "No session",
        userCheck: userError
          ? `Error: ${userError.message}`
          : user
            ? `User: ${user.email}`
            : "No user",
      })

      setStatus("✓ Supabase client is working")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      setStatus("✗ Supabase client test failed")
    }
  }

  useEffect(() => {
    testSupabase()
  }, [])

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Supabase Client Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold">Status:</h3>
            <p className={error ? "text-red-600" : "text-green-600"}>{status}</p>
          </div>

          {error && (
            <div>
              <h3 className="font-semibold">Error:</h3>
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {details && (
            <div>
              <h3 className="font-semibold">Details:</h3>
              <pre className="overflow-auto rounded bg-gray-100 p-4">
                {JSON.stringify(details, null, 2)}
              </pre>
            </div>
          )}

          <Button onClick={testSupabase}>Re-test</Button>
        </CardContent>
      </Card>
    </div>
  )
}
