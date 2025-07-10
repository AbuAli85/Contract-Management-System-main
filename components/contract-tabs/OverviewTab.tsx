import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { KeyMetricCard } from '@/components/KeyMetricCard'
import { ContractDetail } from '@/lib/types'
import { formatCurrency, calculateDuration, formatDate, formatDateTime, copyToClipboard } from '@/utils/format'
import { 
  CalendarIcon, 
  TagIcon, 
  FileTextIcon, 
  AlertCircleIcon,
  MapPinIcon,
  MailIcon,
  CopyIcon
} from 'lucide-react'
import { 
  JOB_TITLES, 
  DEPARTMENTS, 
  CONTRACT_TYPES, 
  CURRENCIES, 
  WORK_LOCATIONS,
  getOptionLabel 
} from '@/constants/contract-options'

interface OverviewTabProps {
  contract: ContractDetail | null
}

export function OverviewTab({ contract }: OverviewTabProps) {
  if (!contract) {
    return <div>No contract data available.</div>
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KeyMetricCard
          title="Contract Status"
          value={contract?.status || 'Unknown'}
          icon={AlertCircleIcon}
          colorClass="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
        />

        <KeyMetricCard
          title="Duration"
          value={calculateDuration(contract?.contract_start_date, contract?.contract_end_date)}
          icon={CalendarIcon}
          colorClass="bg-gradient-to-br from-green-50 to-green-100 border-green-200"
        />

        <KeyMetricCard
          title="Value"
          value={formatCurrency(contract?.contract_value ?? undefined, contract?.currency)}
          icon={TagIcon}
          colorClass="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200"
        />

        <KeyMetricCard
          title="Documents"
          value={(contract?.google_doc_url ? 1 : 0) + (contract?.pdf_url ? 1 : 0)}
          icon={FileTextIcon}
          colorClass="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200"
        />
      </div>

      {/* Contract Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <FileTextIcon className="h-5 w-5" />
              Contract Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Job Title</label>
                  <p className="font-semibold text-gray-900 mt-1">
                    {contract?.job_title 
                      ? getOptionLabel(JOB_TITLES, contract.job_title)
                      : "Senior Software Engineer"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Department</label>
                  <p className="font-semibold text-gray-900 mt-1">
                    {contract?.department 
                      ? getOptionLabel(DEPARTMENTS, contract.department)
                      : "Technology"}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Contract Type</label>
                  <p className="font-semibold text-gray-900 mt-1">
                    {contract?.contract_type 
                      ? getOptionLabel(CONTRACT_TYPES, contract.contract_type)
                      : "Full-time"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Currency</label>
                  <p className="font-semibold text-gray-900 mt-1">
                    {contract?.currency 
                      ? getOptionLabel(CURRENCIES, contract.currency)
                      : "USD - US Dollar"}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Start Date</label>
                  <p className="font-semibold text-gray-900 mt-1">
                    {formatDate(contract?.contract_start_date) !== "N/A" 
                      ? formatDate(contract?.contract_start_date)
                      : "01-01-2025"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">End Date</label>
                  <p className="font-semibold text-gray-900 mt-1">
                    {formatDate(contract?.contract_end_date) !== "N/A" 
                      ? formatDate(contract?.contract_end_date)
                      : "01-01-2027"}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Work Location</label>
                <p className="font-semibold text-gray-900 mt-1 flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4 text-gray-500" />
                  {contract?.work_location 
                    ? getOptionLabel(WORK_LOCATIONS, contract.work_location)
                    : "Dubai Office - Technology Center"}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="font-semibold text-gray-900 mt-1 flex items-center gap-2">
                  <MailIcon className="h-4 w-4 text-gray-500" />
                  {contract?.email || "senior.engineer@alamri.com"}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Contract Number</label>
                <p className="font-semibold text-gray-900 mt-1">{contract?.contract_number || "Not assigned"}</p>
              </div>
              
              {contract?.id_card_number && (
                <div>
                  <label className="text-sm font-medium text-gray-500">ID Card Number</label>
                  <p className="font-semibold text-gray-900 mt-1">{contract.id_card_number}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <AlertCircleIcon className="h-5 w-5" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Contract ID</label>
                <div className="mt-1 flex items-center gap-2">
                  <code className="bg-gray-100 px-3 py-2 rounded-lg text-sm font-mono flex-1">{contract?.id}</code>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(contract?.id || '')}>
                    <CopyIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Party A (Client)</label>
                  <p className="font-mono text-sm text-gray-700 mt-1">
                    {contract?.first_party?.name_en || contract?.first_party_id || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Party B (Employer)</label>
                  <p className="font-mono text-sm text-gray-700 mt-1">
                    {contract?.second_party?.name_en || contract?.second_party_id || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Promoter</label>
                  <p className="font-mono text-sm text-gray-700 mt-1">
                    {contract?.promoter?.name_en || contract?.promoter_id || "N/A"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Created At</label>
                  <p className="text-sm text-gray-700 mt-1">{formatDateTime(contract?.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Updated At</label>
                  <p className="text-sm text-gray-700 mt-1">{formatDateTime(contract?.updated_at)}</p>
                </div>
              </div>

              {contract?.error_details && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <label className="text-sm font-medium text-red-700">Error Details</label>
                  <p className="text-red-600 text-sm mt-1">{contract.error_details}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
