"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"
import { Input } from "@/components/ui/input"
import { SearchIcon } from "lucide-react"

export default function ContractSearchInput() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "")
    if (term) {
      params.set("q", term)
    } else {
      params.delete("q")
    }
    router.replace(`${pathname}?${params.toString()}`)
  }, 300) // Debounce input to avoid excessive re-renders

  return (
    <div className="relative">
      <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search by party or promoter..."
        className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
        onChange={(e) => handleSearch(e.target.value)}
        defaultValue={searchParams?.get("q")?.toString()}
      />
    </div>
  )
}
