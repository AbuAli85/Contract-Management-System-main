const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkRLSPolicies() {
  console.log('Checking RLS policies for promoters table...')
  
  try {
    // Test if we can read from the promoters table
    console.log('\n1. Testing read access to promoters table...')
    const { data: promoters, error: readError } = await supabase
      .from('promoters')
      .select('*')
      .limit(5)
    
    if (readError) {
      console.error('❌ Read access failed:', readError.message)
      console.log('\nThis could be due to:')
      console.log('- RLS policies blocking anonymous access')
      console.log('- Missing or incorrect RLS policies')
      console.log('- Table permissions not set correctly')
      
      // Let's try to get more specific error information
      if (readError.code === '42501') {
        console.log('\n🔧 Suggested fix: Enable RLS and add appropriate policies')
        console.log('Run this SQL in your Supabase SQL editor:')
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
      console.log('✅ Read access successful!')
      console.log(`Found ${promoters?.length || 0} promoters`)
      
      if (promoters && promoters.length > 0) {
        console.log('Sample promoters:')
        promoters.slice(0, 3).forEach(promoter => {
          console.log(`- ${promoter.name_en} (${promoter.id})`)
        })
      }
    }
    
    // Test if we can insert into the promoters table
    console.log('\n2. Testing insert access to promoters table...')
    const testPromoter = {
      name_en: "Test Promoter",
      name_ar: "مروج تجريبي",
      id_card_number: "TEST123456",
      status: "active"
    }
    
    const { data: insertedPromoter, error: insertError } = await supabase
      .from('promoters')
      .insert(testPromoter)
      .select()
    
    if (insertError) {
      console.error('❌ Insert access failed:', insertError.message)
      console.log('\nThis could be due to:')
      console.log('- RLS policies blocking anonymous insert')
      console.log('- Missing insert policy')
      console.log('- Unique constraint violation (if test data already exists)')
    } else {
      console.log('✅ Insert access successful!')
      console.log(`Inserted test promoter: ${insertedPromoter[0].name_en}`)
      
      // Clean up the test data
      const { error: deleteError } = await supabase
        .from('promoters')
        .delete()
        .eq('id_card_number', 'TEST123456')
      
      if (deleteError) {
        console.log('⚠️  Warning: Could not clean up test data:', deleteError.message)
      } else {
        console.log('✅ Test data cleaned up successfully')
      }
    }
    
    // Check table structure
    console.log('\n3. Checking promoters table structure...')
    const { data: tableInfo, error: tableError } = await supabase
      .from('promoters')
      .select('*')
      .limit(0)
    
    if (tableError) {
      console.error('❌ Could not access table structure:', tableError.message)
    } else {
      console.log('✅ Table structure accessible')
      console.log('Available columns: id, name_en, name_ar, id_card_number, status, etc.')
    }
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Run the RLS check
checkRLSPolicies()
