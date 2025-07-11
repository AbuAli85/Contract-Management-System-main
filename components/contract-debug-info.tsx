"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Bug, CheckCircle2, XCircle } from "lucide-react"

interface ContractDebugInfoProps {
  contractId: string
}

export function ContractDebugInfo({ contractId }: ContractDebugInfoProps) {
  const [loading, setLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const runDebug = async () => {
    setLoading(true)
    setError(null)
    setDebugInfo(null)

    try {
      const response = await fetch(`/api/contracts/test-generate/${contractId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Debug failed")
      }

      setDebugInfo(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Debug Information
        </CardTitle>
        <CardDescription>Check contract data and configuration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runDebug} disabled={loading} variant="outline" className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Debug...
            </>
          ) : (
            <>
              <Bug className="mr-2 h-4 w-4" />
              Run Debug Check
            </>
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {debugInfo && (
          <div className="space-y-4">
            {/* Configuration Status */}
            <div className="space-y-2">
              <h4 className="font-medium">Configuration</h4>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Make.com Webhook</span>
                  <Badge variant={debugInfo.hasWebhookUrl ? "default" : "destructive"}>
                    {debugInfo.webhookUrlConfigured}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Contract Data */}
            <div className="space-y-2">
              <h4 className="font-medium">Contract Data</h4>
              <div className="space-y-1 rounded-lg border p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Number:</span>
                  <span className="font-mono">{debugInfo.contractData.number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="outline">{debugInfo.contractData.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">First Party:</span>
                  <span>{debugInfo.contractData.firstParty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Second Party:</span>
                  <span>{debugInfo.contractData.secondParty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Promoter:</span>
                  <span>{debugInfo.contractData.promoter}</span>
                </div>
              </div>
            </div>

            {/* Missing Fields */}
            {debugInfo.missingFields && debugInfo.missingFields.length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  <strong>Missing fields:</strong> {debugInfo.missingFields.join(", ")}
                </AlertDescription>
              </Alert>
            )}

            {/* Success Message */}
            {debugInfo.missingFields && debugInfo.missingFields.length === 0 && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  All required fields are present. Contract is ready for generation.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
