const { createClient } = require("@supabase/supabase-js")
require("dotenv").config({ path: ".env.local" })

async function fixMissingProfiles() {
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

  console.log("🔧 Fixing missing profiles...\n")

  try {
    // Get all users
    const {
      data: { users },
      error: usersError,
    } = await supabase.auth.admin.listUsers()

    if (usersError) throw usersError

    console.log(`Found ${users.length} users in auth.users table`)

    // Check each user for profile
    for (const user of users) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single()

      if (!profile) {
        console.log(`\n⚠️  User ${user.email} has no profile`)

        // Create profile
        const { error: insertError } = await supabase.from("profiles").insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email.split("@")[0],
          role: "user",
          email_verified_at: user.email_confirmed_at,
          created_at: user.created_at,
          updated_at: new Date().toISOString(),
        })

        if (insertError) {
          console.log(`   ❌ Failed to create profile: ${insertError.message}`)
        } else {
          console.log(`   ✅ Created profile for ${user.email}`)
        }
      } else {
        console.log(`✓ User ${user.email} has profile`)
      }
    }

    console.log("\n✨ Profile fix complete!")

    // Test sign in with test@example.com
    console.log("\n🧪 Testing sign in with test@example.com...")
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: "test@example.com",
      password: "Test123!",
    })

    if (signInError) {
      console.log(`❌ Sign in failed: ${signInError.message}`)
    } else {
      console.log(`✅ Sign in successful!`)
      console.log(`   User: ${signInData.user.email}`)
      console.log(`   Session: ${signInData.session ? "Active" : "None"}`)
    }
  } catch (error) {
    console.error("��� Error:", error.message)
  }
}

fixMissingProfiles().catch(console.error)
