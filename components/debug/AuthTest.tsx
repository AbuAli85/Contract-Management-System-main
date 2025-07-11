"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react"

export function AuthTest() {
  const { user, isAuthenticated, loading } = useAuth()
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)

  const runAuthTest = async () => {
    setTesting(true)
    try {
      const response = await fetch('/api/test-auth', {
        credentials: 'include'
      })
      const result = await response.json()
      setTestResult({ ...result, status: response.status })
    } catch (error) {
      setTestResult({ 
        error: 'Network error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        status: 0
      })
    } finally {
      setTesting(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      runAuthTest()
    }
  }, [isAuthenticated])

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          Authentication Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Client-side Auth Status */}
        <div className="space-y-2">
          <h3 className="font-medium">Client-side Authentication</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Loading:</span>
              <Badge variant={loading ? "default" : "outline"} className="ml-2">
                {loading ? "Yes" : "No"}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Authenticated:</span>
              <Badge variant={isAuthenticated ? "default" : "destructive"} className="ml-2">
                {isAuthenticated ? "Yes" : "No"}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">User ID:</span>
              <span className="ml-2 font-mono text-xs">{user?.id || "None"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Email:</span>
              <span className="ml-2">{user?.email || "None"}</span>
            </div>
          </div>
        </div>

        {/* Server-side Auth Test */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Server-side Authentication Test</h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={runAuthTest}
              disabled={testing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
              Test
            </Button>
          </div>
          
          {testResult && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant={testResult.status === 200 ? "default" : "destructive"}>
                  {testResult.status}
                </Badge>
              </div>
              
              {testResult.authenticated ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Server authentication successful</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-muted-foreground">User ID:</span>
                      <span className="ml-2 font-mono text-xs">{testResult.user?.id}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <span className="ml-2">{testResult.user?.email}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Role:</span>
                      <Badge variant="outline" className="ml-2">
                        {testResult.user?.role || "user"}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Profile:</span>
                      <Badge variant={testResult.profile ? "default" : "destructive"} className="ml-2">
                        {testResult.profile ? "Found" : "Missing"}
                      </Badge>
                    </div>
                  </div>
                  
                  {testResult.profileError && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                      <span className="font-medium">Profile Error:</span> {testResult.profileError}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span>Server authentication failed</span>
                  </div>
                  <div className="text-red-600">
                    <span className="font-medium">Error:</span> {testResult.error}
                  </div>
                  {testResult.details && (
                    <div className="text-red-600 text-xs">
                      <span className="font-medium">Details:</span> {testResult.details}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recommendations */}
        {testResult && !testResult.authenticated && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Troubleshooting Steps:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>1. Make sure you're logged in</li>
              <li>2. Check if cookies are enabled in your browser</li>
              <li>3. Try refreshing the page</li>
              <li>4. Clear browser cache and cookies</li>
              <li>5. Check browser console for errors</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}