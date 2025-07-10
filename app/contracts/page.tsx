import ContractsTable from '@/components/contracts/ContractsTable'

export default function ContractsPage() {
  return (
    <div className="container mx-auto py-6">
      <ContractsTable />
    </div>
  )
}

// Required exports to fix Next.js build error
export const metadata = {
  title: 'Contracts Management',
  description: 'Manage contracts with updated party roles: Party A = Client, Party B = Employer'
}

export const dynamic = 'force-dynamic'
export const revalidate = 0