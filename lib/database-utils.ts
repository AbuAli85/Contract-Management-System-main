import { supabase } from "@/lib/supabase"
import { measurePerformance, AppError } from "@/lib/utils"

export interface PaginationOptions {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export interface PaginatedResult<T> {
  data: T[]
  count: number
  page: number
  limit: number
  totalPages: number
}

// Optimized party queries with contract counts
export async function getPartiesWithContractCounts(
  options: PaginationOptions = { page: 1, limit: 10 }
): Promise<PaginatedResult<any>> {
  return measurePerformance("getPartiesWithContractCounts", async () => {
    const { page, limit, sortBy = "created_at", sortOrder = "desc" } = options
    const offset = (page - 1) * limit

    const { data, error, count } = await supabase
      .from("parties")
      .select(
        `
        *,
        contracts:contracts(count)
      `
      )
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new AppError("Failed to fetch parties with contract counts", "DATABASE_ERROR", 500)
    }

    return {
      data: data || [],
      count: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    }
  })
}

// Optimized contract statistics
export async function getContractStatistics() {
  return measurePerformance("getContractStatistics", async () => {
    const { data, error } = await supabase.rpc("get_contract_statistics")

    if (error) {
      // Fallback to manual queries if RPC doesn't exist
      const [contractsResult, partiesResult, promotersResult, activeContractsResult] =
        await Promise.all([
          supabase.from("contracts").select("*", { count: "exact", head: true }),
          supabase.from("parties").select("*", { count: "exact", head: true }),
          supabase.from("promoters").select("*", { count: "exact", head: true }),
          supabase
            .from("contracts")
            .select("*", { count: "exact", head: true })
            .eq("status", "active"),
        ])

      return {
        contracts: contractsResult.count || 0,
        parties: partiesResult.count || 0,
        promoters: promotersResult.count || 0,
        activeContracts: activeContractsResult.count || 0,
      }
    }

    return data
  })
}

// Optimized contract queries with relations
export async function getContractsWithRelations(
  options: PaginationOptions = { page: 1, limit: 10 }
): Promise<PaginatedResult<any>> {
  return measurePerformance("getContractsWithRelations", async () => {
    const { page, limit, sortBy = "created_at", sortOrder = "desc" } = options
    const offset = (page - 1) * limit

    const { data, error, count } = await supabase
      .from("contracts")
      .select(
        `
        *,
        parties:contract_parties(
          party:parties(*)
        ),
        promoter:promoters(*)
      `
      )
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new AppError("Failed to fetch contracts with relations", "DATABASE_ERROR", 500)
    }

    return {
      data: data || [],
      count: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    }
  })
}

// Search functionality with full-text search
export async function searchContracts(
  query: string,
  options: PaginationOptions = { page: 1, limit: 10 }
): Promise<PaginatedResult<any>> {
  return measurePerformance("searchContracts", async () => {
    const { page, limit } = options
    const offset = (page - 1) * limit

    const { data, error, count } = await supabase
      .from("contracts")
      .select(
        `
        *,
        parties:contract_parties(
          party:parties(*)
        )
      `
      )
      .or(`title.ilike.%${query}%, description.ilike.%${query}%`)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new AppError("Failed to search contracts", "DATABASE_ERROR", 500)
    }

    return {
      data: data || [],
      count: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    }
  })
}

// Batch operations for better performance
export async function batchUpdateContracts(
  contractIds: string[],
  updates: Partial<any>
): Promise<void> {
  return measurePerformance("batchUpdateContracts", async () => {
    const { error } = await supabase.from("contracts").update(updates).in("id", contractIds)

    if (error) {
      throw new AppError("Failed to batch update contracts", "DATABASE_ERROR", 500)
    }
  })
}

// Cache management
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

export function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key)
  if (!cached) return null

  const now = Date.now()
  if (now - cached.timestamp > cached.ttl) {
    cache.delete(key)
    return null
  }

  return cached.data
}

export function setCachedData<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  })
}

export function clearCache(pattern?: string): void {
  if (!pattern) {
    cache.clear()
    return
  }

  const keys = Array.from(cache.keys())
  keys.forEach((key) => {
    if (key.includes(pattern)) {
      cache.delete(key)
    }
  })
}
