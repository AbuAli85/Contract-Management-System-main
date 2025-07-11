"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { signUpSchema } from "@/lib/auth/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { 
  Loader2, 
  Mail, 
  Lock, 
  User,
  AlertCircle,
  Check,
  X,
  Shield,
  ArrowRight
} from "lucide-react"

export default function SignUpPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const form = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
      acceptTerms: false
    }
  })
  
  const password = form.watch("password")
  
  // Password strength calculation
  const passwordStrength = {
    hasMinLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password)
  }
  
  const strengthScore = Object.values(passwordStrength).filter(Boolean).length
  const strengthPercentage = (strengthScore / 5) * 100
  
  async function onSubmit(data: any) {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || "Sign up failed")
      }
      
      toast({
        title: "Account created!",
        description: "Please check your email to verify your account."
      })
      
      router.push("/auth/verify-email?email=" + encodeURIComponent(data.email))
    } catch (error: any) {
      setError(error.message)
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive"
      })
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
          <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
          <CardDescription className="text-center">
            Enter your details to get started
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
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  {...form.register("fullName")}
                  placeholder="John Doe"
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
              {form.formState.errors.fullName && (
                <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  {...form.register("email")}
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  {...form.register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
              
              {password && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Password strength</span>
                    <span className={`font-medium ${
                      strengthScore <= 2 ? "text-destructive" : 
                      strengthScore <= 3 ? "text-yellow-600" : 
                      "text-green-600"
                    }`}>
                      {strengthScore <= 2 ? "Weak" : 
                       strengthScore <= 3 ? "Medium" : 
                       "Strong"}
                    </span>
                  </div>
                  <Progress value={strengthPercentage} className="h-2" />
                  
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      {passwordStrength.hasMinLength ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <X className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className={passwordStrength.hasMinLength ? "text-green-600" : "text-muted-foreground"}>
                        At least 8 characters
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordStrength.hasUpperCase && passwordStrength.hasLowerCase ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <X className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className={passwordStrength.hasUpperCase && passwordStrength.hasLowerCase ? "text-green-600" : "text-muted-foreground"}>
                        Upper and lowercase letters
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordStrength.hasNumber ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <X className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className={passwordStrength.hasNumber ? "text-green-600" : "text-muted-foreground"}>
                        At least one number
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordStrength.hasSpecial ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <X className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className={passwordStrength.hasSpecial ? "text-green-600" : "text-muted-foreground"}>
                        At least one special character
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="acceptTerms"
                {...form.register("acceptTerms")}
                disabled={isLoading}
              />
              <div className="grid gap-1.5 leading-none">
                <Label 
                  htmlFor="acceptTerms" 
                  className="text-sm font-normal cursor-pointer"
                >
                  I agree to the{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </Label>
              </div>
            </div>
            {form.formState.errors.acceptTerms && (
              <p className="text-sm text-destructive">{form.formState.errors.acceptTerms.message}</p>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !form.formState.isValid}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter>
          <p className="text-center text-sm text-muted-foreground w-full">
            Already have an account?{" "}
            <Link href="/auth/signin" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}