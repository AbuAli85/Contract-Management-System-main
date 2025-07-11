"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { testAuth } from "@/app/actions/test-auth"

export default function TestServerActionPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleTest = async () => {
    setLoading(true)
    try {
      const res = await testAuth()
      setResult(res)
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : "Unknown error",
        isError: true,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Test Server Action Auth</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleTest} disabled={loading}>
            {loading ? "Testing..." : "Test Auth"}
          </Button>

          {result && (
            <div>
              <h3 className="mb-2 font-semibold">Result:</h3>
              <pre
                className={`overflow-auto rounded bg-gray-100 p-4 ${result.isError ? "text-red-600" : ""}`}
              >
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
