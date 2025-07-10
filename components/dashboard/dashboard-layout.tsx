"use client"

import type React from "react"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Home,
  BarChartBig,
  FileText,
  FilePlus,
  Users,
  Bell,
  ShieldCheck,
  Settings,
  LogOut,
  Moon,
  Sun,
  PanelLeft,
  Package2,
} from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  labelAr: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", labelAr: "لوحة التحكم", icon: Home },
  { href: "/dashboard/generate-contract", label: "Generate Contract", labelAr: "إنشاء عقد", icon: FilePlus },
  { href: "/contracts", label: "View Contracts", labelAr: "عرض العقود", icon: FileText },
  { href: "/dashboard/analytics", label: "Analytics", labelAr: "التحليلات", icon: BarChartBig },
  { href: "/dashboard/users", label: "Users", labelAr: "المستخدمون", icon: Users },
  { href: "/dashboard/notifications", label: "Notifications", labelAr: "الإشعارات", icon: Bell },
  { href: "/dashboard/audit", label: "Audit Logs", labelAr: "سجلات التدقيق", icon: ShieldCheck },
  { href: "/dashboard/settings", label: "Settings", labelAr: "الإعدادات", icon: Settings },
]

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [currentYear, setCurrentYear] = useState("")

  // Extract locale from pathname
  const locale = pathname && pathname.startsWith('/en/') ? 'en' : pathname && pathname.startsWith('/ar/') ? 'ar' : 'en'
  
  // Create locale-aware nav items
  const localeNavItems = navItems.map(item => ({
    ...item,
    href: `/${locale}${item.href}`
  }))

  useEffect(() => {
    setMounted(true)
    setCurrentYear(new Date().getFullYear().toString())
  }, [])

  const NavLink = ({ item, isMobile = false }: { item: NavItem; isMobile?: boolean }) => (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
        pathname === item.href ? "bg-muted text-primary" : "text-muted-foreground",
        isMobile ? "text-lg" : "text-sm",
      )}
    >
      <item.icon className="h-5 w-5" />
      {item.label} / {item.labelAr}
    </Link>
  )

  const NavLinkIconOnly = ({ item }: { item: NavItem }) => (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={item.href}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:text-foreground md:h-8 md:w-8",
              pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground",
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="sr-only">{item.label}</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">
          {item.label} / {item.labelAr}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
          <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
            <Link
              href={`/${locale}/dashboard`}
              className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
            >
              <Package2 className="h-4 w-4 transition-all group-hover:scale-110" />
              <span className="sr-only">Contract CRM</span>
            </Link>
            {localeNavItems.map((item) => (
              <NavLinkIconOnly key={item.href} item={item} />
            ))}
          </nav>
          <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mt-auto rounded-lg"
                    onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                    aria-label="Toggle theme"
                  >
                    <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Toggle Theme</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </nav>
        </aside>

        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:justify-end sm:border-0 sm:bg-transparent sm:px-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button size="icon" variant="outline" className="sm:hidden">
                  <PanelLeft className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="sm:max-w-xs">
                <nav className="grid gap-6 text-lg font-medium">
                  <Link
                    href={`/${locale}/dashboard`}
                    className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
                  >
                    <Package2 className="h-5 w-5 transition-all group-hover:scale-110" />
                    <span className="sr-only">Contract CRM</span>
                  </Link>
                  {localeNavItems.map((item) => (
                    <NavLink key={item.href} item={item} isMobile />
                  ))}
                  <Button
                    variant="ghost"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-lg text-muted-foreground transition-all hover:text-primary"
                    onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                    aria-label="Toggle theme"
                  >
                    {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                    Toggle Theme
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
            {/* Placeholder for User Dropdown / Search Bar */}
            <Button variant="outline" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Logout / تسجيل الخروج
            </Button>
          </header>
          <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8">{children}</main>
          <footer className="mt-auto border-t py-4 text-center text-sm text-muted-foreground">
            © {mounted ? currentYear : "2024"} Contract Management System. All rights reserved.
          </footer>
        </div>
      </div>
    </ThemeProvider>
  )
}
