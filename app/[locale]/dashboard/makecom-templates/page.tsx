// app/[locale]/dashboard/makecom-templates/page.tsx
import { Metadata } from "next"
import MakecomContractTemplates from "@/components/makecom-contract-templates"

export const metadata: Metadata = {
  title: "Make.com Contract Templates | Dashboard",
  description: "Manage and configure Make.com contract templates for automated PDF generation",
}

export default function MakecomTemplatesPage() {
  return (
    <div className="container mx-auto py-6">
      <MakecomContractTemplates />
    </div>
  )
}
