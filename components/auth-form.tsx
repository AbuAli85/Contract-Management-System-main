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
      </CardContent>
    </Card>
  )
}
