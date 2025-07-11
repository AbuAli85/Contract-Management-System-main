const { createClient } = require("@supabase/supabase-js")
require("dotenv").config({ path: ".env.local" })

async function debugAuth() {
  console.log("🔍 Authentication Debug Script\n")

  // Check environment variables
  console.log("1. Checking environment variables:")
  console.log(
    "   NEXT_PUBLIC_SUPABASE_URL:",
    process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing"
  )
  console.log(
    "   NEXT_PUBLIC_SUPABASE_ANON_KEY:",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing"
  )
  console.log(
    "   SUPABASE_SERVICE_ROLE_KEY:",
    process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ Set" : "❌ Missing"
  )

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error("\n❌ Missing required environment variables!")
    console.log("\nPlease create a .env.local file with:")
    console.log("NEXT_PUBLIC_SUPABASE_URL=your_supabase_url")
    console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key")
    console.log("SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (optional for admin tasks)")
    return
  }

  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  console.log("\n2. Testing Supabase connection...")
  try {
    const { data, error } = await supabase.from("profiles").select("count").limit(1)
    if (error) {
      console.log("   ❌ Connection failed:", error.message)
      console.log("\n   Possible issues:")
      console.log("   - Check if the profiles table exists")
      console.log("   - Verify your Supabase URL and keys are correct")
      console.log("   - Ensure RLS policies allow access")
    } else {
      console.log("   ✅ Successfully connected to Supabase")
    }
  } catch (err) {
    console.log("   ❌ Connection error:", err.message)
  }

  // Check auth configuration
  console.log("\n3. Checking auth configuration:")
  try {
    const {
      data: { users },
      error,
    } = await supabase.auth.admin.listUsers()
    if (error) {
      console.log("   ⚠️  Cannot list users (requires service role key)")
    } else {
      console.log(`   ✅ Found ${users.length} users in the system`)

      if (users.length > 0) {
        console.log("\n   Sample users:")
        users.slice(0, 3).forEach((user) => {
          console.log(`   - ${user.email} (${user.email_confirmed_at ? "verified" : "unverified"})`)
        })
      }
    }
  } catch (err) {
    console.log("   ℹ️  Admin functions not available with anon key")
  }

  // Test creating a user
  console.log("\n4. Testing user creation:")
  const testEmail = `test_${Date.now()}@example.com`
  const testPassword = "TestPassword123!"

  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    })

    if (error) {
      console.log("   ❌ Sign up failed:", error.message)
      console.log("\n   Possible issues:")
      console.log("   - Email confirmations might be enabled (check Supabase dashboard)")
      console.log("   - Password policy might be different")
      console.log("   - Auth might be disabled")
    } else {
      console.log("   ✅ Successfully created test user:", testEmail)
      console.log(
        "   Session:",
        data.session ? "Created" : "Not created (email confirmation required)"
      )

      // Try to sign in
      console.log("\n5. Testing sign in:")
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      })

      if (signInError) {
        console.log("   ❌ Sign in failed:", signInError.message)
      } else {
        console.log("   ✅ Successfully signed in")
        console.log("   User ID:", signInData.user.id)
      }

      // Clean up - delete test user
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        await supabase.auth.admin.deleteUser(data.user.id)
        console.log("\n   🧹 Cleaned up test user")
      }
    }
  } catch (err) {
    console.log("   ❌ Error:", err.message)
  }

  // Check email settings
  console.log("\n6. Email configuration tips:")
  console.log("   - Go to Supabase Dashboard > Authentication > Email Templates")
  console.log('   - Check if "Enable email confirmations" is ON/OFF')
  console.log("   - If ON, users need to verify email before signing in")
  console.log("   - For development, you might want to disable it")

  console.log('\n7. Common fixes for "Invalid login credentials":')
  console.log("   1. User doesn't exist - create account first")
  console.log("   2. Wrong password - check caps lock")
  console.log("   3. Email not verified - check inbox/spam")
  console.log("   4. Account locked - too many failed attempts")
  console.log("   5. Email has trailing spaces - trim input")

  console.log("\n8. Quick test user creation:")
  console.log("   Run: npm run create-test-user")
}

// Run the debug script
debugAuth().catch(console.error)
