# Contract Management System - Project Summary

## Overview

A comprehensive contract management system built with Next.js 15, TypeScript, Supabase, and Tailwind CSS. The system manages employment contracts between parties with promoter assignments.

## Tech Stack

- **Frontend**: Next.js 15.2.4 (App Router), React 19, TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS, shadcn/ui components
- **Authentication**: Supabase Auth
- **Internationalization**: next-intl
- **Document Generation**: Make.com webhooks + Google Docs API

## Key Features

1. **Contract Management**
   - Create, edit, view, and delete contracts
   - Track contract status (draft, active, expired, etc.)
   - Contract timeline and history tracking
   - PDF document storage

2. **Party Management**
   - Manage employers and clients
   - Store bilingual information (English/Arabic)
   - Track commercial registration numbers
   - Contact information management

3. **Promoter Management**
   - Assign promoters to contracts
   - Track ID cards and passports
   - Document expiry notifications
   - Status tracking

4. **Authentication & Security**
   - User authentication with Supabase
   - Role-based access control
   - Session management
   - Audit logging

5. **Internationalization**
   - Multi-language support (English/Arabic)
   - RTL layout support
   - Localized date/time formatting

## Project Structure

```
Contract-Management-System-main/
├── app/                    # Next.js app router pages
│   ├── [locale]/          # Internationalized routes
│   ├── actions/           # Server actions
│   └── api/               # API routes
├── components/            # React components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions and configurations
├── types/                 # TypeScript type definitions
├── public/                # Static assets
└── supabase/             # Database migrations
```

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file with:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Make.com Webhooks
NEXT_PUBLIC_MAKE_WEBHOOK_URL=your_webhook_url
MAKE_WEBHOOK_SECRET=your_webhook_secret
```

### 2. Database Setup

1. Create required tables in Supabase (contracts, parties, promoters, etc.)
2. Run migrations from `supabase/migrations/`
3. Create storage buckets: `contracts`, `promoter-documents`, `party-files`

### 3. Authentication Setup

1. Create a test user in Supabase Auth
2. Enable email/password authentication
3. Configure auth settings in Supabase dashboard

### 4. Running the Application

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Key Components

### Contract Form

- Location: `components/contract-generator-form.tsx`
- Handles contract creation with validation
- Integrates with parties and promoters data

### Dashboard

- Location: `app/[locale]/dashboard/page.tsx`
- Displays contract statistics and recent activities
- Real-time data updates

### Party Management

- Location: `components/parties/`
- CRUD operations for parties
- File attachments and notes

### Promoter Management

- Location: `components/promoters/`
- Document upload functionality
- Expiry tracking and notifications

## API Integration

### Make.com Webhooks

- Endpoint: `/api/webhook/makecom`
- Handles document generation requests
- Integrates with Google Docs for PDF creation

### Supabase Integration

- Real-time subscriptions for data updates
- Row-level security policies
- Storage for file uploads

## Security Features

- Authentication required for all operations
- CSRF protection
- Input validation and sanitization
- Secure file upload handling
- Audit logging for all actions

## Performance Optimizations

- Server-side rendering for initial page loads
- Client-side caching with React Query
- Optimistic updates for better UX
- Lazy loading of components
- Image optimization

## Deployment

The application is ready for deployment on:

- Vercel (recommended)
- Any Node.js hosting platform
- Docker containers

## Maintenance

- Regular dependency updates
- Database backups via Supabase
- Monitor webhook integrations
- Review audit logs periodically

## Future Enhancements

- Email notifications
- Advanced reporting
- Bulk operations
- Mobile app
- API for third-party integrations
