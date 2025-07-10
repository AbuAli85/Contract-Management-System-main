// Contract form options and constants
export const JOB_TITLES = [
  { value: "senior-software-engineer", label: "Senior Software Engineer" },
  { value: "software-engineer", label: "Software Engineer" },
  { value: "junior-software-engineer", label: "Junior Software Engineer" },
  { value: "full-stack-developer", label: "Full Stack Developer" },
  { value: "frontend-developer", label: "Frontend Developer" },
  { value: "backend-developer", label: "Backend Developer" },
  { value: "devops-engineer", label: "DevOps Engineer" },
  { value: "data-scientist", label: "Data Scientist" },
  { value: "product-manager", label: "Product Manager" },
  { value: "project-manager", label: "Project Manager" },
  { value: "ui-ux-designer", label: "UI/UX Designer" },
  { value: "marketing-specialist", label: "Marketing Specialist" },
  { value: "sales-representative", label: "Sales Representative" },
  { value: "business-analyst", label: "Business Analyst" },
  { value: "qa-engineer", label: "QA Engineer" },
  { value: "technical-lead", label: "Technical Lead" },
  { value: "team-lead", label: "Team Lead" },
  { value: "consultant", label: "Consultant" },
  { value: "other", label: "Other" },
] as const

export const DEPARTMENTS = [
  { value: "technology", label: "Technology" },
  { value: "engineering", label: "Engineering" },
  { value: "product", label: "Product" },
  { value: "design", label: "Design" },
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Sales" },
  { value: "operations", label: "Operations" },
  { value: "finance", label: "Finance" },
  { value: "human-resources", label: "Human Resources" },
  { value: "legal", label: "Legal" },
  { value: "customer-success", label: "Customer Success" },
  { value: "business-development", label: "Business Development" },
  { value: "data-analytics", label: "Data & Analytics" },
  { value: "quality-assurance", label: "Quality Assurance" },
  { value: "administration", label: "Administration" },
  { value: "research-development", label: "Research & Development" },
  { value: "consulting", label: "Consulting" },
  { value: "other", label: "Other" },
] as const

export const CONTRACT_TYPES = [
  // Oman Labor Law Compliant Contract Types (Make.com Automated)
  { value: "oman-unlimited-makecom", label: "🤖 Oman Unlimited Contract (Auto PDF)", category: "Make.com Automated" },
  { value: "oman-fixed-term-makecom", label: "🤖 Oman Fixed-Term Contract (Auto PDF)", category: "Make.com Automated" },
  { value: "oman-part-time-makecom", label: "🤖 Oman Part-Time Contract (Auto PDF)", category: "Make.com Automated" },
  
  // Standard Oman Labor Law Contract Types
  { value: "unlimited-contract", label: "Unlimited Contract (Permanent)", category: "Standard" },
  { value: "limited-contract", label: "Limited Contract (Fixed-term)", category: "Standard" },
  { value: "part-time-contract", label: "Part-time Contract", category: "Standard" },
  
  // Employment Categories
  { value: "full-time-permanent", label: "Full-time Permanent", category: "Employment" },
  { value: "full-time-fixed", label: "Full-time Fixed-term", category: "Employment" },
  { value: "part-time-permanent", label: "Part-time Permanent", category: "Employment" },
  { value: "part-time-fixed", label: "Part-time Fixed-term", category: "Employment" },
  
  // Specialized Contract Types
  { value: "probationary", label: "Probationary Period", category: "Specialized" },
  { value: "training-contract", label: "Training Contract", category: "Specialized" },
  { value: "internship", label: "Internship", category: "Specialized" },
  { value: "graduate-trainee", label: "Graduate Trainee", category: "Specialized" },
  
  // Project & Consulting
  { value: "project-based", label: "Project-based Contract", category: "Project" },
  { value: "consulting", label: "Consulting Agreement", category: "Project" },
  { value: "freelance", label: "Freelance Contract", category: "Project" },
  { value: "contractor", label: "Independent Contractor", category: "Project" },
  
  // Seasonal & Temporary
  { value: "seasonal", label: "Seasonal Employment", category: "Temporary" },
  { value: "temporary", label: "Temporary Assignment", category: "Temporary" },
  { value: "casual", label: "Casual Employment", category: "Temporary" },
  
  // Management & Executive
  { value: "executive", label: "Executive Contract", category: "Management" },
  { value: "management", label: "Management Agreement", category: "Management" },
  { value: "director", label: "Director Contract", category: "Management" },
  
  // Special Categories
  { value: "remote-work", label: "Remote Work Contract", category: "Special" },
  { value: "hybrid-work", label: "Hybrid Work Agreement", category: "Special" },
  { value: "secondment", label: "Secondment Agreement", category: "Special" },
  { value: "apprenticeship", label: "Apprenticeship Contract", category: "Specialized" },
  
  // Service Agreements
  { value: "service-agreement", label: "Service Agreement", category: "Service" },
  { value: "retainer", label: "Retainer Agreement", category: "Service" },
  
  // Other
  { value: "other", label: "Other Contract Type", category: "Other" },
] as const

export const CURRENCIES = [
  { value: "OMR", label: "OMR - Omani Rial" },
  { value: "AED", label: "AED - UAE Dirham" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "SAR", label: "SAR - Saudi Riyal" },
  { value: "QAR", label: "QAR - Qatari Riyal" },
  { value: "KWD", label: "KWD - Kuwaiti Dinar" },
  { value: "BHD", label: "BHD - Bahraini Dinar" },
  { value: "EGP", label: "EGP - Egyptian Pound" },
  { value: "JOD", label: "JOD - Jordanian Dinar" },
  { value: "LBP", label: "LBP - Lebanese Pound" },
  { value: "INR", label: "INR - Indian Rupee" },
  { value: "PKR", label: "PKR - Pakistani Rupee" },
  { value: "BDT", label: "BDT - Bangladeshi Taka" },
  { value: "PHP", label: "PHP - Philippine Peso" },
  { value: "MYR", label: "MYR - Malaysian Ringgit" },
  { value: "SGD", label: "SGD - Singapore Dollar" },
  { value: "THB", label: "THB - Thai Baht" },
  { value: "IDR", label: "IDR - Indonesian Rupiah" },
] as const

export const WORK_LOCATIONS = [
  { value: "muscat-office-main", label: "Muscat Office - Main Building" },
  { value: "muscat-office-technology", label: "Muscat Office - Technology Center" },
  { value: "muscat-office-operations", label: "Muscat Office - Operations Center" },
  { value: "salalah-office", label: "Salalah Office" },
  { value: "sohar-office", label: "Sohar Office" },
  { value: "nizwa-office", label: "Nizwa Office" },
  { value: "sur-office", label: "Sur Office" },
  { value: "dubai-office", label: "Dubai Office" },
  { value: "abu-dhabi-office", label: "Abu Dhabi Office" },
  { value: "riyadh-office", label: "Riyadh Office" },
  { value: "doha-office", label: "Doha Office" },
  { value: "kuwait-office", label: "Kuwait Office" },
  { value: "manama-office", label: "Manama Office" },
  { value: "remote-full", label: "Remote - Full Time" },
  { value: "remote-hybrid", label: "Remote - Hybrid" },
  { value: "client-site", label: "Party A Site" },
  { value: "multiple-locations", label: "Multiple Locations" },
  { value: "field-work", label: "Field Work" },
  { value: "other", label: "Other" },
] as const

// Helper function to convert value back to label
export const getOptionLabel = (
  options: readonly { value: string; label: string }[],
  value: string
): string => {
  const option = options.find(opt => opt.value === value)
  return option?.label || value
}

// Helper function to convert label back to value  
export const getOptionValue = (
  options: readonly { value: string; label: string }[],
  label: string
): string => {
  const option = options.find(opt => opt.label === label)
  return option?.value || label
}

// Helper function to get contract types grouped by category
export function getContractTypesByCategory(): Record<string, Array<{value: string, label: string, category?: string}>> {
  const categories: Record<string, Array<{value: string, label: string, category?: string}>> = {}
  
  CONTRACT_TYPES.forEach(contractType => {
    const category = (contractType as any).category || 'Other'
    if (!categories[category]) {
      categories[category] = []
    }
    categories[category].push(contractType as any)
  })
  
  return categories
}

// Helper function to check if a contract type is Make.com enabled
export function isMakecomEnabled(contractTypeValue: string): boolean {
  return contractTypeValue.includes('-makecom')
}

// Helper function to get Make.com enabled contract types only
export function getMakecomContractTypes(): Array<{value: string, label: string, category?: string}> {
  return CONTRACT_TYPES.filter(type => isMakecomEnabled(type.value)) as any
}
