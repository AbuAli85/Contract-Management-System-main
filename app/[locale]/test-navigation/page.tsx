"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import NavigationTester from "@/components/NavigationTester"

export default function TestNavigationPage() {
  const [consoleErrors, setConsoleErrors] = useState<string[]>([])
  const [isListening, setIsListening] = useState(false)

  const startConsoleMonitoring = () => {
    if (isListening) return

    // Store original console methods
    const originalError = console.error
    const originalWarn = console.warn

    // Override console.error
    console.error = (...args) => {
      setConsoleErrors((prev) => [...prev, `ERROR: ${args.join(" ")}`])
      originalError.apply(console, args)
    }

    // Override console.warn
    console.warn = (...args) => {
      setConsoleErrors((prev) => [...prev, `WARN: ${args.join(" ")}`])
      originalWarn.apply(console, args)
    }

    setIsListening(true)
  }

  const clearErrors = () => {
    setConsoleErrors([])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Navigation Testing Dashboard</CardTitle>
            <p className="text-muted-foreground">
              Use this page to systematically test all routes in your application
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Testing Instructions */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h3 className="mb-2 font-semibold text-blue-900">How to Test:</h3>
              <ol className="list-inside list-decimal space-y-1 text-sm text-blue-800">
                <li>Click "Start Console Monitoring" to track errors</li>
                <li>Use the Navigation Tester (bottom right) to open each page</li>
                <li>Mark each route as ✓ (success), ! (warning), or ✗ (error)</li>
                <li>Check the console errors section for any issues</li>
                <li>Test both authenticated and non-authenticated states</li>
              </ol>
            </div>

            {/* Console Monitoring */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Console Monitoring</h3>
                <div className="flex gap-2">
                  <Button
                    onClick={startConsoleMonitoring}
                    disabled={isListening}
                    variant={isListening ? "secondary" : "default"}
                  >
                    {isListening ? "Monitoring Active" : "Start Console Monitoring"}
                  </Button>
                  <Button onClick={clearErrors} variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                </div>
              </div>

              <div className="max-h-64 overflow-auto rounded-lg border bg-gray-50 p-4">
                {consoleErrors.length === 0 ? (
                  <p className="text-sm text-gray-500">No console errors detected yet...</p>
                ) : (
                  <div className="space-y-2">
                    {consoleErrors.map((error, index) => (
                      <div
                        key={index}
                        className={`rounded p-2 font-mono text-xs ${
                          error.startsWith("ERROR")
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {error}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Status Overview */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">0</p>
                      <p className="text-sm text-muted-foreground">Working Pages</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-8 w-8 text-yellow-500" />
                    <div>
                      <p className="text-2xl font-bold">0</p>
                      <p className="text-sm text-muted-foreground">Pages with Warnings</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <XCircle className="h-8 w-8 text-red-500" />
                    <div>
                      <p className="text-2xl font-bold">{consoleErrors.length}</p>
                      <p className="text-sm text-muted-foreground">Errors Found</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Testing Notes */}
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-lg">Testing Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>• This page helps you systematically test all routes</p>
                <p>• Monitor console for hydration mismatches and other errors</p>
                <p>• Test with different user roles and authentication states</p>
                <p>• Check both English and Arabic locales</p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}