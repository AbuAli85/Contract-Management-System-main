"use client"

import { useState, useEffect } from "react"
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
  RefreshCw,
  Database,
  Users,
  UserCheck,
  FileText,
  Key,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useParties } from "@/hooks/use-parties"
import { usePromoters } from "@/hooks/use-promoters"
import { createClient } from "@/lib/supabase/client"

export default function DebugDataPage() {
  const { user, isAuthenticated, loading: authLoading, initialized } = useAuth()
  const {
    data: parties,
    isLoading: partiesLoading,
    error: partiesError,
    refetch: refetchParties,
  } = useParties()
  const {
    data: promoters,
    isLoading: promotersLoading,
    error: promotersError,
    refetch: refetchPromoters,
  } = usePromoters()

  const [supabaseTest, setSupabaseTest] = useState<any>(null)
  const [testing, setTesting] = useState(false)

  // Test direct Supabase connection
  const testSupabaseConnection = async () => {
    setTesting(true)
    const supabase = createClient()

    try {
      // Test auth
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      // Test database query
      const { data: testData, error: dbError } = await supabase
        .from("parties")
        .select("count")
        .limit(1)
        .single()

      // Test RLS
      const { data: rlsTest, error: rlsError } = await supabase.from("parties").select("*").limit(5)

      setSupabaseTest({
        auth: {
          hasSession: !!session,
          sessionError: sessionError?.message,
          userId: session?.user?.id,
          userEmail: session?.user?.email,
        },
        database: {
          connected: !dbError,
          error: dbError?.message,
          testQuery: testData,
        },
        rls: {
          canRead: !rlsError,
          error: rlsError?.message,
          rowCount: rlsTest?.length || 0,
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      setSupabaseTest({
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      })
    } finally {
      setTesting(false)
    }
  }

  useEffect(() => {
    testSupabaseConnection()
  }, [])

  const StatusIcon = ({ success }: { success: boolean }) => {
    return success ? (
      <CheckCircle2 className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    )
  }

  return (
    <div className="container max-w-6xl space-y-8 py-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Data Fetching Debug</h1>
        <p className="text-muted-foreground">Test authentication and data fetching from Supabase</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Auth Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <StatusIcon success={isAuthenticated} />
              <span className="text-sm">
                {authLoading
                  ? "Loading..."
                  : isAuthenticated
                    ? "Authenticated"
                    : "Not Authenticated"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Parties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {partiesLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <StatusIcon success={!!parties && !partiesError} />
              )}
              <span className="text-sm">
                {partiesLoading ? "Loading..." : parties ? `${parties.length} loaded` : "No data"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Promoters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {promotersLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <StatusIcon success={!!promoters && !promotersError} />
              )}
              <span className="text-sm">
                {promotersLoading
                  ? "Loading..."
                  : promoters
                    ? `${promoters.length} loaded`
                    : "No data"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Supabase</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {testing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <StatusIcon success={supabaseTest?.database?.connected} />
              )}
              <span className="text-sm">
                {testing ? "Testing..." : supabaseTest?.database?.connected ? "Connected" : "Error"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="auth" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="auth">Authentication</TabsTrigger>
          <TabsTrigger value="supabase">Supabase</TabsTrigger>
          <TabsTrigger value="parties">Parties</TabsTrigger>
          <TabsTrigger value="promoters">Promoters</TabsTrigger>
        </TabsList>

        <TabsContent value="auth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Authentication Details
              </CardTitle>
              <CardDescription>Current authentication state and user information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Initialized:</span>
                  <Badge variant={initialized ? "default" : "secondary"}>
                    {initialized ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Loading:</span>
                  <Badge variant={authLoading ? "secondary" : "default"}>
                    {authLoading ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Authenticated:</span>
                  <Badge variant={isAuthenticated ? "default" : "destructive"}>
                    {isAuthenticated ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>

              {user && (
                <div className="space-y-2 border-t pt-4">
                  <h4 className="font-medium">User Details</h4>
                  <pre className="overflow-auto rounded-lg bg-muted p-3 text-xs">
                    {JSON.stringify(
                      {
                        id: user.id,
                        email: user.email,
                        role: user.role,
                        created_at: user.created_at,
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="supabase" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Supabase Connection Test
              </CardTitle>
              <CardDescription>Direct Supabase connection and query tests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={testSupabaseConnection} disabled={testing} className="w-full">
                {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <RefreshCw className="mr-2 h-4 w-4" />
                Retest Connection
              </Button>

              {supabaseTest && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="flex items-center gap-2 font-medium">
                      Auth Test
                      <StatusIcon success={supabaseTest.auth?.hasSession} />
                    </h4>
                    <pre className="overflow-auto rounded-lg bg-muted p-3 text-xs">
                      {JSON.stringify(supabaseTest.auth, null, 2)}
                    </pre>
                  </div>

                  <div className="space-y-2">
                    <h4 className="flex items-center gap-2 font-medium">
                      Database Test
                      <StatusIcon success={supabaseTest.database?.connected} />
                    </h4>
                    <pre className="overflow-auto rounded-lg bg-muted p-3 text-xs">
                      {JSON.stringify(supabaseTest.database, null, 2)}
                    </pre>
                  </div>

                  <div className="space-y-2">
                    <h4 className="flex items-center gap-2 font-medium">
                      RLS Test
                      <StatusIcon success={supabaseTest.rls?.canRead} />
                    </h4>
                    <pre className="overflow-auto rounded-lg bg-muted p-3 text-xs">
                      {JSON.stringify(supabaseTest.rls, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parties" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Parties Data
              </CardTitle>
              <CardDescription>Parties fetched from Supabase</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => refetchParties()} disabled={partiesLoading} className="w-full">
                {partiesLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <RefreshCw className="mr-2 h-4 w-4" />
                Refetch Parties
              </Button>

              {partiesError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{partiesError.message}</AlertDescription>
                </Alert>
              )}

              {parties && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total Parties:</span>
                    <Badge>{parties.length}</Badge>
                  </div>

                  {parties.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Sample Data (First 3)</h4>
                      <pre className="max-h-96 overflow-auto rounded-lg bg-muted p-3 text-xs">
                        {JSON.stringify(
                          parties.slice(0, 3).map((p) => ({
                            id: p.id,
                            name_en: p.name_en,
                            name_ar: p.name_ar,
                            crn: p.crn,
                            type: p.type,
                            status: p.status,
                          })),
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promoters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Promoters Data
              </CardTitle>
              <CardDescription>Promoters fetched from Supabase</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => refetchPromoters()}
                disabled={promotersLoading}
                className="w-full"
              >
                {promotersLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <RefreshCw className="mr-2 h-4 w-4" />
                Refetch Promoters
              </Button>

              {promotersError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{promotersError.message}</AlertDescription>
                </Alert>
              )}

              {promoters && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total Promoters:</span>
                    <Badge>{promoters.length}</Badge>
                  </div>

                  {promoters.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Sample Data (First 3)</h4>
                      <pre className="max-h-96 overflow-auto rounded-lg bg-muted p-3 text-xs">
                        {JSON.stringify(
                          promoters.slice(0, 3).map((p) => ({
                            id: p.id,
                            name_en: p.name_en,
                            name_ar: p.name_ar,
                            email: p.email,
                            phone: p.phone,
                            id_card_number: p.id_card_number,
                          })),
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
