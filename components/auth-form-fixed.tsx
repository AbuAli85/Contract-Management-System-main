"use client"

import React, { useState, useCallback, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { useSupabase } from '@/components/supabase-provider'
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form"
import { Loader2, Eye, EyeOff, Mail, Lock } from "lucide-react"

// Enhanced validation schema with better error messages
const authFormSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(255, "Email is too long"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password is too long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
})

// Types
interface AuthFormProps {
  className?: string
  redirectTo?: string
}

type AuthFormValues = z.infer<typeof authFormSchema>
type AuthMode = "signin" | "signup"

// Password input component
const PasswordInput = React.memo(({ 
  field, 
  showPassword, 
  onToggleVisibility, 
  disabled, 
  error 
}: {
  field: any
  showPassword: boolean
  onToggleVisibility: () => void
  disabled: boolean
  error?: string
}) => (
  <div className="relative">
    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
    <Input
      {...field}
      type={showPassword ? "text" : "password"}
      placeholder="Enter your password"
      className={`pl-10 pr-12 transition-colors ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
      disabled={disabled}
      aria-invalid={!!error}
      autoComplete="current-password"
    />
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
      onClick={onToggleVisibility}
      disabled={disabled}
      aria-label={showPassword ? "Hide password" : "Show password"}
      tabIndex={-1}
    >
      {showPassword ? (
        <EyeOff className="h-4 w-4 text-muted-foreground" />
      ) : (
        <Eye className="h-4 w-4 text-muted-foreground" />
      )}
    </Button>
  </div>
))
PasswordInput.displayName = "PasswordInput"

export default function AuthForm({ 
  className, 
  redirectTo = "/generate-contract" 
}: AuthFormProps) {
  // State management
  const [authMode, setAuthMode] = useState<AuthMode>("signin")
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Hooks
  const router = useRouter()
  const { toast } = useToast()
  const { supabase } = useSupabase()

  // Form setup with react-hook-form and zod
  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur",
  })

  // Memoized values
  const isSignUp = useMemo(() => authMode === "signup", [authMode])
  const isFormValid = useMemo(() => form.formState.isValid, [form.formState.isValid])

  // Navigation helper - simplified without locale
  const navigateToApp = useCallback(() => {
    router.push(redirectTo)
    router.refresh()
  }, [redirectTo, router])

  // Event handlers
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev)
  }, [])

  const toggleAuthMode = useCallback(() => {
    setAuthMode(prev => prev === "signin" ? "signup" : "signin")
    form.reset()
    setShowPassword(false)
  }, [form])

  // Authentication handlers
  const handleEmailAuth = useCallback(async (data: AuthFormValues) => {
    startTransition(async () => {
      try {
        if (isSignUp) {
          const { data: authData, error } = await supabase.auth.signUp({
            email: data.email.trim(),
            password: data.password,
            options: {
              emailRedirectTo: `${window.location.origin}${redirectTo}`
            }
          })

          if (error) throw error

          if (authData.user) {
            // Create user profile
            const fullName = data.email.split('@')[0]
            const { error: profileError } = await supabase
              .from('profiles')
              .insert([{
                id: authData.user.id,
                full_name: fullName,
                role: 'user'
              }])

            if (profileError) {
              console.error("Profile creation error:", profileError)
            }

            toast({
              title: "Account Created Successfully!",
              description: "Please check your email to confirm your account.",
            })
            
            // If email confirmation is disabled, navigate immediately
            if (authData.session) {
              navigateToApp()
            }
          }
        } else {
          const { error } = await supabase.auth.signInWithPassword({
            email: data.email.trim(),
            password: data.password,
          })

          if (error) throw error

          toast({
            title: "Welcome back!",
            description: "You have been signed in successfully.",
          })
          navigateToApp()
        }
      } catch (error: any) {
        console.error("Authentication error:", error)
        toast({
          title: isSignUp ? "Sign Up Failed" : "Sign In Failed",
          description: error.message || "An unexpected error occurred. Please try again.",
          variant: "destructive",
        })
      }
    })
  }, [isSignUp, redirectTo, toast, navigateToApp, supabase])

  return (
    <Card className={`w-full max-w-md mx-auto shadow-xl border-0 bg-card/50 backdrop-blur-sm ${className || ""}`}>
      <CardHeader className="space-y-2 text-center pb-6">
        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
          {isSignUp ? "Create Account" : "Welcome Back"}
        </CardTitle>
        <CardDescription className="text-base">
          {isSignUp 
            ? "Create a new account to get started with our platform" 
            : "Sign in to your account to continue where you left off"
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Email/Password Form */}
        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(handleEmailAuth)}
            className="space-y-5"
            noValidate
          >
            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Email Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        {...field}
                        type="email"
                        placeholder="you@example.com"
                        className="pl-10 transition-colors"
                        disabled={isPending}
                        autoComplete="email"
                        aria-describedby="email-description"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password Field */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      field={field}
                      showPassword={showPassword}
                      onToggleVisibility={togglePasswordVisibility}
                      disabled={isPending}
                      error={form.formState.errors.password?.message}
                    />
                  </FormControl>
                  <FormMessage />
                  {isSignUp && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Password must contain uppercase, lowercase, and number
                    </p>
                  )}
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 text-base font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              disabled={isPending || !isFormValid}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? "Create Account" : "Sign In"}
            </Button>
          </form>
        </Form>

        {/* Forgot Password Link (only for sign in) */}
        {!isSignUp && (
          <div className="text-center">
            <Button
              variant="link"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
              onClick={() => router.push("/forgot-password")}
              disabled={isPending}
            >
              Forgot your password?
            </Button>
          </div>
        )}

        {/* Toggle Auth Mode */}
        <div className="text-center text-sm border-t pt-6">
          <span className="text-muted-foreground">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
          </span>{" "}
          <Button
            variant="link"
            className="p-0 h-auto font-semibold text-primary hover:text-primary/80 transition-colors"
            onClick={toggleAuthMode}
            disabled={isPending}
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}