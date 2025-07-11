// Test user creation script
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ekdjxzhujettocosgzql.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrZGp4emh1amV0dG9jb3NnenFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTMxOTEwNiwiZXhwIjoyMDY0ODk1MTA2fQ.dAf5W8m9Q8FGlLY19Lo2x8JYSfq3RuFMAsHaPcH3F7A'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTestUser() {
  try {
    console.log('Creating test user...')
    
    // Create test user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: 'Test123!',
      email_confirm: true
    })

    if (authError) {
      console.error('Error creating user:', authError)
      return
    }

    console.log('✅ Test user created successfully!')
    console.log('📧 Email: test@example.com')
    console.log('🔑 Password: Test123!')
    
    // Create profile
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: authData.user.id,
          email: 'test@example.com',
          full_name: 'Test User',
          role: 'admin'
        }])

      if (profileError) {
        console.error('Error creating profile:', profileError)
      } else {
        console.log('✅ User profile created successfully!')
      }
    }

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

createTestUser()