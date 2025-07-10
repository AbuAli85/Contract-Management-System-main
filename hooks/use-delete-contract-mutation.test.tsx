import { render, fireEvent, waitFor, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useDeleteContractMutation } from "@/hooks/use-contracts"

const toastMock = jest.fn()

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}))

const deleteContractMock = jest.fn()

jest.mock("@/app/actions/contracts", () => ({
  deleteContract: deleteContractMock,
}))

describe("useDeleteContractMutation", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("shows toast when deletion fails", async () => {
    deleteContractMock.mockRejectedValue(new Error("Delete failed"))

    const queryClient = new QueryClient()

    const TestComponent = () => {
      const mutation = useDeleteContractMutation()
      return <button onClick={() => mutation.mutate("123")}>Delete</button>
    }

    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
      </QueryClientProvider>,
    )

    fireEvent.click(screen.getByRole("button"))

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ variant: "destructive" }))
    })
  })
})
