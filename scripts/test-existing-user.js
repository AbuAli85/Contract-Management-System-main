const { createClient } = require("@supabase/supabase-js")
require("dotenv").config({ path: ".env.local" })

async function testExistingUser() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  console.log("🔍 Testing sign in with existing user...\n")

  // Try to sign in with the test@example.com user
  const testEmail = "test@example.com"
  const testPasswords = ["Test123!", "test123", "Test@123", "password", "Password123!"]

  console.log(`Trying to sign in as: ${testEmail}`)
  console.log("Testing common passwords...\n")

  for (const password of testPasswords) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: password,
      })

      if (error) {
        console.log(`❌ Password "${password}" failed: ${error.message}`)
      } else {
        console.log(`✅ SUCCESS! Password is: ${password}`)
        console.log(`   User ID: ${data.user.id}`)
        console.log(`   Email: ${data.user.email}`)
        console.log(`   Session: ${data.session ? "Active" : "None"}`)

        // Check if profile exists
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single()

        if (profile) {
          console.log(`   Profile exists: ${profile.full_name || "No name"} (${profile.role})`)
        } else {
          console.log(`   ⚠️  No profile found for this user`)
        }

        // Sign out
        await supabase.auth.signOut()
        break
      }
    } catch (err) {
      console.log(`❌ Error: ${err.message}`)
    }
  }

  console.log("\n📝 Next steps:")
  console.log("1. If all passwords failed, you may need to reset the password")
  console.log("2. Go to Supabase Dashboard > Authentication > Users")
  console.log('3. Find the user and click "Send recovery email"')
  console.log("4. Or manually update the password in the dashboard")
}

testExistingUser().catch(console.error)
