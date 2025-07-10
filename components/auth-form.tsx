"use client"

import type React from "react"
import { useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Loader2, Eye, EyeOff, Mail, Lock } from "lucide-react"
import { Github } from "lucide-react"

// Enhanced Google icon with better accessibility
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
    {...props} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Google logo"
  >
    <g clipPath="url(#google-clip)">
      <path 
        d="M23.766 12.276c0-.818-.074-1.604-.213-2.356H12.24v4.451h6.484a5.54 5.54 0 0 1-2.4 3.637v3.017h3.877c2.27-2.09 3.565-5.17 3.565-8.749z" 
        fill="#4285F4"
      />
      <path 
        d="M12.24 24c3.24 0 5.963-1.07 7.95-2.91l-3.877-3.017c-1.08.726-2.462 1.16-4.073 1.16-3.13 0-5.78-2.11-6.73-4.946H1.53v3.09A11.997 11.997 0 0 0 12.24 24z" 
        fill="#34A853"
      />
      <path 
        d="M5.51 14.287a7.19 7.19 0 0 1 0-4.574V6.623H1.53a12.004 12.004 0 0 0 0 10.754l3.98-3.09z" 
        fill="#FBBC05"
      />
      <path 
        d="M12.24 4.77c1.77 0 3.35.61 4.6 1.81l3.43-3.43C18.2 1.07 15.48 0 12.24 0A11.997 11.997 0 0 0 1.53 6.623l3.98 3.09c.95-2.836 3.6-4.946 6.73-4.946z" 
        fill="#EA4335"
      />
    </g>
    <defs>
      <clipPath id="google-clip">
        <rect width="24" height="24" fill="white" />
      </clipPath>
    </defs>
  </svg>
)

// Types
interface AuthFormProps {
  locale?: string
  className?: string
}

interface FormData {
  email: string
  password: string
}

interface ValidationErrors {
  email?: string
  password?: string
}

type AuthMode = "signin" | "signup"
type SocialProvider = "google" | "github"

// Constants
const MIN_PASSWORD_LENGTH = 6
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function AuthForm({ locale, className }: AuthFormProps) {
  // State management
  const [authMode, setAuthMode] = useState<AuthMode>("signin")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: ""
  })
  const [errors, setErrors] = useState<ValidationErrors>({})

  // Hooks
  const router = useRouter()
  const { toast } = useToast()

  // Memoized values
  const isSignUp = useMemo(() => authMode === "signup", [authMode])
  const isFormValid = useMemo(() => {
    return formData.email.trim() && 
           formData.password.trim() && 
           Object.keys(errors).length === 0
  }, [formData, errors])

  // Enhanced validation with real-time feedback
  const validateField = useCallback((field: keyof FormData, value: string): string | undefined => {
    switch (field) {
      case "email":
        if (!value.trim()) return "Email is required"
        if (!EMAIL_REGEX.test(value)) return "Please enter a valid email address"
        return undefined
      case "password":
        if (!value.trim()) return "Password is required"
        if (value.length < MIN_PASSWORD_LENGTH) {
          return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
        }
        return undefined
      default:
        return undefined
    }
  }, [])

  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {}
    
    Object.entries(formData).forEach(([key, value]) => {
      const error = validateField(key as keyof FormData, value)
      if (error) newErrors[key as keyof ValidationErrors] = error
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData, validateField])

  // Form handlers
  const handleInputChange = useCallback((field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Real-time validation
    const error = validateField(field, value)
    setErrors(prev => ({
      ...prev,
      [field]: error
    }))
  }, [validateField])

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev)
  }, [])

  const toggleAuthMode = useCallback(() => {
    setAuthMode(prev => prev === "signin" ? "signup" : "signin")
    setErrors({})
  }, [])

  // Navigation helper
  const navigateToApp = useCallback(() => {
    const path = locale ? `/${locale}/generate-contract` : "/generate-contract"
    router.push(path)
    router.refresh()
  }, [locale, router])

  // Authentication handlers
  const handleSignIn = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password.trim()
      })

      if (error) {
        console.error("Sign in error:", error)
        toast({
          title: "Sign In Failed",
          description: error.message,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Welcome back!",
          description: "You have been signed in successfully."
        })
        navigateToApp()
      }
    } catch (error) {
      console.error("Unexpected sign in error:", error)
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, validateForm, toast, navigateToApp])

  const handleSignUp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    
    try {
      const { data: { user }, error } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password.trim()
      })

      if (error) {
        console.error("Sign up error:", error)
        toast({
          title: "Sign Up Failed",
          description: error.message,
          variant: "destructive"
        })
      } else if (user) {
        // Create user profile
        const fullName = formData.email.split('@')[0]
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: user.id,
            full_name: fullName,
            role: 'user'
          }])

        if (profileError) {
          console.error("Profile creation error:", profileError)
          toast({
            title: "Profile Creation Failed",
            description: profileError.message,
            variant: "destructive"
          })
        } else {
          toast({
            title: "Account Created!",
            description: "Please check your email to confirm your account."
          })
          navigateToApp()
        }
      }
    } catch (error) {
      console.error("Unexpected sign up error:", error)
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, validateForm, toast, navigateToApp])

  const handleSocialLogin = useCallback(async (provider: SocialProvider) => {
    setIsSubmitting(true)
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}${locale ? `/${locale}` : ""}/generate-contract`
        }
      })

      if (error) {
        console.error("Social login error:", error)
        toast({
          title: "Social Login Failed",
          description: error.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Unexpected social login error:", error)
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [locale, toast])

  return (
    <Card className={`w-full max-w-md mx-auto shadow-lg ${className || ""}`}>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">
          {isSignUp ? "Create Account" : "Welcome Back"}
        </CardTitle>
        <CardDescription>
          {isSignUp 
            ? "Create a new account to get started" 
            : "Sign in to your account to continue"
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Social Login Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSocialLogin("google")}
            disabled={isSubmitting}
            className="w-full"
          >
            <GoogleIcon className="mr-2 h-4 w-4" />
            Google
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSocialLogin("github")}
            disabled={isSubmitting}
            className="w-full"
          >
            <Github className="mr-2 h-4 w-4" />
            GitHub
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form 
          className="space-y-4" 
          onSubmit={isSignUp ? handleSignUp : handleSignIn}
          noValidate
        >
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange("email")}
                placeholder="you@example.com"
                className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
                disabled={isSubmitting}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
            </div>
            {errors.email && (
              <p id="email-error" className="text-sm text-destructive">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleInputChange("password")}
                placeholder="••••••••"
                className={`pl-10 pr-10 ${errors.password ? "border-destructive" : ""}`}
                disabled={isSubmitting}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={togglePasswordVisibility}
                disabled={isSubmitting}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p id="password-error" className="text-sm text-destructive">
                {errors.password}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !isFormValid}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSignUp ? "Create Account" : "Sign In"}
          </Button>
        </form>

        {/* Forgot Password Link (only for sign in) */}
        {!isSignUp && (
          <div className="text-center">
            <Button
              variant="link"
              className="text-sm text-muted-foreground hover:text-primary"
              onClick={() => router.push("/forgot-password")}
            >
              Forgot your password?
            </Button>
          </div>
        )}

        {/* Toggle Auth Mode */}
        <div className="text-center text-sm">
          <span className="text-muted-foreground">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
          </span>{" "}
          <Button
            variant="link"
            className="p-0 h-auto font-semibold"
            onClick={toggleAuthMode}
            disabled={isSubmitting}
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}