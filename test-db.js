const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Missing')
console.log('Supabase Key:', supabaseAnonKey ? 'Set' : 'Missing')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  console.log('\nTesting Supabase connection...')
  
  try {
    // Test basic connection by trying to read from promoters table
    const { data, error } = await supabase
      .from('promoters')
      .select('*')
      .limit(5)
    
    if (error) {
      console.error('❌ Database connection failed:', error.message)
      console.error('Error code:', error.code)
      console.error('Error details:', error.details)
      console.error('Error hint:', error.hint)
      
      if (error.code === '42501') {
        console.log('\n🔧 This looks like an RLS (Row Level Security) issue.')
        console.log('You need to enable RLS and add policies to allow access.')
        console.log('\nRun this SQL in your Supabase SQL editor:')
        console.log(`
-- Enable RLS on promoters table
ALTER TABLE promoters ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access (for testing)
CREATE POLICY "Allow anonymous read access" ON promoters
FOR SELECT USING (true);

-- Allow authenticated users full access
CREATE POLICY "Allow authenticated users full access" ON promoters
FOR ALL USING (auth.role() = 'authenticated');
        `)
      }
    } else {
      console.log('✅ Database connection successful!')
      console.log(`Found ${data?.length || 0} promoters in the database`)
      
      if (data && data.length > 0) {
        console.log('\nSample promoters:')
        data.forEach(promoter => {
          console.log(`- ${promoter.name_en} (ID: ${promoter.id})`)
        })
      } else {
        console.log('\nNo promoters found. You can add test data by running:')
        console.log('node scripts/seed-promoters.js')
      }
    }
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

testConnection()
