import { create, StateCreator } from "zustand"
import { supabase } from "@/lib/supabase"
import { Contract, ContractStatus } from "@/lib/types"
import { toast } from "@/hooks/use-toast"

interface ContractStats {
  total: number
  pending: number
  completed: number
  failed: number
}

interface ContractsStore {
  contracts: Contract[]
  stats: ContractStats
  error: string | null
  isLoading: boolean
  fetchContracts: () => Promise<void>
  generateContract: (contractData: Omit<Contract, "id" | "created_at" | "updated_at">) => Promise<void>
  retryContract: (contractId: string) => Promise<void>
  clearError: () => void
  getContractById: (id: string) => Contract | undefined
  updateStats: () => void
}

const createContractStore: StateCreator<ContractsStore> = (set, get) => ({
  contracts: [],
  stats: {
    total: 0,
    pending: 0,
    completed: 0,
    failed: 0,
  },
  error: null,
  isLoading: true,

  fetchContracts: async () => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase.from("contracts").select("*").order("created_at", { ascending: false })

      if (error) throw error

      set({ contracts: data || [], isLoading: false })
      get().updateStats()
    } catch (error) {
      console.error("Error fetching contracts:", error)
      set({ isLoading: false })
    }
  },

  generateContract: async (contractData) => {
    set({ isLoading: true })
    try {
      // Simulate API call
      const response = await fetch("/api/generate-contract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contractData),
      })

      if (!response.ok) {
        throw new Error("Failed to generate contract")
      }

      toast({ title: "Success", description: "Contract generation started." })
    } catch (error: any) {
      set({ error: error.message })
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      set({ isLoading: false })
    }
  },

  retryContract: async (contractId: string) => {
    console.log("Retrying contract:", contractId)
    // In a real app, you'd call an API to retry the contract generation
    // For now, we'll just move it back to 'pending'
    const updatedContracts = get().contracts.map((contract) =>
      contract.id === contractId ? { ...contract, status: "pending" } : contract,
    )
    set({ contracts: updatedContracts })
    get().updateStats()
  },

  updateStats: () => {
    const contracts = get().contracts
    const stats = {
      total: contracts.length,
      pending: contracts.filter(c => c.status === "generating" || c.status === "pending").length,
      completed: contracts.filter(c => c.status === "completed").length,
      failed: contracts.filter(c => c.status === "failed").length,
    }
    set({ stats })
  },

  clearError: () => set({ error: null }),

  getContractById: (id: string) => {
    return get().contracts.find(c => c.id === id)
  },
})

export const useContractsStore = create<ContractsStore>(createContractStore)
