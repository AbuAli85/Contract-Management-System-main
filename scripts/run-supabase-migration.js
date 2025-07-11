const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

async function runMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in environment variables');
    console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
    process.exit(1);
  }

  // Create Supabase client with service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    console.log('🚀 Running auth system migration...');
    
    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20240101000000_auth_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split by semicolons and filter out empty statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { 
        sql_query: statement 
      }).single();

      if (error) {
        console.error(`❌ Error in statement ${i + 1}:`, error.message);
        console.log('Statement:', statement.substring(0, 100) + '...');
        // Continue with other statements
      }
    }

    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Alternative: Instructions for manual migration
console.log(`
📋 MIGRATION INSTRUCTIONS
========================

Since you're using Supabase, the easiest way to run this migration is:

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy the contents of: supabase/migrations/20240101000000_auth_system.sql
5. Paste and run the query

Alternatively, if you have the Supabase CLI installed:
  supabase db push

Or run this script after setting up the exec_sql function in Supabase.
`);

// Uncomment to run automatically (requires exec_sql function in Supabase)
// runMigration();