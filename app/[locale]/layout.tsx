import "../globals.css"
import type React from "react"
import ClientLayout from "../client-layout"

export default async function LocaleLayout({ 
  children, 
  params 
}: { 
  children: React.ReactNode
  params: { locale: string }
}) {
  const resolvedParams = await params;
  return <ClientLayout params={resolvedParams}>{children}</ClientLayout>
}
