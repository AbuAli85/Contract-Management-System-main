import { render, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { usePromoters } from "@/hooks/use-promoters"

const toastMock = jest.fn()

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/"),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}))

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}))

const fromMock = jest.fn()

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: fromMock,
    channel: jest.fn(() => ({ on: jest.fn().mockReturnThis(), subscribe: jest.fn(() => "chan") })),
    removeChannel: jest.fn(),
  },
}))

describe("usePromoters", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("shows toast when unauthenticated", async () => {
    const queryClient = new QueryClient()

    const TestComponent = () => {
      usePromoters()
      return null
    }

    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
      </QueryClientProvider>,
    )

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Error loading promoters" }),
      )
    })
  })

  it("shows toast without redirect for other errors", async () => {
    fromMock.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn(() => Promise.resolve({ data: null, error: { message: "DB Error" } })),
    })

    const queryClient = new QueryClient()

    const TestComponent = () => {
      usePromoters()
      return null
    }

    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
      </QueryClientProvider>,
    )

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Error loading promoters" }),
      )
    })
  })
})
