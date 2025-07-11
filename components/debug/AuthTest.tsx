"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle2, RefreshCw, Eye, EyeOff, Copy } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export function AuthTest() {
  const { user, session, isAuthenticated, loading, initialized, refresh } = useAuth()
  const { toast } = useToast()
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [directTest, setDirectTest] = useState<any>(null)

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

  const runDirectSupabaseTest = async () => {
    try {
      // Test direct Supabase client
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      setDirectTest({
        session: !!session,
        sessionError: sessionError?.message,
        user: !!user,
        userError: userError?.message,
        userId: user?.id,
        userEmail: user?.email,
        sessionExpiry: session?.expires_at,
        accessToken: session?.access_token ? 'Present' : 'Missing',
        refreshToken: session?.refresh_token ? 'Present' : 'Missing'
      })
    } catch (error) {
      setDirectTest({
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  const copyDebugInfo = () => {
    const debugInfo = {
      clientAuth: {
        isAuthenticated,
        loading,
        initialized,
        userId: user?.id,
        userEmail: user?.email
      },
      serverTest: testResult,
      directTest: directTest,
      timestamp: new Date().toISOString()
    }
    
    navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2))
    toast({
      title: "Debug info copied",
      description: "Debug information copied to clipboard"
    })
  }

  useEffect(() => {
    if (initialized && isAuthenticated) {
      runAuthTest()
      runDirectSupabaseTest()
    }
  }, [initialized, isAuthenticated])

  useEffect(() => {
    runDirectSupabaseTest()
  }, [])

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Authentication Debug Center
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyDebugInfo}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Debug Info
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowDetails(!showDetails)}>
              {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showDetails ? 'Hide' : 'Show'} Details
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Client-side Auth Status */}
        <div className="space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            Client-side Authentication Status
            <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="space-y-1">
              <span className="text-muted-foreground">Initialized:</span>
              <Badge variant={initialized ? "default" : "destructive"}>
                {initialized ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">Loading:</span>
              <Badge variant={loading ? "default" : "outline"}>
                {loading ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">Authenticated:</span>
              <Badge variant={isAuthenticated ? "default" : "destructive"}>
                {isAuthenticated ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">User Present:</span>
              <Badge variant={user ? "default" : "destructive"}>
                {user ? "Yes" : "No"}
              </Badge>
            </div>
          </div>
          
          {user && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">User ID:</span>
                <div className="font-mono text-xs bg-gray-100 p-2 rounded mt-1">
                  {user.id}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <div className="font-mono text-xs bg-gray-100 p-2 rounded mt-1">
                  {user.email}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Direct Supabase Test */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Direct Supabase Client Test</h3>
            <Button variant="outline" size="sm" onClick={runDirectSupabaseTest}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Test
            </Button>
          </div>
          
          {directTest && (
            <div className="p-4 bg-gray-50 rounded-lg">
              {directTest.error ? (
                <div className="text-red-600">
                  <span className="font-medium">Error:</span> {directTest.error}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Session:</span>
                    <Badge variant={directTest.session ? "default" : "destructive"} className="ml-2">
                      {directTest.session ? "Present" : "Missing"}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">User:</span>
                    <Badge variant={directTest.user ? "default" : "destructive"} className="ml-2">
                      {directTest.user ? "Present" : "Missing"}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Access Token:</span>
                    <Badge variant={directTest.accessToken === 'Present' ? "default" : "destructive"} className="ml-2">
                      {directTest.accessToken}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Refresh Token:</span>
                    <Badge variant={directTest.refreshToken === 'Present' ? "default" : "destructive"} className="ml-2">
                      {directTest.refreshToken}
                    </Badge>
                  </div>
                </div>
              )}
              
              {showDetails && directTest && !directTest.error && (
                <div className="mt-4 space-y-2 text-xs">
                  <div>
                    <span className="font-medium">User ID:</span>
                    <div className="font-mono bg-white p-2 rounded mt-1">{directTest.userId || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="font-medium">Email:</span>
                    <div className="font-mono bg-white p-2 rounded mt-1">{directTest.userEmail || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="font-medium">Session Expiry:</span>
                    <div className="font-mono bg-white p-2 rounded mt-1">
                      {directTest.sessionExpiry ? new Date(directTest.sessionExpiry * 1000).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                  {directTest.sessionError && (
                    <div>
                      <span className="font-medium text-red-600">Session Error:</span>
                      <div className="bg-red-50 p-2 rounded mt-1">{directTest.sessionError}</div>
                    </div>
                  )}
                  {directTest.userError && (
                    <div>
                      <span className="font-medium text-red-600">User Error:</span>
                      <div className="bg-red-50 p-2 rounded mt-1">{directTest.userError}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Server-side Auth Test */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Server-side Authentication Test</h3>
            <Button variant="outline" size="sm" onClick={runAuthTest} disabled={testing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
              Test API
            </Button>
          </div>
          
          {testResult && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium">API Status:</span>
                <Badge variant={testResult.status === 200 ? "default" : "destructive"}>
                  {testResult.status}
                </Badge>
              </div>
              
              {testResult.authenticated ? (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Server authentication successful</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-muted-foreground">User ID:</span>
                      <div className="font-mono text-xs bg-white p-2 rounded mt-1">
                        {testResult.user?.id}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <div className="font-mono text-xs bg-white p-2 rounded mt-1">
                        {testResult.user?.email}
                      </div>
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

        {/* Troubleshooting */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-3">Common Issues & Solutions:</h4>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex items-start gap-2">
              <span className="font-medium">1.</span>
              <div>
                <strong>Client shows not authenticated but server works:</strong>
                <br />
                Try refreshing the page or clearing browser storage
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium">2.</span>
              <div>
                <strong>Server authentication fails:</strong>
                <br />
                Check if cookies are enabled and not blocked by browser
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium">3.</span>
              <div>
                <strong>Profile missing error:</strong>
                <br />
                User profile may not exist in the profiles table
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium">4.</span>
              <div>
                <strong>Session expired:</strong>
                <br />
                Try signing out and signing back in
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            localStorage.clear()
            sessionStorage.clear()
            window.location.reload()
          }}>
            Clear Storage & Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={async () => {
            await supabase.auth.signOut()
            window.location.href = '/login'
          }}>
            Sign Out & Redirect
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}