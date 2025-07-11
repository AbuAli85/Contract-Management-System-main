const { createClient } = require("@supabase/supabase-js")
require("dotenv").config({ path: ".env.local" })

async function testAuthDetailed() {
  console.log("🔍 Detailed Authentication Test\n")

  // 1. Check environment
  console.log("1. Environment Check:")
  console.log("   SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing")
  console.log("   ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing")
  console.log("   URL:", process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + "...")

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  // 2. Test direct API call
  console.log("\n2. Testing Direct API Call:")
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          email: "test@example.com",
          password: "Test123!",
        }),
      }
    )

    const data = await response.json()

    if (response.ok) {
      console.log("   ✅ Direct API call successful")
      console.log("   User ID:", data.user?.id)
      console.log("   Email:", data.user?.email)
    } else {
      console.log("   ❌ Direct API call failed:", response.status)
      console.log("   Error:", data.error || data.msg || JSON.stringify(data))

      if (data.error === "invalid_grant") {
        console.log("\n   Possible causes:")
        console.log("   - Wrong password")
        console.log("   - User doesn't exist")
        console.log("   - Email not confirmed")
        console.log("   - Account is locked")
      }
    }
  } catch (err) {
    console.log("   ❌ Network error:", err.message)
  }

  // 3. Test with Supabase client
  console.log("\n3. Testing with Supabase Client:")
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "test@example.com",
      password: "Test123!",
    })

    if (error) {
      console.log("   ❌ Sign in failed:", error.message)
      console.log("   Error code:", error.code)
      console.log("   Error status:", error.status)
    } else {
      console.log("   ✅ Sign in successful!")
      console.log("   Session:", data.session ? "Created" : "Not created")
    }
  } catch (err) {
    console.log("   ❌ Error:", err.message)
  }

  // 4. Check auth settings
  console.log("\n4. Checking Auth Settings:")
  try {
    // Try to get auth settings (this might fail without admin access)
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
    })

    if (response.ok) {
      const settings = await response.json()
      console.log("   Email auth enabled:", settings.external?.email?.enabled ?? "Unknown")
      console.log("   Email confirmations:", settings.external?.email?.confirm_email ?? "Unknown")
    } else {
      console.log("   ℹ️  Cannot access auth settings (normal for anon key)")
    }
  } catch (err) {
    console.log("   ℹ️  Settings check not available")
  }

  // 5. Try creating a new test user
  console.log("\n5. Testing User Creation:")
  const testEmail = `test_${Date.now()}@example.com`
  const testPassword = "TestPassword123!"

  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    })

    if (error) {
      console.log("   ❌ Sign up failed:", error.message)
    } else {
      console.log("   ✅ Created test user:", testEmail)
      console.log("   User ID:", data.user?.id)
      console.log("   Email confirmed:", data.user?.email_confirmed_at ? "Yes" : "No")

      // Try to sign in immediately
      console.log("\n   Testing immediate sign in:")
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      })

      if (signInError) {
        console.log("   ❌ Cannot sign in:", signInError.message)
        console.log("   → Email confirmation is likely required")
      } else {
        console.log("   ✅ Can sign in immediately (email confirmation disabled)")
      }
    }
  } catch (err) {
    console.log("   ❌ Error:", err.message)
  }

  console.log("\n📋 Summary:")
  console.log("===========")
  console.log("If authentication is failing, check:")
  console.log("1. Email confirmation settings in Supabase Dashboard")
  console.log("2. Password requirements (min length, complexity)")
  console.log("3. Rate limiting (too many failed attempts)")
  console.log("4. User exists and password is correct")
  console.log("\nTo fix email confirmation requirement:")
  console.log("1. Go to Supabase Dashboard > Authentication > Providers > Email")
  console.log('2. Toggle OFF "Confirm email"')
  console.log("3. Save changes")
}

testAuthDetailed().catch(console.error)
