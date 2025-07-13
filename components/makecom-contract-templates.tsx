'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusIcon, SettingsIcon, FileTextIcon } from 'lucide-react'
import Link from "next/link"
import { useParams } from "next/navigation"

export default function MakecomContractTemplates() {
  const params = useParams()
  const locale = params?.locale || 'en'

  const templates = [
    {
      id: "employment",
      name: "Employment Contract",
      description: "Generate standard employment agreements.",
      scenarioId: process.env.NEXT_PUBLIC_MAKE_EMPLOYMENT_SCENARIO_ID || "N/A",
    },
    {
      id: "service",
      name: "Service Agreement",
      description: "Create contracts for services provided.",
      scenarioId: process.env.NEXT_PUBLIC_MAKE_SERVICE_SCENARIO_ID || "N/A",
    },
    {
      id: "partnership",
      name: "Partnership Agreement",
      description: "Draft agreements for business partnerships.",
      scenarioId: process.env.NEXT_PUBLIC_MAKE_PARTNERSHIP_SCENARIO_ID || "N/A",
    },
    {
      id: "freelance",
      name: "Freelance Contract",
      description: "Generate contracts for freelance work.",
      scenarioId: process.env.NEXT_PUBLIC_MAKE_FREELANCE_SCENARIO_ID || "N/A",
    },
  ]

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Make.com Contract Templates</h1>
      <p className="text-gray-600">
        Manage and trigger contract generation using pre-configured Make.com scenarios.
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">{template.name}</CardTitle>
              <FileTextIcon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{template.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Scenario ID:</span>
                <code className="rounded bg-gray-100 px-2 py-1 font-mono text-xs">
                  {template.scenarioId}
                </code>
              </div>
              <Button asChild className="w-full">
                <Link href={`/${locale}/generate-contract?template=${template.id}`}>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Generate Contract
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Integration Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Ensure your Make.com webhooks and API keys are correctly configured for seamless contract generation.
          </p>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Make.com Webhook URL:</span>
            <code className="rounded bg-gray-100 px-2 py-1 font-mono text-xs">
              {process.env.NEXT_PUBLIC_MAKE_WEBHOOK_URL || "Not Configured"}
            </code>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Make.com API Key:</span>
            <code className="rounded bg-gray-100 px-2 py-1 font-mono text-xs">
              {process.env.MAKE_API_KEY ? "********" : "Not Configured"}
            </code>
          </div>
          <Button variant="outline">
            <SettingsIcon className="mr-2 h-4 w-4" />
            Configure Make.com
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
