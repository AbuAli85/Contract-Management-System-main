#!/usr/bin/env pwsh

# ContractGen Development Startup Script
# This script sets up and runs the full development environment

Write-Host "🚀 Starting ContractGen Development Environment..." -ForegroundColor Green

# Check if pnpm is installed
if (!(Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ pnpm is not installed. Installing pnpm..." -ForegroundColor Red
    npm install -g pnpm
}

# Check if .env.local exists
if (!(Test-Path ".env.local")) {
    Write-Host "⚠️  .env.local not found. Copying from env.example..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env.local"
    Write-Host "✅ Created .env.local - Please update with your actual values!" -ForegroundColor Green
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
pnpm install

# Setup database
Write-Host "🔧 Setting up database..." -ForegroundColor Cyan
node setup-database.js

# Test database connection
Write-Host "🧪 Testing database connection..." -ForegroundColor Cyan
node test-db.js

Write-Host "`n🎯 Development environment ready! Choose your startup option:" -ForegroundColor Green
Write-Host "1. 🚀 Basic Development Server (Next.js only)"
Write-Host "2. ⚡ Turbo Development Server (Faster)"
Write-Host "3. 🧪 Development + Tests (Watch mode)"
Write-Host "4. 🌐 Development + Webhook Tests"
Write-Host "5. 🎯 All Services (Dev + Tests + Webhooks)"

$choice = Read-Host "Enter your choice (1-5)"

switch ($choice) {
    "1" {
        Write-Host "🚀 Starting basic development server..." -ForegroundColor Green
        pnpm run dev
    }
    "2" {
        Write-Host "⚡ Starting turbo development server..." -ForegroundColor Green
        pnpm run dev:turbo
    }
    "3" {
        Write-Host "🧪 Starting development server with tests..." -ForegroundColor Green
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "pnpm run test:watch"
        Start-Sleep 2
        pnpm run dev
    }
    "4" {
        Write-Host "🌐 Testing webhooks first..." -ForegroundColor Green
        pnpm run webhook:test
        Write-Host "🚀 Starting development server..." -ForegroundColor Green
        pnpm run dev
    }
    "5" {
        Write-Host "🎯 Starting all development services..." -ForegroundColor Green
        pnpm run dev:all
    }
    default {
        Write-Host "🚀 Starting basic development server..." -ForegroundColor Green
        pnpm run dev
    }
}

Write-Host "`n✅ Development server is running!" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔌 API: http://localhost:3000/api" -ForegroundColor Cyan
Write-Host "⚙️  Settings: http://localhost:3000/en/dashboard/settings" -ForegroundColor Cyan
