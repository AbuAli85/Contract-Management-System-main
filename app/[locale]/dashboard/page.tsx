import DashboardContent from "@/components/dashboard/dashboard-content"

export default async function LocaleDashboardPage({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}) {
  const { locale } = await params
  
  return <DashboardContent locale={locale} />
} 