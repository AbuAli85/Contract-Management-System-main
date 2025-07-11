const { createClient } = require("@supabase/supabase-js")
require("dotenv").config({ path: ".env.local" })

async function resetTestUser() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Service role key is required for this operation")
    console.log("Add SUPABASE_SERVICE_ROLE_KEY to your .env.local file")
    return
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  console.log("🔧 Resetting test user...\n")

  try {
    // 1. Check if user exists
    const {
      data: { users },
      error: listError,
    } = await supabase.auth.admin.listUsers()

    if (listError) throw listError

    const testUser = users.find((u) => u.email === "test@example.com")

    if (!testUser) {
      console.log("❌ User test@example.com does not exist")
      console.log("\nCreating new test user...")

      // Create the user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: "test@example.com",
        password: "Test123!",
        email_confirm: true,
        user_metadata: {
          full_name: "Test User",
        },
      })

      if (createError) throw createError

      console.log("✅ Created user:", newUser.user.email)
      console.log("   ID:", newUser.user.id)

      // Create profile
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: newUser.user.id,
        email: "test@example.com",
        full_name: "Test User",
        role: "user",
        email_verified_at: new Date().toISOString(),
      })

      if (profileError) {
        console.log("⚠️  Profile creation failed:", profileError.message)
      } else {
        console.log("✅ Profile created")
      }
    } else {
      console.log("✅ Found user:", testUser.email)
      console.log("   ID:", testUser.id)
      console.log("   Email confirmed:", testUser.email_confirmed_at ? "Yes" : "No")

      // Update the user's password
      const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
        testUser.id,
        {
          password: "Test123!",
          email_confirm: true,
        }
      )

      if (updateError) throw updateError

      console.log("\n✅ Password reset to: Test123!")
      console.log("✅ Email confirmed: Yes")

      // Ensure profile exists
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", testUser.id)
        .single()

      if (!profile) {
        console.log("\n⚠️  No profile found, creating one...")
        const { error: profileError } = await supabase.from("profiles").insert({
          id: testUser.id,
          email: "test@example.com",
          full_name: "Test User",
          role: "user",
          email_verified_at: new Date().toISOString(),
        })

        if (profileError) {
          console.log("❌ Profile creation failed:", profileError.message)
        } else {
          console.log("✅ Profile created")
        }
      }
    }

    // Test the credentials
    console.log("\n🧪 Testing credentials...")
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: "test@example.com",
      password: "Test123!",
    })

    if (signInError) {
      console.log("❌ Sign in test failed:", signInError.message)
    } else {
      console.log("✅ Sign in test successful!")
      console.log("   Session created:", signInData.session ? "Yes" : "No")

      // Sign out
      await supabase.auth.signOut()
    }

    console.log("\n📋 Summary:")
    console.log("===========")
    console.log("Email: test@example.com")
    console.log("Password: Test123!")
    console.log("\nYou should now be able to sign in with these credentials.")
  } catch (error) {
    console.error("❌ Error:", error.message)
    console.log("\nTroubleshooting:")
    console.log("1. Make sure SUPABASE_SERVICE_ROLE_KEY is set in .env.local")
    console.log("2. Check that your Supabase project is not paused")
    console.log("3. Verify the service role key is correct")
  }
}

resetTestUser().catch(console.error)
