const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// You need to set these environment variables or replace with actual values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ekdjxzhujettocosgzql.supabase.co'
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrZGp4emh1amV0dG9jb3NnenFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTMxOTEwNiwiZXhwIjoyMDY0ODk1MTA2fQ.dAf5W8m9Q8FGlLY19Lo2x8JYSfq3RuFMAsHaPcH3F7A'

async function setupDatabase() {
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
  
  try {
    console.log('Setting up database objects...')
    
    // Read the SQL script
    const sqlScript = fs.readFileSync(path.join(__dirname, 'scripts', '005_create_dashboard_rpc.sql'), 'utf8')
    
    // Split by semicolons and execute each statement
    const statements = sqlScript.split(';').filter(stmt => stmt.trim())
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 100) + '...')
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })
        if (error) {
          console.error('Error executing statement:', error)
        }
      }
    }
    
    console.log('Database setup completed!')
  } catch (error) {
    console.error('Error setting up database:', error)
  }
}

setupDatabase()
