import { useState, useCallback, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useRealtimeTable } from "./use-realtime-table"
import type { Promoter } from "@/lib/types"

export function useRealtimePromoters() {
  const [promoters, setPromoters] = useState<Promoter[]>([])

  const fetchPromoters = useCallback(async () => {
    const { data } = await supabase.from("promoters").select("*")
    setPromoters((data as any) || [])
  }, [])

  useRealtimeTable("promoters", fetchPromoters)

  useEffect(() => { fetchPromoters() }, [fetchPromoters])

  return promoters
}
