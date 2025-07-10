# Extra Contracts YY - Bilingual Contract Management System

A full-stack Next.js application for managing and generating bilingual (Arabic/English) contracts with real-time updates, role-based dashboards, and webhook integrations.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/abuali85s-projects/v0-fork-of-v0-dev-form-component)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/zVc3ijHfuT4)

## 🚀 Features

- **Bilingual Contract Generation**: Create contracts in both Arabic and English
- **Real-time Updates**: Live data synchronization using Supabase real-time subscriptions
- **Role-based Access**: Different dashboards for different user roles
- **Audit Logging**: Comprehensive tracking of all system activities
- **Webhook Integration**: Automated PDF generation via Make.com
- **Internationalization**: Multi-language support with Next.js i18n
- **Type Safety**: Full TypeScript support with generated Supabase types
- **Responsive Design**: Mobile-first UI built with Tailwind CSS and Shadcn/UI

## 🏗️ Architecture

### Technology Stack

- **Frontend**: Next.js 14 (App Router) with React 18 + TypeScript
- **Styling**: Tailwind CSS + Shadcn/UI components
- **State Management**: React Query + custom hooks
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase real-time subscriptions
- **Testing**: Jest + React Testing Library
- **Deployment**: Vercel

### Project Structure

```
extra-contracts-yy/
├── app/                    # Next.js App Router pages
│   ├── [locale]/          # Internationalized routes
│   ├── api/               # API routes for contracts, webhooks
│   └── actions/           # Server actions
├── components/            # Reusable UI components
│   ├── ui/               # Shadcn/UI components
│   └── dashboard/        # Dashboard-specific components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities, schemas, Supabase clients
├── scripts/              # SQL migrations, seeding, webhook monitors
└── types/                # TypeScript type definitions
```

## 🛠️ Setup & Installation

### Prerequisites

- **Node.js 20** or higher
- **pnpm** (recommended) or npm
- **Supabase** account and project
- **Make.com** account (for webhook automation)

### 1. Clone and Install

```bash
git clone <repository-url>
cd extra-contracts-yy
pnpm install
```

### 2. Environment Configuration

Copy the example environment file and configure your variables:

```bash
cp env.example .env.local
```

#### Required Environment Variables

| Variable | Purpose | Scope |
|----------|---------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Client |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Server |
| `MAKE_WEBHOOK_URL` | Make.com webhook endpoint | Server |
| `MAKE_WEBHOOK_SECRET` | Webhook authentication secret | Server |

#### Optional Environment Variables

| Variable | Purpose | Scope |
|----------|---------|-------|
| `GOOGLE_CREDENTIALS_JSON` | Google service account credentials | Server |
| `GOOGLE_DOCS_TEMPLATE_ID` | Google Docs template ID | Server |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Email configuration | Server |

### 3. Database Setup

Run the SQL migration scripts in order:

```bash
# Execute scripts in /scripts directory
# 001_create_promoters_table.sql
# 002_alter_parties_add_type.sql
# ... (continue with all numbered scripts)
```

### 4. Generate TypeScript Types

```bash
npx supabase gen types typescript --project-id <YOUR_PROJECT_REF> --schema public > types/supabase.ts
```

### 5. Development

```bash
# Start development server
pnpm dev

# Run linting
pnpm lint

# Run tests
pnpm test

# Build for production
pnpm build
```

## 📖 Usage Guide

### Contract Management

1. **Create a Contract**:
   - Navigate to `/generate-contract`
   - Fill in party and promoter details
   - Submit to generate bilingual PDF

2. **Manage Contracts**:
   - View all contracts at `/contracts`
   - Edit existing contracts
   - Track contract status and lifecycle

### Promoter Management

1. **Add Promoters**:
   - Go to `/manage-promoters`
   - Fill in promoter details including ID documents
   - Upload required documents

2. **Promoter Analytics**:
   - View promoter performance metrics
   - Track active contracts per promoter

### Dashboard Features

- **Analytics**: Contract statistics and trends
- **Audit Logs**: System activity tracking
- **Notifications**: Real-time alerts and updates
- **User Management**: Role-based access control

## 🔧 API Reference

### Contract Endpoints

```typescript
// Create contract
POST /api/contracts
{
  "first_party_id": "uuid",
  "second_party_id": "uuid", 
  "promoter_id": "uuid",
  "job_title": "string",
  "work_location": "string",
  "contract_start_date": "YYYY-MM-DD",
  "contract_end_date": "YYYY-MM-DD"
}

// Get contract
GET /api/contracts/[id]

// Update contract
PUT /api/contracts/[id]

// Delete contract
DELETE /api/contracts/[id]
```

### Webhook Endpoints

```typescript
// Trigger webhook
POST /api/trigger-webhook

// Test webhook
POST /api/test-webhook
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Test Structure

- **Unit Tests**: `__tests__/` folders in each directory
- **Component Tests**: Test files alongside components
- **API Tests**: Endpoint testing in `app/api/`

## 🔄 Real-time Features

The application uses Supabase real-time subscriptions for live updates:

```typescript
// Example: Real-time contracts
import { useRealtimeContracts } from "@/hooks/use-realtime-contracts"

export default function ContractList() {
  const contracts = useRealtimeContracts()
  
  return (
    <div>
      {contracts.map(contract => (
        <ContractCard key={contract.id} contract={contract} />
      ))}
    </div>
  )
}
```

Available real-time hooks:
- `useRealtimeContracts()` - Contract updates
- `useRealtimePromoters()` - Promoter updates  
- `useRealtimeParties()` - Party updates

## 🚀 Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production

Ensure all required environment variables are set in your production environment:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Make.com
MAKE_WEBHOOK_URL=your_webhook_url
MAKE_WEBHOOK_SECRET=your_webhook_secret
```

## 🔒 Security

- **Row Level Security (RLS)**: Database-level access control
- **Authentication**: Supabase Auth with role-based permissions
- **API Security**: Server-side validation and type checking
- **Environment Variables**: Secure configuration management

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation in `/docs`
- Review existing issues
- Create a new issue with detailed information

---

**Live Demo**: [https://vercel.com/abuali85s-projects/v0-fork-of-v0-dev-form-component](https://vercel.com/abuali85s-projects/v0-fork-of-v0-dev-form-component)

**Continue Development**: [https://v0.dev/chat/projects/zVc3ijHfuT4](https://v0.dev/chat/projects/zVc3ijHfuT4)
