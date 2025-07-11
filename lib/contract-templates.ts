// Contract Templates Configuration
// This file defines the contract templates and their integration with Make.com

export interface ContractTemplate {
  id: string
  name: string
  description: string
  category: string
  fields: string[]
  makeScenarioId?: string // Make.com scenario ID for automation
  documentUrl?: string // Template document URL
  metadata?: Record<string, any>
}

export const contractTemplates: ContractTemplate[] = [
  {
    id: "standard-employment",
    name: "Standard Employment Contract",
    description: "Full-time employment agreement with standard terms",
    category: "employment",
    fields: [
      "first_party_id",
      "second_party_id",
      "promoter_id",
      "contract_start_date",
      "contract_end_date",
      "contract_value",
      "job_title",
      "work_location",
    ],
    makeScenarioId: process.env.NEXT_PUBLIC_MAKE_EMPLOYMENT_SCENARIO_ID,
    documentUrl: "/templates/employment-contract.docx",
    metadata: {
      probationPeriod: "3 months",
      noticePeriod: "30 days",
      workingHours: "40 hours/week",
    },
  },
  {
    id: "service-agreement",
    name: "Service Agreement",
    description: "Professional services contract for consultants and contractors",
    category: "service",
    fields: [
      "first_party_id",
      "second_party_id",
      "promoter_id",
      "contract_start_date",
      "contract_end_date",
      "contract_value",
      "job_title",
      "work_location",
      "deliverables",
      "payment_terms",
    ],
    makeScenarioId: process.env.NEXT_PUBLIC_MAKE_SERVICE_SCENARIO_ID,
    documentUrl: "/templates/service-agreement.docx",
  },
  {
    id: "partnership-agreement",
    name: "Partnership Agreement",
    description: "Business partnership with profit sharing arrangements",
    category: "partnership",
    fields: [
      "first_party_id",
      "second_party_id",
      "contract_start_date",
      "contract_end_date",
      "profit_share_percentage",
      "capital_contribution",
      "responsibilities",
    ],
    makeScenarioId: process.env.NEXT_PUBLIC_MAKE_PARTNERSHIP_SCENARIO_ID,
    documentUrl: "/templates/partnership-agreement.docx",
  },
  {
    id: "freelance-contract",
    name: "Freelance Contract",
    description: "Project-based work agreement for freelancers",
    category: "freelance",
    fields: [
      "first_party_id",
      "second_party_id",
      "promoter_id",
      "contract_start_date",
      "contract_end_date",
      "contract_value",
      "job_title",
      "project_scope",
      "hourly_rate",
      "max_hours",
    ],
    makeScenarioId: process.env.NEXT_PUBLIC_MAKE_FREELANCE_SCENARIO_ID,
    documentUrl: "/templates/freelance-contract.docx",
  },
]

export function getTemplateById(id: string): ContractTemplate | undefined {
  return contractTemplates.find((template) => template.id === id)
}

export function getTemplatesByCategory(category: string): ContractTemplate[] {
  return contractTemplates.filter((template) => template.category === category)
}

export function getRequiredFields(templateId: string): string[] {
  const template = getTemplateById(templateId)
  return template?.fields || []
}
