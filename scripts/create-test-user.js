const { createClient } = require("@supabase/supabase-js")
require("dotenv").config({ path: ".env.local" })

async function createTestUser() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Missing required environment variables!")
    console.log("\nPlease ensure your .env.local file contains:")
    console.log("NEXT_PUBLIC_SUPABASE_URL=your_supabase_url")
    console.log("SUPABASE_SERVICE_ROLE_KEY=your_service_role_key")
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

  const testUsers = [
    {
      email: "admin@example.com",
      password: "Admin123!",
      role: "admin",
      full_name: "Admin User",
    },
    {
      email: "user@example.com",
      password: "User123!",
      role: "user",
      full_name: "Test User",
    },
  ]

  console.log("🚀 Creating test users...\n")

  for (const testUser of testUsers) {
    try {
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const userExists = existingUsers?.users?.some((u) => u.email === testUser.email)

      if (userExists) {
        console.log(`⚠️  User ${testUser.email} already exists`)
        continue
      }

      // Create user with admin API (bypasses email confirmation)
      const { data: userData, error: createError } = await supabase.auth.admin.createUser({
        email: testUser.email,
        password: testUser.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: testUser.full_name,
        },
      })

      if (createError) {
        console.error(`❌ Failed to create ${testUser.email}:`, createError.message)
        continue
      }

      console.log(`✅ Created user: ${testUser.email}`)

      // Create or update profile
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: userData.user.id,
        email: testUser.email,
        full_name: testUser.full_name,
        role: testUser.role,
        email_verified_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (profileError) {
        console.error(`⚠️  Failed to create profile for ${testUser.email}:`, profileError.message)
      } else {
        console.log(`✅ Created profile with role: ${testUser.role}`)
      }
    } catch (error) {
      console.error(`❌ Error creating ${testUser.email}:`, error.message)
    }
  }

  console.log("\n📝 Test User Credentials:")
  console.log("========================")
  testUsers.forEach((user) => {
    console.log(`\n${user.role.toUpperCase()}:`)
    console.log(`Email: ${user.email}`)
    console.log(`Password: ${user.password}`)
  })

  console.log("\n✨ You can now sign in with these credentials!")
  console.log('Note: If sign-in fails, run "npm run debug-auth" to troubleshoot')
}

// Run the script
createTestUser().catch(console.error)
