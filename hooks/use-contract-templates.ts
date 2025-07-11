import { useEffect, useState } from "react"
import { useSupabase } from "@/components/supabase-provider"
import { ContractTemplate } from "@/components/contract-template-selector"

export function useContractTemplates() {
  const { supabase } = useSupabase()
  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from("contract_templates")
          .select("*")
          .eq("is_active", true)
          .order("name")

        if (fetchError) throw fetchError

        setTemplates(data || [])
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch templates"))
      } finally {
        setLoading(false)
      }
    }

    fetchTemplates()

    // Subscribe to changes
    const channel = supabase
      .channel("contract_templates_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "contract_templates" }, () => {
        fetchTemplates()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return {
    data: templates,
    isLoading: loading,
    error,
    refetch: async () => {
      setLoading(true)
      try {
        const { data, error: fetchError } = await supabase
          .from("contract_templates")
          .select("*")
          .eq("is_active", true)
          .order("name")

        if (fetchError) throw fetchError
        setTemplates(data || [])
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch templates"))
      } finally {
        setLoading(false)
      }
    },
  }
}
