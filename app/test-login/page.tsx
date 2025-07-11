"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { AuthStatus } from "@/components/auth/AuthStatus"
import { Eye, EyeOff, LogIn, UserPlus, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"

export default function TestLoginPage() {
  const { user, isAuthenticated, loading, refresh } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    
    try {
      if (mode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (error) {
          throw error
        }

        toast({
          title: "Success",
          description: "Signed in successfully!",
        })

        // Refresh auth state
        await refresh()
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
        
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        })

        if (error) {
          throw error
        }

        toast({
          title: "Success",
          description: "Account created! Please check your email for verification.",
        })

        // Switch to sign in mode
        setMode('signin')
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      toast({
        title: "Error",
        description: error.message || "Authentication failed",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      toast({
        title: "Success",
        description: "Signed out successfully",
      })
      
      await refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Sign out failed",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testCredentials = [
    { email: "admin@example.com", password: "admin123" },
    { email: "user@example.com", password: "user123" },
    { email: "test@test.com", password: "test123" }
  ]

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Authentication Test</h1>
          <p className="text-muted-foreground mt-2">
            Test login functionality and debug authentication issues
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Login Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {mode === 'signin' ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                {mode === 'signin' ? 'Sign In' : 'Sign Up'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isAuthenticated ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 font-medium">✅ You are signed in!</p>
                    <p className="text-green-700 text-sm mt-1">Email: {user?.email}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={handleSignOut} disabled={isLoading} className="flex-1">
                      {isLoading ? "Signing out..." : "Sign Out"}
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/dashboard')}>
                      Go to Dashboard
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleAuth} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                      </>
                    ) : (
                      mode === 'signin' ? 'Sign In' : 'Sign Up'
                    )}
                  </Button>
                  
                  <div className="text-center">
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                      disabled={isLoading}
                    >
                      {mode === 'signin' 
                        ? "Don't have an account? Sign up" 
                        : "Already have an account? Sign in"
                      }
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Auth Status */}
          <div className="space-y-6">
            <AuthStatus showDetails={true} />
            
            {/* Test Credentials */}
            {!isAuthenticated && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Test Credentials</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-xs">
                    <p className="text-muted-foreground mb-2">Try these test accounts:</p>
                    {testCredentials.map((cred, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded">
                        <div className="font-mono">
                          <div>Email: {cred.email}</div>
                          <div>Password: {cred.password}</div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-1 text-xs h-6"
                          onClick={() => {
                            setEmail(cred.email)
                            setPassword(cred.password)
                          }}
                        >
                          Use This
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" onClick={refresh} className="w-full">
                    <RefreshCw className="mr-2 h-3 w-3" />
                    Refresh Auth State
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => router.push('/debug-auth')}
                    className="w-full"
                  >
                    Debug Auth
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      localStorage.clear()
                      sessionStorage.clear()
                      window.location.reload()
                    }}
                    className="w-full"
                  >
                    Clear Storage & Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}