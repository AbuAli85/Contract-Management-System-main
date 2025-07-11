import { NextRequest, NextResponse } from "next/server"
import { createAuthClient, logAuthEvent, checkRateLimit } from "@/lib/auth/utils"
import { signUpSchema } from "@/lib/auth/types"
import { withSecureAPI } from "@/lib/auth/middleware"

async function handler(req: NextRequest) {
  try {
    // Parse and validate request body
    const body = await req.json()
    const validation = signUpSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { email, password, fullName } = validation.data

    // Rate limiting by IP
    const identifier = req.headers.get("x-forwarded-for") || "unknown"
    const { allowed } = await checkRateLimit(identifier, "signup", 3, 60) // 3 attempts per hour

    if (!allowed) {
      await logAuthEvent("sign_up", undefined, { email }, false, "Rate limit exceeded", req)
      return NextResponse.json(
        { error: "Too many signup attempts. Please try again later." },
        { status: 429 }
      )
    }

    // Create user
    const supabase = await createAuthClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email`,
      },
    })

    if (error) {
      await logAuthEvent("sign_up", undefined, { email }, false, error.message, req)

      if (error.message.includes("already registered")) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        )
      }

      throw error
    }

    // Log successful signup
    await logAuthEvent("sign_up", data.user?.id, { email }, true, undefined, req)

    // Send verification email is handled by Supabase

    return NextResponse.json({
      message: "Account created successfully. Please check your email to verify your account.",
      userId: data.user?.id,
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 })
  }
}

export const POST = withSecureAPI(handler, {
  rateLimit: { maxAttempts: 10, windowMinutes: 15 },
})
