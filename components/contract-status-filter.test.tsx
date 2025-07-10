import { render, screen, fireEvent } from "@testing-library/react"
import { ContractStatusFilter } from "./contract-status-filter"
import { NextIntlClientProvider } from "next-intl"
import messages from "@/i18n/messages/en.json" // Import your English messages file
import { jest } from "@jest/globals" // Import jest globals

// Mock next-intl useTranslations
jest.mock("next-intl", () => ({
  useTranslations: jest.fn((namespace: string) => {
    const translations: { [key: string]: { [key: string]: string } } = {
      ContractStatusFilter: {
        filterByStatus: "Filter by Status",
        all: "All",
        draft: "Draft",
        pendingReview: "Pending Review",
        active: "Active",
        completed: "Completed",
        terminated: "Terminated",
      },
    }
    return (key: string) => translations[namespace]?.[key] || key
  }),
}))

describe("ContractStatusFilter", () => {
  it('renders the dropdown menu with default "Filter by Status" text', () => {
    const mockOnSelectStatus = jest.fn()
    render(
      <NextIntlClientProvider messages={messages}>
        <ContractStatusFilter onSelectStatus={mockOnSelectStatus} />
      </NextIntlClientProvider>,
    )

    expect(screen.getByRole("button", { name: /Filter by Status/i })).toBeInTheDocument()
  })

  it("displays all status options when opened", async () => {
    const mockOnSelectStatus = jest.fn()
    render(
      <NextIntlClientProvider messages={messages}>
        <ContractStatusFilter onSelectStatus={mockOnSelectStatus} />
      </NextIntlClientProvider>,
    )

    fireEvent.click(screen.getByRole("button", { name: /Filter by Status/i }))

    expect(screen.getByText("All")).toBeInTheDocument()
    expect(screen.getByText("Draft")).toBeInTheDocument()
    expect(screen.getByText("Pending Review")).toBeInTheDocument()
    expect(screen.getByText("Active")).toBeInTheDocument()
    expect(screen.getByText("Completed")).toBeInTheDocument()
    expect(screen.getByText("Terminated")).toBeInTheDocument()
  })

  it("calls onSelectStatus with the correct value when an option is clicked", () => {
    const mockOnSelectStatus = jest.fn()
    render(
      <NextIntlClientProvider messages={messages}>
        <ContractStatusFilter onSelectStatus={mockOnSelectStatus} />
      </NextIntlClientProvider>,
    )

    fireEvent.click(screen.getByRole("button", { name: /Filter by Status/i }))
    fireEvent.click(screen.getByText("Active"))

    expect(mockOnSelectStatus).toHaveBeenCalledWith("Active")
  })

  it("updates the button text to the selected status", () => {
    const mockOnSelectStatus = jest.fn()
    const { rerender } = render(
      <NextIntlClientProvider messages={messages}>
        <ContractStatusFilter onSelectStatus={mockOnSelectStatus} />
      </NextIntlClientProvider>,
    )

    fireEvent.click(screen.getByRole("button", { name: /Filter by Status/i }))
    fireEvent.click(screen.getByText("Active"))

    rerender(
      <NextIntlClientProvider messages={messages}>
        <ContractStatusFilter onSelectStatus={mockOnSelectStatus} selectedStatus="Active" />
      </NextIntlClientProvider>,
    )

    expect(screen.getByRole("button", { name: /Active/i })).toBeInTheDocument()
  })
})
