const { createClient } = require("@supabase/supabase-js")
require("dotenv").config({ path: ".env.local" })

async function checkContractsTable() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  console.log("🔍 Checking contracts table setup...\n")

  // 1. Check if contracts table exists
  console.log("1. Checking if contracts table exists:")
  try {
    const { data, error } = await supabase.from("contracts").select("count").limit(1)

    if (error) {
      if (error.message.includes('relation "public.contracts" does not exist')) {
        console.log("   ❌ Contracts table does not exist!")
        console.log("\n   Solution: Create the contracts table using the SQL script below")
        return false
      } else {
        console.log("   ❌ Error accessing contracts table:", error.message)
        return false
      }
    } else {
      console.log("   ✅ Contracts table exists")
    }
  } catch (err) {
    console.log("   ❌ Error:", err.message)
    return false
  }

  // 2. Check related tables
  console.log("\n2. Checking related tables:")
  const tables = ["parties", "promoters"]

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select("count").limit(1)

      if (error) {
        console.log(`   ❌ ${table} table: Missing or inaccessible`)
      } else {
        console.log(`   ✅ ${table} table: Exists`)
      }
    } catch (err) {
      console.log(`   ❌ ${table} table: Error - ${err.message}`)
    }
  }

  // 3. Try to fetch contracts with relations
  console.log("\n3. Testing contracts query with relations:")
  try {
    const { data, error } = await supabase
      .from("contracts")
      .select(
        `
        id,
        contract_number,
        created_at,
        status,
        first_party:parties!contracts_first_party_id_fkey(id, name_en, name_ar),
        second_party:parties!contracts_second_party_id_fkey(id, name_en, name_ar),
        promoter:promoters(id, name_en, name_ar)
      `
      )
      .limit(1)

    if (error) {
      console.log("   ❌ Query failed:", error.message)
      console.log("\n   This usually means:")
      console.log("   - Foreign key constraints are missing")
      console.log("   - Table relationships are not properly set up")
      console.log("   - RLS policies are blocking access")
    } else {
      console.log("   ✅ Query successful")
      console.log(`   Found ${data?.length || 0} contracts`)
    }
  } catch (err) {
    console.log("   ❌ Error:", err.message)
  }

  console.log("\n📝 Next Steps:")
  console.log("1. If contracts table is missing, run the SQL script below in Supabase")
  console.log("2. If foreign keys are missing, run the fix script")
  console.log("3. Check RLS policies are not blocking access")

  return true
}

// Run the check
checkContractsTable().then((exists) => {
  if (!exists) {
    console.log("\n🔧 SQL Script to create contracts table:")
    console.log("=====================================\n")
    console.log(`
-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_number VARCHAR(50) UNIQUE NOT NULL,
    first_party_id UUID REFERENCES parties(id),
    second_party_id UUID REFERENCES parties(id),
    promoter_id UUID REFERENCES promoters(id),
    contract_start_date DATE,
    contract_end_date DATE,
    contract_value DECIMAL(10, 2),
    job_title VARCHAR(255),
    work_location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}'
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contracts_first_party ON contracts(first_party_id);
CREATE INDEX IF NOT EXISTS idx_contracts_second_party ON contracts(second_party_id);
CREATE INDEX IF NOT EXISTS idx_contracts_promoter ON contracts(promoter_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_dates ON contracts(contract_start_date, contract_end_date);

-- Enable RLS
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON contracts
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON contracts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON contracts
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT SELECT ON contracts TO anon;
GRANT ALL ON contracts TO authenticated;
GRANT ALL ON contracts TO service_role;
    `)
    console.log("\n=====================================")
    console.log("Copy and run this in your Supabase SQL Editor")
  }
})
