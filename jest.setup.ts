import { jest } from "@jest/globals"
import "@testing-library/jest-dom"
// You can add other global mocks or setup here if needed

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  usePathname: jest.fn(() => "/en"), // Default pathname with locale
  useSearchParams: jest.fn(() => new URLSearchParams()),
}))

// Mock useToast if not already globally mocked in your tests
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

// Mock Supabase client if not already done or if needed globally
// jest.mock('@/lib/supabase', () => ({
//   supabase: { /* ... your mock implementation ... */ }
// }));
