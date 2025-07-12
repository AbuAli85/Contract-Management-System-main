import { HomePageContent } from "@/components/home-page-content"
import { MainNav } from "@/components/navigation/MainNav"

interface PageProps {
  params: Promise<{ locale: string }>
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <HomePageContent locale={locale} />
    </div>
  )
}
