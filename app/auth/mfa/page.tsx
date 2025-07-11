"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { mfaVerifySchema } from "@/lib/auth/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { 
  Loader2, 
  Shield,
  AlertCircle,
  Smartphone,
  Key,
  ArrowRight
} from "lucide-react"

export default function MFAVerificationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [useBackupCode, setUseBackupCode] = useState(false)
  
  const userId = searchParams.get("userId")
  const redirect = searchParams.get("redirect") || "/dashboard"
  
  const form = useForm({
    resolver: zodResolver(mfaVerifySchema),
    defaultValues: {
      code: ""
    }
  })
  
  async function onSubmit(data: any) {
    if (!userId) {
      setError("Invalid session. Please sign in again.")
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const endpoint = useBackupCode ? "/api/auth/mfa/backup" : "/api/auth/mfa/verify"
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...data,
          userId 
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || "Verification failed")
      }
      
      toast({
        title: "Verification successful!",
        description: "You have been signed in successfully."
      })
      
      router.push(redirect)
      router.refresh()
    } catch (error: any) {
      setError(error.message)
      form.setValue("code", "")
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Two-Factor Authentication
          </CardTitle>
          <CardDescription className="text-center">
            {useBackupCode 
              ? "Enter one of your backup codes to continue"
              : "Enter the 6-digit code from your authenticator app"
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">
                {useBackupCode ? "Backup Code" : "Verification Code"}
              </Label>
              <div className="relative">
                {useBackupCode ? (
                  <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                ) : (
                  <Smartphone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                )}
                <Input
                  {...form.register("code")}
                  type="text"
                  placeholder={useBackupCode ? "XXXX-XXXX" : "000000"}
                  className="pl-10 text-center text-2xl tracking-widest"
                  maxLength={useBackupCode ? 9 : 6}
                  disabled={isLoading}
                  autoComplete="one-time-code"
                  autoFocus
                />
              </div>
              {form.formState.errors.code && (
                <p className="text-sm text-destructive">{form.formState.errors.code.message}</p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !form.formState.isValid}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
          
          <div className="text-center">
            <Button
              variant="link"
              onClick={() => setUseBackupCode(!useBackupCode)}
              className="text-sm"
            >
              {useBackupCode 
                ? "Use authenticator app instead"
                : "Use a backup code instead"
              }
            </Button>
          </div>
        </CardContent>
        
        <CardFooter>
          <p className="text-center text-sm text-muted-foreground w-full">
            Having trouble?{" "}
            <Button
              variant="link"
              onClick={() => {
                router.push("/auth/signin")
              }}
              className="p-0 h-auto font-normal text-primary"
            >
              Sign in again
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}