import type React from "react"
import { Inter, Lexend } from "next/font/google" // Lexend as display font
import { Suspense } from "react"
import Loading from "./loading"
import { ClientProviders } from "@/components/client-providers"
import { ClientHeader } from "@/components/client-header"
import { ClientFooter } from "@/components/client-footer"
import { cn } from "@/lib/utils"

const fontInter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const fontLexend = Lexend({
  // Example display font
  subsets: ["latin"],
  variable: "--font-lexend",
  weight: ["400", "500", "600", "700"],
})

export default function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const { locale } = params
  const dir = locale === "ar" ? "rtl" : "ltr"

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        {/* Include font links if not handled by next/font automatically for all weights */}
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontInter.variable,
          fontLexend.variable
        )}
      >
        <ClientProviders>
          <ClientHeader locale={locale} />
          <Suspense fallback={<Loading />}>{children}</Suspense>
          <ClientFooter />
        </ClientProviders>
      </body>
    </html>
  )
}
