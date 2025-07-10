"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { Github, LucideIcon } from "lucide-react"

// Custom Google icon for social login
const Google = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0_9914_10)">
      <path d="M23.766 12.276c0-.818-.074-1.604-.213-2.356H12.24v4.451h6.484a5.54 5.54 0 0 1-2.4 3.637v3.017h3.877c2.27-2.09 3.565-5.17 3.565-8.749z" fill="#4285F4"/>
      <path d="M12.24 24c3.24 0 5.963-1.07 7.95-2.91l-3.877-3.017c-1.08.726-2.462 1.16-4.073 1.16-3.13 0-5.78-2.11-6.73-4.946H1.53v3.09A11.997 11.997 0 0 0 12.24 24z" fill="#34A853"/>
      <path d="M5.51 14.287a7.19 7.19 0 0 1 0-4.574V6.623H1.53a12.004 12.004 0 0 0 0 10.754l3.98-3.09z" fill="#FBBC05"/>
      <path d="M12.24 4.77c1.77 0 3.35.61 4.6 1.81l3.43-3.43C18.2 1.07 15.48 0 12.24 0A11.997 11.997 0 0 0 1.53 6.623l3.98 3.09c.95-2.836 3.6-4.946 6.73-4.946z" fill="#EA4335"/>
    </g>
    <defs>
      <clipPath id="clip0_9914_10">
        <rect width="24" height="24" fill="white"/>
      </clipPath>
    </defs>
  </svg>
)

interface AuthFormProps {
  locale?: string
}

export default function AuthForm({ locale }: AuthFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  const validateForm = () => {
    if (!email.trim()) {
      toast({ title: "Missing Email", description: "Email is required.", variant: "destructive" })
      return false
    }
    if (!password.trim()) {
      toast({ title: "Missing Password", description: "Password is required.", variant: "destructive" })
      return false
    }
    if (password.length < 6) {
      toast({ title: "Password Too Short", description: "Password must be at least 6 characters.", variant: "destructive" })
      return false
    }
    if (!email.includes('@')) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" })
      return false
    }
    return true
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      const { error } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password: password.trim() 
      })

    if (error) {
        console.error("Sign in error:", error)
        toast({ 
          title: "Sign In Error", 
          description: error.message, 
          variant: "destructive" 
        })
    } else {
      toast({ title: "Success!", description: "You are now signed in." })
        router.push(locale ? `/${locale}/generate-contract` : "/generate-contract")
        router.refresh()
      }
    } catch (error) {
      console.error("Unexpected error during sign in:", error)
      toast({ 
        title: "Unexpected Error", 
        description: "An unexpected error occurred. Please try again.", 
        variant: "destructive" 
      })
    } finally {
    setIsSubmitting(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
    const {
      data: { user },
      error,
      } = await supabase.auth.signUp({ 
        email: email.trim(), 
        password: password.trim() 
      })

    if (error) {
        console.error("Sign up error:", error)
      toast({ title: "Sign Up Error", description: error.message, variant: "destructive" })
    } else if (user) {
      const fullName = email.split('@')[0];
      // Insert into profiles
      const { error: profileError } = await supabase.from('profiles').insert([
        { id: user.id, full_name: fullName, role: 'user' }
      ])
      if (profileError) {
        console.error("Error inserting into profiles:", profileError)
        toast({ title: "User DB Error", description: profileError.message, variant: "destructive" })
      } else {
        toast({
          title: "Success!",
          description: "Signed up successfully. Please check your email to confirm your account.",
        })
        router.push(locale ? `/${locale}/generate-contract` : "/generate-contract")
        router.refresh()
      }
    }
    } catch (error) {
      console.error("Unexpected error during sign up:", error)
      toast({ 
        title: "Unexpected Error", 
        description: "An unexpected error occurred. Please try again.", 
        variant: "destructive" 
      })
    } finally {
    setIsSubmitting(false)
    }
  }

  const handleSocialLogin = async (provider: "google" | "github") => {
    setIsSubmitting(true)
    const { error } = await supabase.auth.signInWithOAuth({ provider })
    if (error) {
      toast({ title: "Social Login Error", description: error.message, variant: "destructive" })
    }
    setIsSubmitting(false)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Welcome</CardTitle>
        <CardDescription>Sign in or create an account to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSignIn}>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={isSubmitting}
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isSubmitting}
              minLength={6}
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
            <Button
              type="button"
              onClick={handleSignUp}
              variant="outline"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign Up
            </Button>
          </div>
        </form>
        <div className="text-sm text-center mt-4">
          <a href="/login/forgot-password" className="text-blue-600 hover:underline">Forgot password?</a>
        </div>
        <div className="flex flex-col gap-2 mt-4">
          <Button type="button" variant="outline" onClick={() => handleSocialLogin("google")}
            disabled={isSubmitting} className="w-full flex items-center justify-center">
            <Google className="mr-2 h-4 w-4" /> Continue with Google
          </Button>
          <Button type="button" variant="outline" onClick={() => handleSocialLogin("github")}
            disabled={isSubmitting} className="w-full flex items-center justify-center">
            <Github className="mr-2 h-4 w-4" /> Continue with GitHub
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
