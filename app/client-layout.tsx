import type React from "react"
import { Inter, Lexend } from "next/font/google" // Lexend as display font
import { Suspense } from "react"
import Loading from "./loading"
import { ClientProviders } from "@/components/client-providers"
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
  locale,
}: {
  children: React.ReactNode
  locale: string
}) {
  const dir = locale === "ar" ? "rtl" : "ltr"

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        {/* Include font links if not handled by next/font automatically for all weights */}
      </head>
      <body
        suppressHydrationWarning={true}
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontInter.variable,
          fontLexend.variable
        )}
      >
        <ClientProviders>
          {/* Remove ClientHeader to avoid duplicate nav bar, since MainNav is now in RootLayout */}
          <Suspense fallback={<Loading />}>{children}</Suspense>
          <ClientFooter />
        </ClientProviders>
      </body>
    </html>
  )
}
