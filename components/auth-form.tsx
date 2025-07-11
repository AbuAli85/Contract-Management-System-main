"use client"

import React, { useState, useCallback, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Loader2, Eye, EyeOff, Mail, Lock, Github } from "lucide-react"

// Enhanced Google icon component
const GoogleIcon = React.memo((props: React.SVGProps<SVGSVGElement>) => (
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
))
GoogleIcon.displayName = "GoogleIcon"

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
  locale?: string
  className?: string
  redirectTo?: string
}

type AuthFormValues = z.infer<typeof authFormSchema>
type AuthMode = "signin" | "signup"
type SocialProvider = "google" | "github"

// Social login button component
const SocialLoginButton = React.memo(
  ({
    provider,
    onClick,
    disabled,
    children,
  }: {
    provider: SocialProvider
    onClick: () => void
    disabled: boolean
    children: React.ReactNode
  }) => (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className="w-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
      aria-label={`Sign in with ${provider}`}
    >
      {children}
    </Button>
  )
)
SocialLoginButton.displayName = "SocialLoginButton"

// Password input component
const PasswordInput = React.memo(
  ({
    field,
    showPassword,
    onToggleVisibility,
    disabled,
    error,
  }: {
    field: any
    showPassword: boolean
    onToggleVisibility: () => void
    disabled: boolean
    error?: string
  }) => (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
  )
)
PasswordInput.displayName = "PasswordInput"

export default function AuthForm({
  locale,
  className,
  redirectTo = "/generate-contract",
}: AuthFormProps) {
  // State management
  const [authMode, setAuthMode] = useState<AuthMode>("signin")
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Hooks
  const router = useRouter()
  const { toast } = useToast()

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

  // Navigation helper
  const navigateToApp = useCallback(() => {
    const path = locale ? `/${locale}${redirectTo}` : redirectTo
    router.push(path)
    router.refresh()
  }, [locale, redirectTo, router])

  // Event handlers
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev)
  }, [])

  const toggleAuthMode = useCallback(() => {
    setAuthMode((prev) => (prev === "signin" ? "signup" : "signin"))
    form.reset()
    setShowPassword(false)
  }, [form])

  // Authentication handlers
  const handleEmailAuth = useCallback(
    async (data: AuthFormValues) => {
      startTransition(async () => {
        try {
          if (isSignUp) {
            const { data: authData, error } = await supabase.auth.signUp({
              email: data.email.trim(),
              password: data.password,
              options: {
                emailRedirectTo: `${window.location.origin}${locale ? `/${locale}` : ""}${redirectTo}`,
              },
            })

            if (error) throw error

            if (authData.user) {
              // Create user profile
              const fullName = data.email.split("@")[0]
              const { error: profileError } = await supabase.from("profiles").insert([
                {
                  id: authData.user.id,
                  full_name: fullName,
                  role: "user",
                },
              ])

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
    },
    [isSignUp, locale, redirectTo, toast, navigateToApp]
  )

  const handleSocialLogin = useCallback(
    async (provider: SocialProvider) => {
      startTransition(async () => {
        try {
          const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
              redirectTo: `${window.location.origin}${locale ? `/${locale}` : ""}${redirectTo}`,
              queryParams: {
                access_type: "offline",
                prompt: "consent",
              },
            },
          })

          if (error) throw error
        } catch (error: any) {
          console.error("Social login error:", error)
          toast({
            title: "Social Login Failed",
            description: error.message || "An unexpected error occurred. Please try again.",
            variant: "destructive",
          })
        }
      })
    },
    [locale, redirectTo, toast]
  )

  return (
    <Card
      className={`mx-auto w-full max-w-md border-0 bg-card/50 shadow-xl backdrop-blur-sm ${className || ""}`}
    >
      <CardHeader className="space-y-2 pb-6 text-center">
        <CardTitle className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-3xl font-bold text-transparent">
          {isSignUp ? "Create Account" : "Welcome Back"}
        </CardTitle>
        <CardDescription className="text-base">
          {isSignUp
            ? "Create a new account to get started with our platform"
            : "Sign in to your account to continue where you left off"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Social Login Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <SocialLoginButton
            provider="google"
            onClick={() => handleSocialLogin("google")}
            disabled={isPending}
          >
            <GoogleIcon className="mr-2 h-4 w-4" />
            Google
          </SocialLoginButton>
          <SocialLoginButton
            provider="github"
            onClick={() => handleSocialLogin("github")}
            disabled={isPending}
          >
            <Github className="mr-2 h-4 w-4" />
            GitHub
          </SocialLoginButton>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-3 font-medium text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Email/Password Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleEmailAuth)} className="space-y-5" noValidate>
            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Email Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                    <p className="mt-1 text-xs text-muted-foreground">
                      Password must contain uppercase, lowercase, and number
                    </p>
                  )}
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              className="h-11 w-full text-base font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
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
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
              onClick={() => router.push("/forgot-password")}
              disabled={isPending}
            >
              Forgot your password?
            </Button>
          </div>
        )}

        {/* Toggle Auth Mode */}
        <div className="border-t pt-6 text-center text-sm">
          <span className="text-muted-foreground">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
          </span>{" "}
          <Button
            variant="link"
            className="h-auto p-0 font-semibold text-primary transition-colors hover:text-primary/80"
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
