import type React from "react"
import { Suspense } from "react"
import Loading from "./loading"
import { ClientFooter } from "@/components/client-footer"

export default function ClientLayout({
  children,
  locale,
}: {
  children: React.ReactNode
  locale: string
}) {
  return (
    <>
      <Suspense fallback={<Loading />}>{children}</Suspense>
      <ClientFooter />
    </>
  )
}