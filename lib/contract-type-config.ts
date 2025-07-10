// lib/contract-type-config.ts
import { z } from "zod"
import { 
  getMakecomTemplateConfig, 
  generateMakecomWebhookPayload,
  validateMakecomTemplateData,
  type MakecomTemplateConfig 
} from './makecom-template-config'

export interface ContractTypeConfig {
  id: string
  name: string
  description: string
  category: string
  requiredFields: string[]
  optionalFields: string[]
  templatePlaceholders: string[]
  validationRules: Record<string, any>
  defaultValues: Record<string, any>
  businessRules: string[]
  omanCompliant: boolean
  uaeCompliant?: boolean
  maxDuration?: number // in months
  minDuration?: number // in months
  allowsSalary: boolean
  allowsProbation: boolean
  allowsRemoteWork: boolean
}

export interface EnhancedContractTypeConfig extends ContractTypeConfig {
  makecomTemplateId?: string
  makecomIntegration?: boolean
}

// Base contract type configs
export const CONTRACT_TYPE_CONFIGS: Record<string, ContractTypeConfig> = {
  "unlimited-contract": {
    id: "unlimited-contract",
    name: "Unlimited Contract (Permanent)",
    description: "Standard Oman unlimited duration employment contract with full benefits",
    category: "Oman Labor Law",
    requiredFields: [
      "first_party_id", "second_party_id", "promoter_id", 
      "contract_start_date", "job_title", "department", 
      "basic_salary", "currency", "work_location", "email"
    ],
    optionalFields: [
      "contract_end_date", "probation_period", "allowances", 
      "working_hours", "notice_period", "special_terms"
    ],
    templatePlaceholders: [
      "{{employee_name}}", "{{employer_name}}", "{{job_title}}", 
      "{{salary}}", "{{start_date}}", "{{work_location}}", 
      "{{probation_period}}", "{{benefits}}"
    ],
    validationRules: {
      contract_end_date: "not_required",
      basic_salary: "required_positive",
      probation_period: "max_3_months"
    },
    defaultValues: {
      currency: "OMR",
      working_hours: "48",
      notice_period: "30"
    },
    businessRules: [
      "Must comply with Oman Labor Law",
      "Probation period cannot exceed 3 months",
      "Notice period minimum 30 days",
      "Salary must meet Oman minimum wage requirements",
      "Subject to Ministry of Manpower regulations"
    ],
    uaeCompliant: false,
    omanCompliant: true,
    allowsSalary: true,
    allowsProbation: true,
    allowsRemoteWork: true
  },
  
  "limited-contract": {
    id: "limited-contract", 
    name: "Limited Contract (Fixed-term)",
    description: "Fixed-term employment contract with specified end date",
    category: "Oman Labor Law",
    requiredFields: [
      "first_party_id", "second_party_id", "promoter_id",
      "contract_start_date", "contract_end_date", "job_title", 
      "department", "basic_salary", "currency", "work_location", "email"
    ],
    optionalFields: [
      "probation_period", "allowances", "working_hours", 
      "notice_period", "special_terms"
    ],
    templatePlaceholders: [
      "{{employee_name}}", "{{employer_name}}", "{{job_title}}", 
      "{{salary}}", "{{start_date}}", "{{end_date}}", 
      "{{work_location}}", "{{contract_duration}}"
    ],
    validationRules: {
      contract_end_date: "required_future_date",
      basic_salary: "required_positive",
      probation_period: "max_3_months"
    },
    defaultValues: {
      currency: "OMR",
      working_hours: "48"
    },
    businessRules: [
      "Must have specified end date",
      "Maximum duration 2 years (renewable)",
      "Probation period allowed but not exceeding 3 months",
      "Early termination requires mutual consent or cause",
      "Subject to Oman Labor Law provisions"
    ],
    uaeCompliant: false,
    omanCompliant: true,
    maxDuration: 24, // 2 years
    minDuration: 1,
    allowsSalary: true,
    allowsProbation: true,
    allowsRemoteWork: true
  },

  "internship": {
    id: "internship",
    name: "Internship Contract",
    description: "Training and learning focused internship agreement",
    category: "Training & Development",
    requiredFields: [
      "first_party_id", "second_party_id", "promoter_id",
      "contract_start_date", "contract_end_date", "job_title",
      "department", "work_location", "email"
    ],
    optionalFields: [
      "basic_salary", "allowances", "working_hours", "special_terms"
    ],
    templatePlaceholders: [
      "{{intern_name}}", "{{company_name}}", "{{position}}", 
      "{{start_date}}", "{{end_date}}", "{{supervisor}}", 
      "{{learning_objectives}}", "{{stipend}}"
    ],
    validationRules: {
      contract_end_date: "required_future_date",
      basic_salary: "optional_positive_or_zero"
    },
    defaultValues: {
      currency: "OMR",
      working_hours: "40"
    },
    businessRules: [
      "Maximum duration 12 months",
      "Salary/stipend optional",
      "Must include learning objectives",
      "Requires supervisor assignment",
      "Subject to Oman internship regulations"
    ],
    uaeCompliant: false,
    omanCompliant: true,
    maxDuration: 12,
    minDuration: 1,
    allowsSalary: false,
    allowsProbation: false,
    allowsRemoteWork: true
  },

  "consulting": {
    id: "consulting",
    name: "Consulting Agreement",
    description: "Professional consulting services agreement",
    category: "Professional Services",
    requiredFields: [
      "first_party_id", "second_party_id", "promoter_id",
      "contract_start_date", "job_title", "work_location", "email"
    ],
    optionalFields: [
      "contract_end_date", "basic_salary", "allowances", 
      "working_hours", "special_terms"
    ],
    templatePlaceholders: [
      "{{consultant_name}}", "{{client_name}}", "{{service_description}}", 
      "{{deliverables}}", "{{timeline}}", "{{fees}}", 
      "{{payment_terms}}", "{{intellectual_property}}"
    ],
    validationRules: {
      basic_salary: "optional_positive",
      working_hours: "flexible"
    },
    defaultValues: {
      currency: "OMR",
      work_location: "client-site"
    },
    businessRules: [
      "Define clear scope of work",
      "Specify deliverables and timeline", 
      "Include intellectual property clauses",
      "Payment terms must be defined",
      "Comply with Oman commercial regulations"
    ],
    uaeCompliant: false,
    omanCompliant: true,
    allowsSalary: true,
    allowsProbation: false,
    allowsRemoteWork: true
  },

  "project-based": {
    id: "project-based",
    name: "Project-based Contract", 
    description: "Contract for specific project completion",
    category: "Project Work",
    requiredFields: [
      "first_party_id", "second_party_id", "promoter_id",
      "contract_start_date", "contract_end_date", "job_title",
      "work_location", "email"
    ],
    optionalFields: [
      "basic_salary", "allowances", "working_hours", "special_terms"
    ],
    templatePlaceholders: [
      "{{contractor_name}}", "{{client_name}}", "{{project_name}}", 
      "{{project_scope}}", "{{milestones}}", "{{completion_date}}", 
      "{{payment_schedule}}", "{{success_criteria}}"
    ],
    validationRules: {
      contract_end_date: "required_future_date",
      basic_salary: "optional_positive"
    },
    defaultValues: {
      currency: "OMR"
    },
    businessRules: [
      "Must define project scope clearly",
      "Include milestone payments",
      "Specify success criteria",
      "Define change management process",
      "Comply with Oman project work regulations"
    ],
    uaeCompliant: false,
    omanCompliant: true,
    maxDuration: 36, // 3 years
    minDuration: 1,
    allowsSalary: true,
    allowsProbation: false,
    allowsRemoteWork: true
  },

  "part-time-contract": {
    id: "part-time-contract",
    name: "Part-time Contract",
    description: "Part-time employment with reduced hours",
    category: "Employment",
    requiredFields: [
      "first_party_id", "second_party_id", "promoter_id",
      "contract_start_date", "job_title", "department",
      "working_hours", "basic_salary", "currency", "work_location", "email"
    ],
    optionalFields: [
      "contract_end_date", "probation_period", "allowances", 
      "notice_period", "special_terms"
    ],
    templatePlaceholders: [
      "{{employee_name}}", "{{employer_name}}", "{{job_title}}", 
      "{{part_time_hours}}", "{{salary}}", "{{schedule}}", 
      "{{benefits_eligibility}}"
    ],
    validationRules: {
      working_hours: "required_less_than_48",
      basic_salary: "required_positive_prorated"
    },
    defaultValues: {
      currency: "OMR",
      working_hours: "24"
    },
    businessRules: [
      "Working hours must be less than full-time",
      "Pro-rated salary and benefits",
      "Flexible scheduling allowed",
      "Must comply with Oman part-time regulations"
    ],
    uaeCompliant: false,
    omanCompliant: true,
    allowsSalary: true,
    allowsProbation: true,
    allowsRemoteWork: true
  },

  "remote-work": {
    id: "remote-work",
    name: "Remote Work Contract",
    description: "Full remote work employment agreement",
    category: "Modern Work",
    requiredFields: [
      "first_party_id", "second_party_id", "promoter_id",
      "contract_start_date", "job_title", "department",
      "basic_salary", "currency", "email"
    ],
    optionalFields: [
      "contract_end_date", "probation_period", "allowances",
      "working_hours", "notice_period", "special_terms", "work_location"
    ],
    templatePlaceholders: [
      "{{employee_name}}", "{{employer_name}}", "{{job_title}}", 
      "{{remote_work_policy}}", "{{communication_tools}}", 
      "{{performance_metrics}}", "{{equipment_provision}}"
    ],
    validationRules: {
      basic_salary: "required_positive",
      work_location: "remote_or_home"
    },
    defaultValues: {
      currency: "OMR",
      working_hours: "40",
      work_location: "remote-full"
    },
    businessRules: [
      "Must define remote work policies",
      "Include communication protocols",
      "Specify equipment and technology requirements",
      "Define performance measurement criteria",
      "Comply with Oman remote work guidelines"
    ],
    uaeCompliant: false,
    omanCompliant: true,
    allowsSalary: true,
    allowsProbation: true,
    allowsRemoteWork: true
  },

  "executive": {
    id: "executive",
    name: "Executive Contract",
    description: "Senior executive employment agreement",
    category: "Leadership",
    requiredFields: [
      "first_party_id", "second_party_id", "promoter_id",
      "contract_start_date", "job_title", "department",
      "basic_salary", "currency", "work_location", "email"
    ],
    optionalFields: [
      "contract_end_date", "allowances", "working_hours",
      "notice_period", "special_terms"
    ],
    templatePlaceholders: [
      "{{executive_name}}", "{{company_name}}", "{{title}}", 
      "{{compensation_package}}", "{{equity_options}}", 
      "{{performance_bonuses}}", "{{termination_clauses}}", 
      "{{confidentiality_terms}}"
    ],
    validationRules: {
      basic_salary: "required_executive_level",
      notice_period: "minimum_90_days"
    },
    defaultValues: {
      currency: "OMR",
      notice_period: "90",
      working_hours: "flexible"
    },
    businessRules: [
      "Enhanced compensation packages",
      "Extended notice periods",
      "Confidentiality and non-compete clauses",
      "Performance-based incentives",
      "Subject to Oman executive employment regulations"
    ],
    uaeCompliant: false,
    omanCompliant: true,
    allowsSalary: true,
    allowsProbation: false,
    allowsRemoteWork: true
  }
}

// Enhanced contract type configs with Make.com integration
export const ENHANCED_CONTRACT_TYPE_CONFIGS: Record<string, EnhancedContractTypeConfig> = {
  ...CONTRACT_TYPE_CONFIGS,
  
  // Add Make.com integrated contract types
  "oman-unlimited-makecom": {
    ...CONTRACT_TYPE_CONFIGS["unlimited-contract"],
    id: "oman-unlimited-makecom",
    name: "Oman Unlimited Contract (Make.com Automated)",
    description: "Automated unlimited duration contract with Make.com PDF generation",
    makecomTemplateId: "oman-unlimited-contract",
    makecomIntegration: true
  },
  
  "oman-fixed-term-makecom": {
    ...CONTRACT_TYPE_CONFIGS["fixed-term-contract"],
    id: "oman-fixed-term-makecom", 
    name: "Oman Fixed-Term Contract (Make.com Automated)",
    description: "Automated fixed-term contract with Make.com PDF generation",
    makecomTemplateId: "oman-fixed-term-contract",
    makecomIntegration: true
  },
  
  "oman-part-time-makecom": {
    id: "oman-part-time-makecom",
    name: "Oman Part-Time Contract (Make.com Automated)",
    description: "Automated part-time contract with flexible hours and Make.com integration",
    category: "Oman Labor Law",
    requiredFields: [
      "first_party_id", "second_party_id", "promoter_id",
      "contract_start_date", "job_title", "working_hours_per_week",
      "hourly_rate", "currency", "work_location", "email"
    ],
    optionalFields: [
      "contract_end_date", "allowances", "overtime_rate", "special_terms"
    ],
    templatePlaceholders: [
      "{{employee_name}}", "{{employer_name}}", "{{job_title}}",
      "{{hourly_rate}}", "{{working_hours}}", "{{work_schedule}}"
    ],
    validationRules: {
      working_hours_per_week: "max_25_hours",
      hourly_rate: "required_positive"
    },
    defaultValues: {
      currency: "OMR",
      working_hours_per_week: "20"
    },
    businessRules: [
      "Maximum 25 hours per week",
      "Proportional benefits apply",
      "Must specify exact working schedule",
      "Subject to Oman Labor Law part-time provisions"
    ],
    omanCompliant: true,
    uaeCompliant: false,
    allowsSalary: true,
    allowsProbation: false,
    allowsRemoteWork: true,
    makecomTemplateId: "oman-part-time-contract",
    makecomIntegration: true
  }
}

// Helper functions
export function getContractTypeConfig(contractType: string): ContractTypeConfig | null {
  return CONTRACT_TYPE_CONFIGS[contractType] || null
}

export function getRequiredFieldsForType(contractType: string): string[] {
  const config = getContractTypeConfig(contractType)
  return config?.requiredFields || []
}

export function getOptionalFieldsForType(contractType: string): string[] {
  const config = getContractTypeConfig(contractType)
  return config?.optionalFields || []
}

export function getTemplatePlaceholdersForType(contractType: string): string[] {
  const config = getContractTypeConfig(contractType)
  return config?.templatePlaceholders || []
}

export function getBusinessRulesForType(contractType: string): string[] {
  const config = getContractTypeConfig(contractType)
  return config?.businessRules || []
}

export function isUAECompliant(contractType: string): boolean {
  const config = getContractTypeConfig(contractType)
  return config?.uaeCompliant || false
}

export function isOmanCompliant(contractType: string): boolean {
  const config = getContractTypeConfig(contractType)
  return config?.omanCompliant || false
}

export function getContractTypesByCategory(): Record<string, ContractTypeConfig[]> {
  const categories: Record<string, ContractTypeConfig[]> = {}
  
  Object.values(CONTRACT_TYPE_CONFIGS).forEach(config => {
    if (!categories[config.category]) {
      categories[config.category] = []
    }
    categories[config.category].push(config)
  })
  
  return categories
}

export function validateContractTypeData(contractType: string, formData: any): { 
  isValid: boolean; 
  errors: string[]; 
  warnings: string[] 
} {
  const config = getContractTypeConfig(contractType)
  if (!config) {
    return { isValid: false, errors: ["Invalid contract type"], warnings: [] }
  }

  const errors: string[] = []
  const warnings: string[] = []

  // Check required fields
  config.requiredFields.forEach(field => {
    if (!formData[field] || formData[field] === "") {
      errors.push(`${field} is required for ${config.name}`)
    }
  })

  // Type-specific validations
  if (config.maxDuration && formData.contract_start_date && formData.contract_end_date) {
    const startDate = new Date(formData.contract_start_date)
    const endDate = new Date(formData.contract_end_date)
    const durationMonths = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    
    if (durationMonths > config.maxDuration) {
      errors.push(`Contract duration cannot exceed ${config.maxDuration} months for ${config.name}`)
    }
  }

  // Salary validations
  if (!config.allowsSalary && formData.basic_salary && formData.basic_salary > 0) {
    warnings.push(`Salary is typically not applicable for ${config.name}`)
  }

  return { isValid: errors.length === 0, errors, warnings }
}

// Enhanced functions for Make.com integration
export function getEnhancedContractTypeConfig(contractTypeId: string): EnhancedContractTypeConfig | null {
  return ENHANCED_CONTRACT_TYPE_CONFIGS[contractTypeId] || null
}

export function getMakecomEnabledContractTypes(): EnhancedContractTypeConfig[] {
  return Object.values(ENHANCED_CONTRACT_TYPE_CONFIGS).filter(config => config.makecomIntegration)
}

export function generateContractWithMakecom(
  contractTypeId: string,
  contractData: any
): { webhookPayload: any; templateConfig: MakecomTemplateConfig | null; validation: any } {
  const contractConfig = getEnhancedContractTypeConfig(contractTypeId)
  const templateConfig = contractConfig?.makecomTemplateId 
    ? getMakecomTemplateConfig(contractConfig.makecomTemplateId)
    : null

  if (!contractConfig || !templateConfig) {
    return {
      webhookPayload: null,
      templateConfig: null,
      validation: { isValid: false, errors: ["Contract type not configured for Make.com"], warnings: [] }
    }
  }

  // Validate data against both contract config and Make.com template requirements
  const contractValidation = validateContractTypeData(contractTypeId, contractData)
  const templateValidation = validateMakecomTemplateData(contractConfig.makecomTemplateId!, contractData)

  const combinedValidation = {
    isValid: contractValidation.isValid && templateValidation.isValid,
    errors: [...contractValidation.errors, ...templateValidation.errors],
    warnings: [...contractValidation.warnings, ...templateValidation.warnings]
  }

  // Generate Make.com webhook payload
  const webhookPayload = combinedValidation.isValid 
    ? generateMakecomWebhookPayload(contractConfig.makecomTemplateId!, contractData)
    : null

  return {
    webhookPayload,
    templateConfig,
    validation: combinedValidation
  }
}

export function getMakecomContractTypesByCategory(): Record<string, EnhancedContractTypeConfig[]> {
  const categories: Record<string, EnhancedContractTypeConfig[]> = {}
  
  getMakecomEnabledContractTypes().forEach(config => {
    if (!categories[config.category]) {
      categories[config.category] = []
    }
    categories[config.category].push(config)
  })
  
  return categories
}
