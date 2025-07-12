import { HomePageContent } from "@/components/home-page-content"
import { EnhancedMainNav } from "@/components/navigation/EnhancedMainNav"

interface PageProps {
  params: Promise<{ locale: string }>
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params

  return (
    <div className="min-h-screen bg-background">
      <EnhancedMainNav />
      <HomePageContent locale={locale} />
    </div>
  )
}
