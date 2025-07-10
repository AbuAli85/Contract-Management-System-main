const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const testPromoters = [
  {
    name_en: "Ahmed Al-Rashid",
    name_ar: "أحمد الراشد",
    id_card_number: "1234567890",
    status: "active",
    id_card_expiry_date: "2025-12-31",
    passport_expiry_date: "2026-06-30",
    notify_days_before_id_expiry: 30,
    notify_days_before_passport_expiry: 60,
    notes: "Experienced promoter with 5+ years in the industry"
  },
  {
    name_en: "Fatima Al-Zahra",
    name_ar: "فاطمة الزهراء",
    id_card_number: "0987654321",
    status: "active",
    id_card_expiry_date: "2025-08-15",
    passport_expiry_date: "2027-03-20",
    notify_days_before_id_expiry: 30,
    notify_days_before_passport_expiry: 60,
    notes: "Specializes in luxury events and corporate functions"
  },
  {
    name_en: "Mohammed Al-Sayed",
    name_ar: "محمد السيد",
    id_card_number: "1122334455",
    status: "pending_review",
    id_card_expiry_date: "2024-11-30",
    passport_expiry_date: "2025-09-15",
    notify_days_before_id_expiry: 30,
    notify_days_before_passport_expiry: 60,
    notes: "New promoter, requires training and certification"
  },
  {
    name_en: "Aisha Al-Mansouri",
    name_ar: "عائشة المنصوري",
    id_card_number: "5566778899",
    status: "active",
    id_card_expiry_date: "2026-02-28",
    passport_expiry_date: "2028-01-10",
    notify_days_before_id_expiry: 30,
    notify_days_before_passport_expiry: 60,
    notes: "Expert in international events and exhibitions"
  },
  {
    name_en: "Omar Al-Hassan",
    name_ar: "عمر الحسن",
    id_card_number: "6677889900",
    status: "inactive",
    id_card_expiry_date: "2024-06-15",
    passport_expiry_date: "2025-12-20",
    notify_days_before_id_expiry: 30,
    notify_days_before_passport_expiry: 60,
    notes: "On temporary leave, returning in 3 months"
  }
]

async function seedPromoters() {
  console.log('Starting to seed promoters...')
  
  try {
    // First, let's check if there are any existing promoters
    const { data: existingPromoters, error: fetchError } = await supabase
      .from('promoters')
      .select('id, name_en')
    
    if (fetchError) {
      console.error('Error fetching existing promoters:', fetchError)
      return
    }
    
    console.log(`Found ${existingPromoters?.length || 0} existing promoters`)
    
    // Insert test promoters (even if some already exist)
    const { data: insertedPromoters, error: insertError } = await supabase
      .from('promoters')
      .insert(testPromoters)
      .select()
    
    if (insertError) {
      console.error('Error inserting promoters:', insertError)
      
      // If it's a unique constraint violation, try inserting one by one
      if (insertError.code === '23505') {
        console.log('Attempting to insert promoters one by one...')
        let successCount = 0
        
        for (const promoter of testPromoters) {
          const { data: singleInsert, error: singleError } = await supabase
            .from('promoters')
            .insert(promoter)
            .select()
          
          if (singleError) {
            console.log(`Skipped ${promoter.name_en}: ${singleError.message}`)
          } else {
            console.log(`✅ Added ${promoter.name_en}`)
            successCount++
          }
        }
        
        console.log(`Successfully added ${successCount} new promoters`)
        return
      }
      
      return
    }
    
    console.log(`Successfully inserted ${insertedPromoters?.length || 0} promoters:`)
    insertedPromoters?.forEach(promoter => {
      console.log(`- ${promoter.name_en} (${promoter.id})`)
    })
    
    // Verify the data was inserted
    const { data: allPromoters, error: verifyError } = await supabase
      .from('promoters')
      .select('*')
      .order('name_en')
    
    if (verifyError) {
      console.error('Error verifying promoters:', verifyError)
      return
    }
    
    console.log(`\nTotal promoters in database: ${allPromoters?.length || 0}`)
    console.log('Seeding completed successfully!')
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Run the seeding function
seedPromoters()
