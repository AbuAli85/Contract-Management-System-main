#!/usr/bin/env node

/**
 * Project Health Check Script
 * Verifies that the development environment is properly set up
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 ContractGen Project Health Check\n')

// Check package.json
console.log('📦 Checking package.json...')
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  console.log(`   ✅ Project: ${packageJson.name}`)
  console.log(`   ✅ Version: ${packageJson.version}`)
  console.log(`   ✅ Scripts: ${Object.keys(packageJson.scripts).length} available`)
} catch (error) {
  console.log('   ❌ package.json not found or invalid')
  process.exit(1)
}

// Check environment file
console.log('\n🔧 Checking environment configuration...')
if (fs.existsSync('.env.local')) {
  console.log('   ✅ .env.local found')
  const envContent = fs.readFileSync('.env.local', 'utf8')
  
  // Check critical environment variables
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'MAKE_WEBHOOK_URL',
    'SLACK_WEBHOOK_URL'
  ]
  
  const missingVars = requiredVars.filter(varName => !envContent.includes(varName))
  
  if (missingVars.length === 0) {
    console.log('   ✅ All required environment variables configured')
  } else {
    console.log(`   ⚠️  Missing variables: ${missingVars.join(', ')}`)
  }
} else {
  console.log('   ❌ .env.local not found')
  console.log('   💡 Copy env.example to .env.local and configure your values')
}

// Check critical files
console.log('\n📁 Checking project structure...')
const criticalFiles = [
  'app/layout.tsx',
  'app/page.tsx',
  'lib/webhook-service.ts',
  'app/api/test-webhooks/route.ts',
  'app/api/webhook/makecom/route.ts',
  'components/generate-contract-form.tsx'
]

criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`)
  } else {
    console.log(`   ❌ ${file} missing`)
  }
})

// Check VS Code configuration
console.log('\n🔧 Checking VS Code configuration...')
if (fs.existsSync('.vscode/tasks.json')) {
  console.log('   ✅ VS Code tasks configured')
} else {
  console.log('   ⚠️  VS Code tasks not found')
}

if (fs.existsSync('.vscode/launch.json')) {
  console.log('   ✅ VS Code debugging configured')
} else {
  console.log('   ⚠️  VS Code debugging not configured')
}

// Check node_modules
console.log('\n📚 Checking dependencies...')
if (fs.existsSync('node_modules')) {
  console.log('   ✅ Dependencies installed')
  
  // Check specific packages
  const criticalPackages = ['next', 'react', 'date-fns', '@supabase/supabase-js', 'concurrently']
  criticalPackages.forEach(pkg => {
    if (fs.existsSync(`node_modules/${pkg}`)) {
      console.log(`   ✅ ${pkg}`)
    } else {
      console.log(`   ❌ ${pkg} missing`)
    }
  })
} else {
  console.log('   ❌ Dependencies not installed')
  console.log('   💡 Run: pnpm install')
}

console.log('\n🚀 Quick Start Commands:')
console.log('   📦 Install dependencies: pnpm install')
console.log('   🔧 Setup database: pnpm run db:setup')
console.log('   🚀 Start development: pnpm run dev')
console.log('   ⚡ Start with turbo: pnpm run dev:turbo')
console.log('   🎯 Start all services: pnpm run dev:all')
console.log('   🧪 Test webhooks: pnpm run webhook:test')

console.log('\n📱 Development URLs:')
console.log('   Frontend: http://localhost:3000')
console.log('   API: http://localhost:3000/api')
console.log('   Settings: http://localhost:3000/en/dashboard/settings')

console.log('\n✅ Health check complete!')
