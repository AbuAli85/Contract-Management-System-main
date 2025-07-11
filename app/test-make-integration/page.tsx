"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Send,
  FileText,
  Settings,
  Database,
  Webhook,
} from "lucide-react"

export default function TestMakeIntegrationPage() {
  const [testResults, setTestResults] = useState<any>({})
  const [loading, setLoading] = useState<string | null>(null)

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    setLoading(testName)
    try {
      const result = await testFn()
      setTestResults((prev) => ({ ...prev, [testName]: { success: true, data: result } }))
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        [testName]: {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      }))
    } finally {
      setLoading(null)
    }
  }

  const testWebhookConfig = async () => {
    const response = await fetch("/api/test-make-config")
    const data = await response.json()
    if (!response.ok) throw new Error(data.error)
    return data
  }

  const testContractData = async () => {
    const response = await fetch("/api/test-contract-data")
    const data = await response.json()
    if (!response.ok) throw new Error(data.error)
    return data
  }

  const testWebhookPayload = async () => {
    const response = await fetch("/api/test-webhook-payload")
    const data = await response.json()
    if (!response.ok) throw new Error(data.error)
    return data
  }

  const testMakeWebhook = async () => {
    const response = await fetch("/api/test-make-webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ test: true }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error)
    return data
  }

  const TestResult = ({ name, result }: { name: string; result: any }) => {
    if (!result) return null

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {result.success ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
          <span className="font-medium">{name}</span>
        </div>
        {result.success ? (
          <pre className="overflow-auto rounded-lg bg-muted p-3 text-xs">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        ) : (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{result.error}</AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  return (
    <div className="container max-w-6xl space-y-8 py-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Make.com Integration Test</h1>
        <p className="text-muted-foreground">Test and verify your Make.com webhook integration</p>
      </div>

      <Tabs defaultValue="config" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="data">Contract Data</TabsTrigger>
          <TabsTrigger value="payload">Webhook Payload</TabsTrigger>
          <TabsTrigger value="test">Live Test</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuration Check
              </CardTitle>
              <CardDescription>Verify Make.com webhook URL and environment setup</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => runTest("config", testWebhookConfig)}
                disabled={loading === "config"}
              >
                {loading === "config" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Test Configuration
              </Button>

              <TestResult name="Configuration" result={testResults.config} />

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Make sure you have set <code>MAKE_CONTRACT_WEBHOOK_URL</code> in your environment
                  variables.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Contract Data Test
              </CardTitle>
              <CardDescription>
                Check if contracts have all required data for Make.com
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => runTest("data", testContractData)}
                disabled={loading === "data"}
              >
                {loading === "data" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Test Contract Data
              </Button>

              <TestResult name="Contract Data" result={testResults.data} />

              <div className="space-y-2">
                <h4 className="font-medium">Required Fields:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>• Contract Number</div>
                  <div>• First Party Name (EN/AR)</div>
                  <div>• Second Party Name (EN/AR)</div>
                  <div>• Party CRNs</div>
                  <div>• Start/End Dates</div>
                  <div>• Promoter (if applicable)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Webhook Payload Test
              </CardTitle>
              <CardDescription>Preview the payload that will be sent to Make.com</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => runTest("payload", testWebhookPayload)}
                disabled={loading === "payload"}
              >
                {loading === "payload" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Sample Payload
              </Button>

              <TestResult name="Webhook Payload" result={testResults.payload} />

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This shows a sample payload structure. Actual values will come from your contract
                  data.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Live Webhook Test
              </CardTitle>
              <CardDescription>Send a test request to your Make.com webhook</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> This will send a real request to your Make.com webhook.
                  Make sure your scenario is in test mode.
                </AlertDescription>
              </Alert>

              <Button
                onClick={() => runTest("webhook", testMakeWebhook)}
                disabled={loading === "webhook"}
                variant="destructive"
              >
                {loading === "webhook" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Send className="mr-2 h-4 w-4" />
                Send Test Webhook
              </Button>

              <TestResult name="Webhook Response" result={testResults.webhook} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Integration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Configuration</p>
              <Badge variant={testResults.config?.success ? "default" : "secondary"}>
                {testResults.config?.success ? "Ready" : "Not Tested"}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Contract Data</p>
              <Badge variant={testResults.data?.success ? "default" : "secondary"}>
                {testResults.data?.success ? "Valid" : "Not Tested"}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Payload Format</p>
              <Badge variant={testResults.payload?.success ? "default" : "secondary"}>
                {testResults.payload?.success ? "Correct" : "Not Tested"}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Webhook</p>
              <Badge variant={testResults.webhook?.success ? "default" : "secondary"}>
                {testResults.webhook?.success ? "Connected" : "Not Tested"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
