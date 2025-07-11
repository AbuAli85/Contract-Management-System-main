"use client"

import { useState } from "react"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { CheckCircle2, XCircle, Info, Copy, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function TestAuthPage() {
  const { supabase } = useSupabase()
  const { toast } = useToast()

  const [email, setEmail] = useState("test@example.com")
  const [password, setPassword] = useState("Test123!")
  const [showPassword, setShowPassword] = useState(false)
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<any>(null)

  const testCredentials = [
    { email: "test@example.com", password: "Test123!", description: "Default test account" },
    {
      email: "admin@example.com",
      password: "Admin123!",
      description: "Admin account (if created)",
    },
    { email: "user@example.com", password: "User123!", description: "User account (if created)" },
  ]

  const testAuth = async () => {
    setTesting(true)
    setResult(null)
    setError(null)

    try {
      console.log("Testing with:", { email, password: password.replace(/./g, "*") })

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      })

      if (authError) {
        console.error("Auth error:", authError)
        setError({
          message: authError.message,
          status: authError.status,
          code: authError.code,
          details: authError,
        })
      } else {
        console.log("Auth success:", data)
        setResult({
          success: true,
          user: data.user,
          session: data.session,
        })

        // Sign out immediately to not interfere with the main app
        await supabase.auth.signOut()

        toast({
          title: "Authentication Successful!",
          description: "These credentials work. You can use them in the main login form.",
        })
      }
    } catch (err: any) {
      console.error("Unexpected error:", err)
      setError({
        message: err.message || "Unexpected error occurred",
        details: err,
      })
    } finally {
      setTesting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Copied to clipboard",
    })
  }

  const quickTest = (creds: (typeof testCredentials)[0]) => {
    setEmail(creds.email)
    setPassword(creds.password)
  }

  return (
    <div className="container max-w-4xl space-y-6 py-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Authentication Test Page</h1>
        <p className="text-muted-foreground">
          Test your authentication credentials to ensure they work before using them in the app.
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This page helps you verify that your credentials are working correctly. It will sign in
          and immediately sign out to avoid interfering with your main app session.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Test Form */}
        <Card>
          <CardHeader>
            <CardTitle>Test Credentials</CardTitle>
            <CardDescription>Enter credentials to test</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="test@example.com"
                />
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(email)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(password)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button onClick={testAuth} disabled={testing || !email || !password} className="w-full">
              {testing ? "Testing..." : "Test Authentication"}
            </Button>

            {/* Result Display */}
            {result && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <strong className="text-green-800">Success!</strong>
                  <div className="mt-2 text-sm">
                    <p>User ID: {result.user?.id}</p>
                    <p>Email: {result.user?.email}</p>
                    <p>Session: {result.session ? "Created" : "No session"}</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription>
                  <strong className="text-red-800">Authentication Failed</strong>
                  <div className="mt-2 text-sm">
                    <p>Error: {error.message}</p>
                    {error.status && <p>Status: {error.status}</p>}
                    {error.code && <p>Code: {error.code}</p>}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Quick Test Credentials */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Test</CardTitle>
            <CardDescription>Click to load test credentials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {testCredentials.map((creds, index) => (
              <div
                key={index}
                className="cursor-pointer rounded-lg border p-3 transition-colors hover:bg-muted/50"
                onClick={() => quickTest(creds)}
              >
                <div className="font-medium">{creds.email}</div>
                <div className="text-sm text-muted-foreground">{creds.description}</div>
                <div className="mt-1 font-mono text-xs">Password: {creds.password}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Troubleshooting Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
            <p>
              <strong>Invalid login credentials:</strong>
            </p>
            <ul className="ml-4 list-inside list-disc space-y-1">
              <li>Make sure you're using the exact email and password (case-sensitive)</li>
              <li>Check for spaces before or after the email</li>
              <li>Ensure Caps Lock is off</li>
              <li>Try the working test account: test@example.com / Test123!</li>
            </ul>
          </div>

          <div className="space-y-2 text-sm">
            <p>
              <strong>If test@example.com works here but not in the main form:</strong>
            </p>
            <ul className="ml-4 list-inside list-disc space-y-1">
              <li>Clear your browser cache and cookies</li>
              <li>Try in an incognito/private window</li>
              <li>Check browser console for additional errors</li>
              <li>Make sure you're not already signed in with a different account</li>
            </ul>
          </div>

          <div className="space-y-2 text-sm">
            <p>
              <strong>To create new users:</strong>
            </p>
            <ul className="ml-4 list-inside list-disc space-y-1">
              <li>Go to Supabase Dashboard → Authentication → Users</li>
              <li>Click "Add user" → "Create new user"</li>
              <li>Check "Auto Confirm Email" for immediate access</li>
              <li>Use a strong password (uppercase, lowercase, number)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
