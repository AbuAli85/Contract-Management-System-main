import { HomePageContent } from "@/components/home-page-content"

interface ContractPageProps {
  params: Promise<{ locale: string; id: string }>
}

export default async function ContractPage({ params }: ContractPageProps) {
  const { locale, id } = await params

  return (
    <div>
      <HomePageContent locale={locale} />
      {/* Component content */}
    </div>
  )
}
