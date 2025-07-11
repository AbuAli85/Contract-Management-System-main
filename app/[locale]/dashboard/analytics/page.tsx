import AnalyticsPage from "@/app/dashboard/analytics/page"

export default async function LocaleAnalyticsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return <AnalyticsPage />
}