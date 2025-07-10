"use client"

import Link from "next/link"
import { LanguageSwitcher } from "@/components/language-switcher"
import { MobileNav } from "@/components/mobile-nav"

const navItems = [
  { title: "Home", href: "/" },
  { title: "Generate Contract", href: "/dashboard/generate-contract" },
  { title: "View History", href: "/contracts" },
  { title: "Manage Parties", href: "/manage-parties" },
  { title: "Manage Promoters", href: "/manage-promoters" },
]

interface ClientHeaderProps {
  locale: string
}

export function ClientHeader({ locale }: ClientHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 shadow-subtle-b backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href={`/${locale}`} className="font-heading text-2xl font-bold text-primary">
          ContractGen
        </Link>
        <nav className="hidden items-center space-x-6 text-sm font-medium md:flex">
          {navItems.map((item) => (
            <Link
              key={item.title}
              href={locale ? `/${locale}${item.href === "/" ? "" : item.href}` : item.href}
              className="text-foreground/70 underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              {item.title}
            </Link>
          ))}
        </nav>
        <div className="flex items-center space-x-3">
          <LanguageSwitcher />
          <div className="md:hidden">
            <MobileNav navItems={navItems} locale={locale} />
          </div>
        </div>
      </div>
    </header>
  )
}
