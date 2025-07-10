// lib/makecom-template-config.ts
import { z } from "zod"

export interface MakecomTemplateConfig {
  id: string
  name: string
  description: string
  category: string
  googleDocsTemplateId: string
  templatePlaceholders: Record<string, string>
  requiredFields: string[]
  optionalFields: string[]
  businessRules: string[]
  omanCompliant: boolean
  maxDuration?: number
  minDuration?: number
  allowsSalary: boolean
  allowsProbation: boolean
  allowsRemoteWork: boolean
  makecomModuleConfig: {
    webhookTriggerFields: string[]
    templateVariables: Record<string, string>
    outputFormat: 'pdf' | 'docx' | 'both'
    googleDriveSettings?: {
      folderId?: string
      naming: string
    }
  }
}

// Template configurations for different contract types
export const MAKECOM_TEMPLATE_CONFIGS: Record<string, MakecomTemplateConfig> = {
  "oman-unlimited-contract": {
    id: "oman-unlimited-contract",
    name: "Oman Unlimited Employment Contract",
    description: "Standard unlimited duration employment contract compliant with Oman Labor Law",
    category: "Oman Labor Law",
    googleDocsTemplateId: "1ABC123DEF456GHI789JKL", // Replace with actual Google Docs template ID
    templatePlaceholders: {
      "{{employee_name_en}}": "Employee Full Name (English)",
      "{{employee_name_ar}}": "Employee Full Name (Arabic)",
      "{{employer_name_en}}": "Employer Company Name (English)",
      "{{employer_name_ar}}": "Employer Company Name (Arabic)",
      "{{contract_number}}": "Unique Contract Number",
      "{{job_title}}": "Job Position Title",
      "{{department}}": "Department/Division",
      "{{basic_salary}}": "Monthly Basic Salary",
      "{{currency}}": "Currency Code (OMR/AED/USD)",
      "{{allowances}}": "Monthly Allowances",
      "{{total_salary}}": "Total Monthly Compensation",
      "{{start_date}}": "Contract Start Date",
      "{{work_location}}": "Primary Work Location",
      "{{working_hours}}": "Weekly Working Hours",
      "{{probation_period}}": "Probation Period (if applicable)",
      "{{notice_period}}": "Notice Period for Termination",
      "{{special_terms}}": "Special Terms and Conditions",
      "{{employee_id_number}}": "Employee ID Card Number",
      "{{employer_crn}}": "Employer Commercial Registration Number",
      "{{contract_date}}": "Contract Signing Date"
    },
    requiredFields: [
      "first_party_id", "second_party_id", "promoter_id",
      "contract_start_date", "job_title", "basic_salary",
      "currency", "work_location", "email"
    ],
    optionalFields: [
      "contract_end_date", "probation_period", "allowances",
      "working_hours", "notice_period", "special_terms"
    ],
    businessRules: [
      "Must comply with Oman Labor Law Article 35-50",
      "Probation period cannot exceed 3 months",
      "Minimum 30 days notice period required",
      "Basic salary must meet Oman minimum wage (325 OMR)",
      "Subject to Ministry of Manpower approval",
      "Must include social security registration",
      "Working hours limited to 45 hours per week maximum"
    ],
    omanCompliant: true,
    allowsSalary: true,
    allowsProbation: true,
    allowsRemoteWork: false,
    makecomModuleConfig: {
      webhookTriggerFields: [
        "contract_number", "promoter_id", "first_party_id", "second_party_id"
      ],
      templateVariables: {
        "employee_name_en": "{{1.promoter_name_en.trim()}}",
        "employee_name_ar": "{{1.promoter_name_ar.trim()}}",
        "employer_name_en": "{{1.first_party_name_en.trim()}}",
        "employer_name_ar": "{{1.first_party_name_ar.trim()}}",
        "contract_number": "{{1.contract_number.replace(/[^A-Z0-9]/g, \"\")}}",
        "job_title": "{{1.job_title.trim()}}",
        "basic_salary": "{{1.basic_salary}}",
        "currency": "{{1.currency}}",
        "start_date": "{{formatDate(1.start_date, \"DD/MM/YYYY\")}}",
        "work_location": "{{1.work_location.trim()}}",
        "employee_id_number": "{{1.id_card_number.replace(/[^0-9]/g, \"\")}}"
      },
      outputFormat: 'pdf',
      googleDriveSettings: {
        folderId: "1GOOGLE_DRIVE_FOLDER_ID", // Replace with actual folder ID
        naming: "{{contract_number}}_{{employee_name_en.replace(/ /g, \"_\")}}_Unlimited_Contract"
      }
    }
  },

  "oman-fixed-term-contract": {
    id: "oman-fixed-term-contract",
    name: "Oman Fixed-Term Employment Contract",
    description: "Fixed duration employment contract with specific end date (Oman Labor Law compliant)",
    category: "Oman Labor Law",
    googleDocsTemplateId: "2ABC123DEF456GHI789JKL", // Replace with actual template ID
    templatePlaceholders: {
      "{{employee_name_en}}": "Employee Full Name (English)",
      "{{employee_name_ar}}": "Employee Full Name (Arabic)",
      "{{employer_name_en}}": "Employer Company Name (English)",
      "{{employer_name_ar}}": "Employer Company Name (Arabic)",
      "{{contract_number}}": "Unique Contract Number",
      "{{job_title}}": "Job Position Title",
      "{{department}}": "Department/Division",
      "{{basic_salary}}": "Monthly Basic Salary",
      "{{currency}}": "Currency Code (OMR/AED/USD)",
      "{{start_date}}": "Contract Start Date",
      "{{end_date}}": "Contract End Date",
      "{{contract_duration}}": "Contract Duration (months)",
      "{{work_location}}": "Primary Work Location",
      "{{renewal_clause}}": "Renewal Terms and Conditions",
      "{{termination_clause}}": "Early Termination Conditions"
    },
    requiredFields: [
      "first_party_id", "second_party_id", "promoter_id",
      "contract_start_date", "contract_end_date", "job_title",
      "basic_salary", "currency", "work_location", "email"
    ],
    optionalFields: [
      "probation_period", "allowances", "working_hours",
      "notice_period", "special_terms", "renewal_terms"
    ],
    businessRules: [
      "Maximum duration 2 years (renewable)",
      "Must specify exact end date",
      "Renewal requires new contract",
      "Early termination requires mutual consent",
      "Subject to Ministry of Manpower approval",
      "Must comply with Oman Labor Law Article 51-60"
    ],
    omanCompliant: true,
    maxDuration: 24, // 2 years maximum
    minDuration: 3,  // 3 months minimum
    allowsSalary: true,
    allowsProbation: true,
    allowsRemoteWork: false,
    makecomModuleConfig: {
      webhookTriggerFields: [
        "contract_number", "promoter_id", "first_party_id", "second_party_id"
      ],
      templateVariables: {
        "employee_name_en": "{{1.promoter_name_en.trim()}}",
        "employee_name_ar": "{{1.promoter_name_ar.trim()}}",
        "employer_name_en": "{{1.first_party_name_en.trim()}}",
        "employer_name_ar": "{{1.first_party_name_ar.trim()}}",
        "contract_number": "{{1.contract_number.replace(/[^A-Z0-9]/g, \"\")}}",
        "start_date": "{{formatDate(1.start_date, \"DD/MM/YYYY\")}}",
        "end_date": "{{formatDate(1.end_date, \"DD/MM/YYYY\")}}",
        "contract_duration": "{{round((parseDate(1.end_date) - parseDate(1.start_date)) / (1000 * 60 * 60 * 24 * 30))}}"
      },
      outputFormat: 'pdf',
      googleDriveSettings: {
        folderId: "2GOOGLE_DRIVE_FOLDER_ID",
        naming: "{{contract_number}}_{{employee_name_en.replace(/ /g, \"_\")}}_Fixed_Term_Contract"
      }
    }
  },

  "oman-part-time-contract": {
    id: "oman-part-time-contract",
    name: "Oman Part-Time Employment Contract",
    description: "Part-time employment contract with flexible working hours (Oman Labor Law compliant)",
    category: "Oman Labor Law",
    googleDocsTemplateId: "3ABC123DEF456GHI789JKL",
    templatePlaceholders: {
      "{{employee_name_en}}": "Employee Full Name (English)",
      "{{employee_name_ar}}": "Employee Full Name (Arabic)",
      "{{employer_name_en}}": "Employer Company Name (English)",
      "{{employer_name_ar}}": "Employer Company Name (Arabic)",
      "{{contract_number}}": "Unique Contract Number",
      "{{job_title}}": "Job Position Title",
      "{{working_hours_per_week}}": "Weekly Working Hours",
      "{{working_days}}": "Working Days Schedule",
      "{{hourly_rate}}": "Hourly Rate",
      "{{monthly_salary}}": "Estimated Monthly Salary",
      "{{currency}}": "Currency Code",
      "{{work_schedule}}": "Detailed Work Schedule"
    },
    requiredFields: [
      "first_party_id", "second_party_id", "promoter_id",
      "contract_start_date", "job_title", "working_hours_per_week",
      "hourly_rate", "currency", "work_location", "email"
    ],
    optionalFields: [
      "contract_end_date", "allowances", "overtime_rate",
      "special_terms", "flexible_hours"
    ],
    businessRules: [
      "Maximum 25 hours per week",
      "Must specify exact working schedule",
      "Proportional benefits apply",
      "Subject to Ministry of Manpower regulations",
      "Must comply with Oman Labor Law part-time provisions"
    ],
    omanCompliant: true,
    allowsSalary: true,
    allowsProbation: false,
    allowsRemoteWork: true,
    makecomModuleConfig: {
      webhookTriggerFields: [
        "contract_number", "promoter_id", "first_party_id", "second_party_id"
      ],
      templateVariables: {
        "working_hours_per_week": "{{1.working_hours_per_week}}",
        "hourly_rate": "{{1.hourly_rate}}",
        "monthly_salary": "{{1.working_hours_per_week * 4.33 * 1.hourly_rate}}"
      },
      outputFormat: 'pdf'
    }
  }
}

// Utility functions for Make.com integration
export function getMakecomTemplateConfig(contractTypeId: string): MakecomTemplateConfig | null {
  return MAKECOM_TEMPLATE_CONFIGS[contractTypeId] || null
}

export function getAllMakecomTemplateConfigs(): MakecomTemplateConfig[] {
  return Object.values(MAKECOM_TEMPLATE_CONFIGS)
}

export function getMakecomTemplatesByCategory(category: string): MakecomTemplateConfig[] {
  return Object.values(MAKECOM_TEMPLATE_CONFIGS).filter(config => config.category === category)
}

export function generateMakecomWebhookPayload(
  contractTypeId: string,
  contractData: any
): Record<string, any> | null {
  const config = getMakecomTemplateConfig(contractTypeId)
  if (!config) return null

  const payload: Record<string, any> = {
    contract_type: contractTypeId,
    template_id: config.googleDocsTemplateId,
    ...contractData
  }

  // Add template-specific processing
  if (config.makecomModuleConfig.googleDriveSettings) {
    payload.google_drive_folder_id = config.makecomModuleConfig.googleDriveSettings.folderId
    payload.file_naming_pattern = config.makecomModuleConfig.googleDriveSettings.naming
  }

  payload.output_format = config.makecomModuleConfig.outputFormat

  return payload
}

export function validateMakecomTemplateData(
  contractTypeId: string,
  data: any
): { isValid: boolean; errors: string[]; warnings: string[] } {
  const config = getMakecomTemplateConfig(contractTypeId)
  if (!config) {
    return { isValid: false, errors: ["Invalid contract type"], warnings: [] }
  }

  const errors: string[] = []
  const warnings: string[] = []

  // Check required fields
  config.requiredFields.forEach(field => {
    if (!data[field] || data[field] === "") {
      errors.push(`${field} is required for ${config.name}`)
    }
  })

  // Check business rules
  if (config.maxDuration && data.contract_start_date && data.contract_end_date) {
    const startDate = new Date(data.contract_start_date)
    const endDate = new Date(data.contract_end_date)
    const durationMonths = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    
    if (durationMonths > config.maxDuration) {
      errors.push(`Contract duration cannot exceed ${config.maxDuration} months for ${config.name}`)
    }
  }

  // Oman-specific validations
  if (config.omanCompliant) {
    if (data.basic_salary && data.currency === "OMR" && data.basic_salary < 325) {
      warnings.push("Salary below Oman minimum wage (325 OMR)")
    }
    
    if (data.working_hours_per_week && data.working_hours_per_week > 45) {
      errors.push("Working hours cannot exceed 45 hours per week (Oman Labor Law)")
    }
    
    if (data.probation_period && data.probation_period > 3) {
      errors.push("Probation period cannot exceed 3 months (Oman Labor Law)")
    }
  }

  return { isValid: errors.length === 0, errors, warnings }
}

// Make.com blueprint generation helper
export function generateMakecomBlueprint(contractTypeId: string): any {
  const config = getMakecomTemplateConfig(contractTypeId)
  if (!config) return null

  return {
    name: `${config.name} - Contract Generation`,
    flow: [
      {
        id: 1,
        module: "webhook",
        type: "webhook_receive",
        parameters: {
          hook: "contract_webhook",
          trigger_fields: config.makecomModuleConfig.webhookTriggerFields
        }
      },
      {
        id: 2,
        module: "http",
        type: "http_get",
        parameters: {
          url: "/api/contracts/{{1.contract_number}}",
          method: "GET"
        }
      },
      {
        id: 3,
        module: "google_docs",
        type: "create_document_from_template",
        parameters: {
          template_id: config.googleDocsTemplateId,
          variables: config.makecomModuleConfig.templateVariables
        }
      },
      {
        id: 4,
        module: "google_docs",
        type: "export_document",
        parameters: {
          document_id: "{{3.document_id}}",
          format: config.makecomModuleConfig.outputFormat
        }
      },
      {
        id: 5,
        module: "supabase",
        type: "upload_file",
        parameters: {
          bucket: "contracts",
          file_data: "{{4.data}}",
          file_name: "{{1.contract_number}}.pdf"
        }
      },
      {
        id: 6,
        module: "http",
        type: "http_patch",
        parameters: {
          url: "/api/contracts/{{1.contract_id}}",
          method: "PATCH",
          body: {
            pdf_url: "{{5.url}}",
            status: "completed"
          }
        }
      }
    ]
  }
}
