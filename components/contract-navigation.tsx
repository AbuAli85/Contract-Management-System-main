import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, FileText, List, FileX, Sparkles, Home } from "lucide-react"

export function ContractNavigation() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="default">
        <Link href="/generate-contract-v2">
          <Sparkles className="mr-2 h-4 w-4" />
          New Contract (Templates)
        </Link>
      </Button>

      <Button asChild variant="outline">
        <Link href="/generate-contract">
          <Plus className="mr-2 h-4 w-4" />
          New Contract (Classic)
        </Link>
      </Button>

      <Button asChild variant="outline">
        <Link href="/contracts">
          <List className="mr-2 h-4 w-4" />
          All Contracts
        </Link>
      </Button>

      <Button asChild variant="outline">
        <Link href="/contracts/draft">
          <FileX className="mr-2 h-4 w-4" />
          Draft Contracts
        </Link>
      </Button>
    </div>
  )
}
