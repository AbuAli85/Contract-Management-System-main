// Test script for promoter data analysis
const testCSVData = `id,name_en,name_ar,id_card_number,id_card_url,passport_url,employer_id,outsourced_to_id,job_title,work_location,status,contract_valid_until,id_card_expiry_date,passport_expiry_date,notify_days_before_id_expiry,notify_days_before_passport_expiry,notify_days_before_contract_expiry,notes,created_at,updated_at
8281bc76-0955-413b-b20d-49f2095ca5be,muhammad bilal,محمد بلال,123456789,,,,,,,active,,,,30,90,30,,2025-06-25 22:25:53.125938+00,2025-06-26 14:29:56.907511+00
863c07e9-904c-4b60-b75e-eec81caf8470,John Doe,جون دو,ID-1234567,,,,,,,active,,,,30,90,30,,2025-06-26 14:36:11.791644+00,2025-06-26 14:36:11.791644+00
b7868a93-4940-4b04-ba60-c0fa4192ac32,Mudassir Ghaus,موداسير غاوس,116910468,https://ekdjxzhujettocosgzql.supabase.co/storage/v1/object/public/promoter-documents/ID116910468.png,https://ekdjxzhujettocosgzql.supabase.co/storage/v1/object/public/promoter-documents/Passport116910468.png,,,,,active,,,,30,90,30,,2025-06-27 09:30:59.042345+00,2025-06-27 09:30:59.042345+00`

// Simple CSV parser for testing
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n')
  if (lines.length <= 1) return []

  const headers = lines[0].split(',').map(h => h.trim())
  const dataRows = lines.slice(1)

  return dataRows.map(line => {
    const values = line.split(',')
    const entry = {}
    
    headers.forEach((header, index) => {
      let value = values[index] ? values[index].trim() : ''
      
      // Handle quoted values
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1)
      }
      
      // Convert numeric fields
      if (['notify_days_before_id_expiry', 'notify_days_before_passport_expiry', 'notify_days_before_contract_expiry'].includes(header)) {
        entry[header] = value ? parseInt(value, 10) : null
      } else {
        entry[header] = value || null
      }
    })
    
    return entry
  })
}

// Simple analysis function
function analyzeData(promoters) {
  const analysis = {
    total: promoters.length,
    byStatus: {},
    byDocumentStatus: {
      hasIdCard: 0,
      hasPassport: 0,
      hasBothDocuments: 0,
      missingDocuments: 0
    },
    notificationSettings: {
      idExpiry: {},
      passportExpiry: {},
      contractExpiry: {}
    },
    recentUpdates: []
  }

  promoters.forEach(promoter => {
    // Status analysis
    const status = promoter.status || 'unknown'
    analysis.byStatus[status] = (analysis.byStatus[status] || 0) + 1

    // Document analysis
    const hasIdCard = !!promoter.id_card_url
    const hasPassport = !!promoter.passport_url
    
    if (hasIdCard) analysis.byDocumentStatus.hasIdCard++
    if (hasPassport) analysis.byDocumentStatus.hasPassport++
    if (hasIdCard && hasPassport) analysis.byDocumentStatus.hasBothDocuments++
    if (!hasIdCard && !hasPassport) analysis.byDocumentStatus.missingDocuments++

    // Notification settings analysis
    if (promoter.notify_days_before_id_expiry) {
      analysis.notificationSettings.idExpiry[promoter.notify_days_before_id_expiry] = 
        (analysis.notificationSettings.idExpiry[promoter.notify_days_before_id_expiry] || 0) + 1
    }
    
    if (promoter.notify_days_before_passport_expiry) {
      analysis.notificationSettings.passportExpiry[promoter.notify_days_before_passport_expiry] = 
        (analysis.notificationSettings.passportExpiry[promoter.notify_days_before_passport_expiry] || 0) + 1
    }
    
    if (promoter.notify_days_before_contract_expiry) {
      analysis.notificationSettings.contractExpiry[promoter.notify_days_before_contract_expiry] = 
        (analysis.notificationSettings.contractExpiry[promoter.notify_days_before_contract_expiry] || 0) + 1
    }

    // Recent updates (last 30 days)
    if (promoter.updated_at) {
      const updateDate = new Date(promoter.updated_at)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      if (updateDate > thirtyDaysAgo) {
        analysis.recentUpdates.push(promoter)
      }
    }
  })

  return analysis
}

// Run the analysis
console.log('=== Promoter Data Analysis ===\n')

const parsedData = parseCSV(testCSVData)
console.log(`Parsed ${parsedData.length} promoter records\n`)

const analysis = analyzeData(parsedData)

console.log('📊 OVERVIEW:')
console.log(`Total Promoters: ${analysis.total}`)
console.log(`Active Status: ${analysis.byStatus.active || 0}`)
console.log(`Complete Documents: ${analysis.byDocumentStatus.hasBothDocuments}`)
console.log(`Recent Updates: ${analysis.recentUpdates.length}\n`)

console.log('📋 STATUS DISTRIBUTION:')
Object.entries(analysis.byStatus).forEach(([status, count]) => {
  console.log(`  ${status}: ${count}`)
})
console.log()

console.log('📄 DOCUMENT STATUS:')
console.log(`  ID Cards: ${analysis.byDocumentStatus.hasIdCard}/${analysis.total}`)
console.log(`  Passports: ${analysis.byDocumentStatus.hasPassport}/${analysis.total}`)
console.log(`  Both Documents: ${analysis.byDocumentStatus.hasBothDocuments}/${analysis.total}`)
console.log(`  Missing Documents: ${analysis.byDocumentStatus.missingDocuments}/${analysis.total}`)
console.log()

console.log('🔔 NOTIFICATION SETTINGS:')
console.log('  ID Expiry Notifications:')
Object.entries(analysis.notificationSettings.idExpiry).forEach(([days, count]) => {
  console.log(`    ${days} days: ${count} promoters`)
})

console.log('  Passport Expiry Notifications:')
Object.entries(analysis.notificationSettings.passportExpiry).forEach(([days, count]) => {
  console.log(`    ${days} days: ${count} promoters`)
})

console.log('  Contract Expiry Notifications:')
Object.entries(analysis.notificationSettings.contractExpiry).forEach(([days, count]) => {
  console.log(`    ${days} days: ${count} promoters`)
})
console.log()

console.log('📝 PROMOTER DETAILS:')
parsedData.forEach((promoter, index) => {
  console.log(`${index + 1}. ${promoter.name_en} (${promoter.name_ar})`)
  console.log(`   ID: ${promoter.id_card_number}`)
  console.log(`   Status: ${promoter.status}`)
  console.log(`   Documents: ${promoter.id_card_url ? 'ID ✓' : 'ID ✗'} | ${promoter.passport_url ? 'Passport ✓' : 'Passport ✗'}`)
  console.log(`   Updated: ${promoter.updated_at ? new Date(promoter.updated_at).toLocaleDateString() : 'N/A'}`)
  console.log()
})

console.log('✅ Analysis complete!')
