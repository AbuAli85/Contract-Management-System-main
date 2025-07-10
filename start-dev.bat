@echo off
title ContractGen Development Server

echo.
echo ========================================
echo   🚀 ContractGen Development Setup
echo ========================================
echo.

REM Check if pnpm is available
where pnpm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ pnpm not found. Installing pnpm...
    npm install -g pnpm
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Failed to install pnpm. Please install it manually.
        pause
        exit /b 1
    )
)

REM Check for .env.local
if not exist ".env.local" (
    echo ⚠️  .env.local not found. Copying from env.example...
    copy "env.example" ".env.local" >nul
    echo ✅ Created .env.local - Please update with your values!
    echo.
)

echo 📦 Installing dependencies...
call pnpm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo 🔧 Setting up database...
node setup-database.js

echo.
echo 🧪 Testing database connection...
node test-db.js

echo.
echo ✅ Setup complete! Starting development server...
echo.
echo 📱 Frontend: http://localhost:3000
echo 🔌 API: http://localhost:3000/api
echo ⚙️  Settings: http://localhost:3000/en/dashboard/settings
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the development server
call pnpm run dev
