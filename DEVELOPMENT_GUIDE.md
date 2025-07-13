# 🚀 ContractGen - Development Setup Guide

This guide will help you set up and run both the frontend and backend automatically for the ContractGen application.

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **pnpm** (recommended) or npm
- **Git**

## 🏃‍♂️ Quick Start

### Option 1: Automated Setup (Recommended)

**Windows PowerShell:**
\`\`\`powershell
.\dev-start.ps1
\`\`\`

**Windows Command Prompt:**
\`\`\`cmd
start-dev.bat
\`\`\`

### Option 2: Manual Setup

1. **Install dependencies:**
   \`\`\`bash
   pnpm install
   \`\`\`

2. **Setup environment:**
   \`\`\`bash
   cp env.example .env.local
   # Edit .env.local with your actual values
   \`\`\`

3. **Setup database:**
   \`\`\`bash
   pnpm run db:setup
   \`\`\`

4. **Start development server:**
   \`\`\`bash
   pnpm run dev
   \`\`\`

## 🛠️ Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm run dev` | 🚀 Start basic development server |
| `pnpm run dev:turbo` | ⚡ Start development server with Turbo |
| `pnpm run dev:debug` | 🐛 Start with debugging enabled |
| `pnpm run dev:full` | 🔧 Setup database + start development |
| `pnpm run dev:all` | 🎯 Development server + tests in watch mode |
| `pnpm run test` | 🧪 Run tests once |
| `pnpm run test:watch` | 🔄 Run tests in watch mode |
| `pnpm run lint` | 🔍 Check code quality |
| `pnpm run lint:fix` | 🔧 Fix linting issues |
| `pnpm run db:setup` | 🗄️ Setup database tables |
| `pnpm run db:test` | 🧪 Test database connection |
| `pnpm run webhook:test` | 🌐 Test webhook integrations |
| `pnpm run build` | 🏗️ Build for production |

## 🎯 VS Code Integration

### Running Tasks

1. Press `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac)
2. Type "Tasks: Run Task"
3. Choose from available tasks:
   - 🚀 Start Development Server
   - ⚡ Start Development (Turbo)
   - 🔧 Setup Database
   - 🧪 Run Tests (Watch)
   - 🌐 Test Webhooks
   - 🎯 All Development Services

### Debugging

1. Go to **Run and Debug** panel (`Ctrl+Shift+D`)
2. Select a debug configuration:
   - 🚀 Launch Next.js Development
   - 🐛 Debug Next.js API Routes
   - 🧪 Debug Jest Tests
   - 🌐 Debug Webhook Service

## 🏗️ Architecture Overview

This is a **Next.js Full-Stack Application** that includes:

### Frontend (Client-Side)
- **Framework:** Next.js 15 with React 19
- **Styling:** Tailwind CSS + shadcn/ui components
- **State Management:** TanStack Query (React Query)
- **Internationalization:** next-intl (English/Arabic)
- **Forms:** React Hook Form + Zod validation

### Backend (API Routes)
- **API Framework:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **File Storage:** Google Drive (via Make.com)
- **Webhooks:** Make.com integration
- **Real-time:** Supabase Realtime

### Key Integrations
- **Make.com:** Automated PDF generation and Slack notifications
- **Supabase:** Database, authentication, real-time updates
- **Google Drive:** Document storage and templates
- **Slack:** Team notifications

## 🌐 Application URLs

When running locally:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Main application |
| **API** | http://localhost:3000/api | REST API endpoints |
| **Settings** | http://localhost:3000/en/dashboard/settings | Integration settings |
| **Webhooks** | http://localhost:3000/api/webhook/makecom | Webhook endpoint |
| **Test Webhooks** | http://localhost:3000/api/test-webhooks | Webhook testing |

## 🔧 Configuration

### Environment Variables

Key environment variables in `.env.local`:

\`\`\`bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Make.com Webhooks
MAKE_WEBHOOK_URL=your_main_webhook_url
SLACK_WEBHOOK_URL=your_slack_webhook_url

# Google Drive (via Make.com)
GOOGLE_CREDENTIALS_JSON=your_credentials
GOOGLE_DOCS_TEMPLATE_ID=your_template_id
\`\`\`

### Database Setup

The application automatically sets up database tables when you run:
\`\`\`bash
pnpm run db:setup
\`\`\`

## 🧪 Testing

### Unit Tests
\`\`\`bash
pnpm run test           # Run once
pnpm run test:watch     # Watch mode
\`\`\`

### Integration Tests
\`\`\`bash
pnpm run webhook:test   # Test webhooks
pnpm run db:test        # Test database
\`\`\`

### Manual Testing
- Visit http://localhost:3000/en/dashboard/settings
- Go to "Integrations" tab
- Click "Test Webhooks" button

## 📝 Development Workflow

1. **Start Development:**
   \`\`\`bash
   pnpm run dev:all
   \`\`\`

2. **Make Changes:**
   - Frontend: Edit files in `app/`, `components/`, `hooks/`
   - Backend: Edit files in `app/api/`, `lib/`
   - Database: Edit schema in `setup-database.js`

3. **Test Changes:**
   - Frontend: Hot reload automatically
   - Backend: API routes restart automatically
   - Database: Run `pnpm run db:setup` if schema changed

4. **Commit Changes:**
   \`\`\`bash
   pnpm run lint:fix      # Fix any linting issues
   pnpm run test          # Ensure tests pass
   git add .
   git commit -m "Your changes"
   \`\`\`

## 🚨 Troubleshooting

### Common Issues

**Port 3000 already in use:**
\`\`\`bash
# Find and kill the process
netstat -ano | findstr :3000
taskkill /PID <PID> /F
\`\`\`

**Environment variables not loading:**
\`\`\`bash
# Restart the development server
# Make sure .env.local exists and has correct values
\`\`\`

**Database connection issues:**
\`\`\`bash
pnpm run db:test
# Check your Supabase credentials
\`\`\`

**Webhook testing fails:**
\`\`\`bash
pnpm run webhook:test
# Check your Make.com webhook URLs
\`\`\`

### Getting Help

1. Check the console for error messages
2. Verify environment variables are set correctly
3. Ensure all dependencies are installed: `pnpm install`
4. Restart the development server
5. Check the documentation in `/docs/` folder

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Make.com Documentation](https://www.make.com/en/help)
- [Project Documentation](./docs/)

---

**Happy coding! 🎉**
