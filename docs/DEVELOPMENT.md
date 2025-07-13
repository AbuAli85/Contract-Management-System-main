# Development Guide

This document provides comprehensive guidance for developers working on the Extra Contracts YY project.

## 🏗️ Architecture Overview

### Technology Stack

- **Frontend**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn/UI
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase real-time subscriptions
- **Testing**: Jest + React Testing Library
- **Deployment**: Vercel

### Project Structure

\`\`\`
extra-contracts-yy/
├── app/                    # Next.js App Router
│   ├── [locale]/          # Internationalized routes
│   ├── api/               # API routes
│   └── actions/           # Server actions
├── components/            # Reusable components
│   ├── ui/               # Shadcn/UI components
│   └── dashboard/        # Dashboard components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and configurations
├── scripts/              # Database migrations and utilities
├── types/                # TypeScript type definitions
└── docs/                 # Documentation
\`\`\`

## 📝 Coding Standards

### TypeScript

- Use strict TypeScript configuration
- Prefer interfaces over types for object shapes
- Use generic types for reusable components
- Avoid `any` type - use proper typing or `unknown`

\`\`\`typescript
// Good
interface User {
  id: string
  name: string
  email: string
}

// Bad
const user: any = { id: 1, name: "John" }
\`\`\`

### React Components

- Use functional components with hooks
- Prefer composition over inheritance
- Use proper prop types and interfaces
- Implement error boundaries for critical components

\`\`\`typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary'
  children: React.ReactNode
  onClick?: () => void
}

export function Button({ variant = 'primary', children, onClick }: ButtonProps) {
  return (
    <button 
      className={`btn btn-${variant}`} 
      onClick={onClick}
    >
      {children}
    </button>
  )
}
\`\`\`

### File Naming

- Use kebab-case for file names
- Use PascalCase for component names
- Use camelCase for functions and variables
- Add `.test.ts` or `.test.tsx` for test files

\`\`\`
components/
├── user-profile.tsx
├── UserProfile.test.tsx
└── use-user-data.ts
\`\`\`

## 🔧 Development Workflow

### 1. Setting Up Development Environment

\`\`\`bash
# Clone repository
git clone <repository-url>
cd extra-contracts-yy

# Install dependencies
pnpm install

# Set up environment variables
cp env.example .env.local
# Edit .env.local with your values

# Start development server
pnpm dev
\`\`\`

### 2. Database Migrations

When making database changes:

1. Create a new SQL migration file in `/scripts`
2. Follow the naming convention: `XXX_description.sql`
3. Test the migration locally
4. Update TypeScript types if needed

\`\`\`bash
# Generate types after schema changes
npx supabase gen types typescript --project-id <YOUR_PROJECT_REF> --schema public > types/supabase.ts
\`\`\`

### 3. API Development

#### Creating New API Routes

1. Create a new file in `app/api/`
2. Use proper TypeScript interfaces
3. Implement validation
4. Add error handling
5. Write tests

\`\`\`typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server"
import { validateCreateUserRequest } from "@/lib/validations/api"
import type { CreateUserRequest } from "@/lib/types/api"

export async function POST(request: NextRequest) {
  try {
    const body: CreateUserRequest = await request.json()
    
    // Validate request
    const validation = validateCreateUserRequest(body)
    if (!validation.isValid) {
      return NextResponse.json(
        { message: "Validation failed", errors: validation.errors },
        { status: 400 }
      )
    }
    
    // Process request
    // ...
    
    return NextResponse.json({ message: "Success" }, { status: 201 })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
\`\`\`

### 4. Component Development

#### Creating Reusable Components

1. Create component in appropriate directory
2. Add TypeScript interfaces
3. Implement proper error handling
4. Add loading states
5. Write tests

\`\`\`typescript
// components/ui/data-table.tsx
interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  loading?: boolean
  error?: string
}

export function DataTable<T>({ data, columns, loading, error }: DataTableProps<T>) {
  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />
  
  return (
    <Table>
      {/* Table implementation */}
    </Table>
  )
}
\`\`\`

### 5. Testing

#### Unit Tests

- Test individual functions and components
- Use descriptive test names
- Mock external dependencies
- Test error cases

\`\`\`typescript
// components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
  
  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
\`\`\`

#### Integration Tests

- Test component interactions
- Test API routes
- Test user workflows

### 6. Real-time Features

#### Using Real-time Hooks

\`\`\`typescript
// hooks/use-realtime-contracts.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Contract } from '@/lib/types'

export function useRealtimeContracts() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Initial fetch
    fetchContracts()
    
    // Set up real-time subscription
    const channel = supabase
      .channel('contracts')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'contracts' },
        () => fetchContracts()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { contracts, loading, error }
}
\`\`\`

## 🚀 Performance Optimization

### 1. Code Splitting

- Use dynamic imports for large components
- Implement route-based code splitting
- Lazy load non-critical components

\`\`\`typescript
// Lazy load heavy components
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false
})
\`\`\`

### 2. Database Optimization

- Use proper indexes
- Implement pagination for large datasets
- Use RLS policies for security
- Optimize queries

### 3. Caching

- Implement React Query for data caching
- Use Next.js caching strategies
- Cache static assets

## 🔒 Security Best Practices

### 1. Authentication

- Use Supabase Auth for authentication
- Implement proper role-based access
- Validate user permissions on both client and server

### 2. Data Validation

- Validate all user inputs
- Use Zod schemas for validation
- Sanitize data before database operations

### 3. API Security

- Use proper HTTP status codes
- Implement rate limiting
- Validate request headers
- Use environment variables for secrets

## 🧪 Testing Strategy

### 1. Test Types

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test complete user workflows
- **API Tests**: Test API endpoints

### 2. Test Coverage

- Aim for 80%+ code coverage
- Test error cases and edge cases
- Test accessibility features

### 3. Testing Tools

- Jest for unit testing
- React Testing Library for component testing
- Playwright for E2E testing

## 📦 Deployment

### 1. Environment Setup

- Configure production environment variables
- Set up database connections
- Configure CDN and caching

### 2. Build Process

\`\`\`bash
# Build for production
pnpm build

# Test production build
pnpm start
\`\`\`

### 3. Monitoring

- Set up error tracking (Sentry)
- Monitor performance metrics
- Set up logging

## 🔄 Git Workflow

### 1. Branch Strategy

- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: New features
- `bugfix/*`: Bug fixes
- `hotfix/*`: Critical fixes

### 2. Commit Messages

Use conventional commit format:

\`\`\`
type(scope): description

feat(contracts): add contract generation API
fix(auth): resolve login redirect issue
docs(readme): update installation instructions
\`\`\`

### 3. Pull Request Process

1. Create feature branch
2. Make changes and write tests
3. Update documentation
4. Create pull request
5. Code review
6. Merge to develop
7. Deploy to staging
8. Merge to main

## 🐛 Debugging

### 1. Development Tools

- Use React DevTools
- Use Next.js debugging features
- Use browser developer tools

### 2. Logging

\`\`\`typescript
// Use structured logging
console.log('API Request:', {
  method: 'POST',
  endpoint: '/api/contracts',
  data: requestBody
})
\`\`\`

### 3. Error Handling

- Implement proper error boundaries
- Use try-catch blocks
- Log errors with context

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🤝 Contributing

1. Read this development guide
2. Follow the coding standards
3. Write tests for new features
4. Update documentation
5. Submit pull requests

For questions or issues, please create an issue in the repository.
