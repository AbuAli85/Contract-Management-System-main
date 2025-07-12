"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  FileText,
  Users,
  UserCheck,
  BarChart3,
  Settings,
  LogOut,
  LogIn,
  User,
  Plus,
  Home,
  Menu,
  Shield,
  Building,
  CreditCard,
  Bell,
  HelpCircle,
  Search,
  LayoutDashboard,
} from "lucide-react"
import { ClientOnly } from "@/components/ClientOnly"
import { cn } from "@/lib/utils"

interface NavItem {
  title: string
  href: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  requiresAuth?: boolean
  requiresAdmin?: boolean
}

const publicNavItems: NavItem[] = [
  {
    title: "Home",
    href: "/",
    description: "Welcome to Contract Management System",
    icon: Home,
    requiresAuth: false,
  },
  {
    title: "Features",
    href: "/features",
    description: "Explore our powerful features",
    icon: BarChart3,
    requiresAuth: false,
  },
]

const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    description: "Overview of your contracts and activities",
    icon: LayoutDashboard,
    requiresAuth: true,
  },
  {
    title: "Contracts",
    href: "/contracts",
    description: "View and manage all contracts",
    icon: FileText,
    requiresAuth: true,
  },
  {
    title: "Generate Contract",
    href: "/generate-contract",
    description: "Create new contracts quickly",
    icon: Plus,
    requiresAuth: true,
  },
]

const managementNavItems: NavItem[] = [
  {
    title: "Manage Parties",
    href: "/manage-parties",
    description: "Manage clients and employers",
    icon: Building,
    requiresAuth: true,
  },
  {
    title: "Manage Promoters",
    href: "/manage-promoters",
    description: "Manage contract promoters",
    icon: UserCheck,
    requiresAuth: true,
  },
]

const dashboardNavItems: NavItem[] = [
  {
    title: "Dashboard Analytics",
    href: "/dashboard/analytics",
    description: "Detailed analytics and insights",
    icon: BarChart3,
    requiresAuth: true,
  },
  {
    title: "Dashboard Settings",
    href: "/dashboard/settings",
    description: "Configure your dashboard",
    icon: Settings,
    requiresAuth: true,
  },
]

const adminNavItems: NavItem[] = [
  {
    title: "Admin Dashboard",
    href: "/admin",
    description: "Administrative overview",
    icon: Shield,
    requiresAuth: true,
    requiresAdmin: true,
  },
  {
    title: "User Management",
    href: "/admin/users",
    description: "Manage system users",
    icon: Users,
    requiresAuth: true,
    requiresAdmin: true,
  },
  {
    title: "Audit Logs",
    href: "/admin/audit",
    description: "View system audit logs",
    icon: FileText,
    requiresAuth: true,
    requiresAdmin: true,
  },
  {
    title: "Roles & Permissions",
    href: "/admin/roles-permissions",
    description: "Configure user roles and permissions",
    icon: Shield,
    requiresAuth: true,
    requiresAdmin: true,
  },
]

export function EnhancedMainNav() {
  const { user, profile, signOut, isHydrated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  const getLocaleFromPath = () => {
    const segments = pathname.split("/")
    return segments[1] || "en"
  }

  const locale = getLocaleFromPath()

  const getNavItemHref = (href: string) => {
    return href.startsWith("/") ? `/${locale}${href}` : href
  }

  const isActive = (href: string) => {
    const fullHref = getNavItemHref(href)
    return pathname === fullHref || (href !== "/" && pathname.startsWith(fullHref))
  }

  const isAdmin = profile?.role === "admin"
  const isPremium = profile?.is_premium

  if (!isHydrated) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 animate-pulse rounded bg-gray-200"></div>
            <div className="h-4 w-32 animate-pulse rounded bg-gray-200"></div>
          </div>
          <div className="h-8 w-24 animate-pulse rounded bg-gray-200"></div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-4">
          <Link href={getNavItemHref("/")} className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <FileText className="h-4 w-4" />
            </div>
            <span className="hidden font-bold sm:inline-block">Contract Management</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex">
            <NavigationMenu>
              <NavigationMenuList>
                {/* Main Features */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Core Features</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[600px] grid-cols-2 gap-3 p-4">
                      {mainNavItems.map((item) => {
                        const Icon = item.icon
                        return (
                          <NavigationMenuLink
                            key={item.href}
                            asChild
                            className={cn(
                              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                              isActive(item.href) && "bg-accent text-accent-foreground"
                            )}
                          >
                            <Link href={getNavItemHref(item.href)}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <div className="text-sm font-medium">{item.title}</div>
                              </div>
                              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                {item.description}
                              </p>
                            </Link>
                          </NavigationMenuLink>
                        )
                      })}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Management */}
                {user && (
                  <NavigationMenuItem>
                    <NavigationMenuTrigger>Management</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="grid w-[500px] grid-cols-1 gap-3 p-4">
                        {managementNavItems.map((item) => {
                          const Icon = item.icon
                          return (
                            <NavigationMenuLink
                              key={item.href}
                              asChild
                              className={cn(
                                "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                                isActive(item.href) && "bg-accent text-accent-foreground"
                              )}
                            >
                              <Link href={getNavItemHref(item.href)}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  <div className="text-sm font-medium">{item.title}</div>
                                </div>
                                <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                  {item.description}
                                </p>
                              </Link>
                            </NavigationMenuLink>
                          )
                        })}
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                )}

                {/* Dashboard */}
                {user && (
                  <NavigationMenuItem>
                    <NavigationMenuTrigger>Dashboard</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="grid w-[500px] grid-cols-1 gap-3 p-4">
                        {dashboardNavItems.map((item) => {
                          const Icon = item.icon
                          return (
                            <NavigationMenuLink
                              key={item.href}
                              asChild
                              className={cn(
                                "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                                isActive(item.href) && "bg-accent text-accent-foreground"
                              )}
                            >
                              <Link href={getNavItemHref(item.href)}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  <div className="text-sm font-medium">{item.title}</div>
                                </div>
                                <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                  {item.description}
                                </p>
                              </Link>
                            </NavigationMenuLink>
                          )
                        })}
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                )}

                {/* Admin */}
                {isAdmin && (
                  <NavigationMenuItem>
                    <NavigationMenuTrigger>Admin</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="grid w-[500px] grid-cols-1 gap-3 p-4">
                        {adminNavItems.map((item) => {
                          const Icon = item.icon
                          return (
                            <NavigationMenuLink
                              key={item.href}
                              asChild
                              className={cn(
                                "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                                isActive(item.href) && "bg-accent text-accent-foreground"
                              )}
                            >
                              <Link href={getNavItemHref(item.href)}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  <div className="text-sm font-medium">{item.title}</div>
                                </div>
                                <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                  {item.description}
                                </p>
                              </Link>
                            </NavigationMenuLink>
                          )
                        })}
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                )}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          {/* Quick Actions */}
          {user && (
            <div className="hidden items-center space-x-2 md:flex">
              <Button asChild variant="ghost" size="sm">
                <Link href={getNavItemHref("/contracts")}>
                  <FileText className="mr-2 h-4 w-4" />
                  Contracts
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href={getNavItemHref("/generate-contract")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Generate
                </Link>
              </Button>
            </div>
          )}

          {/* User Menu */}
          <ClientOnly>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    <User className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">{user.email}</span>
                    {(isAdmin || isPremium) && (
                      <div className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-primary"></div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm">
                    <div className="font-medium">{user.email}</div>
                    <div className="mt-1 flex gap-1">
                      {isAdmin && (
                        <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-800">
                          Admin
                        </span>
                      )}
                      {isPremium && (
                        <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">
                          Premium
                        </span>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={getNavItemHref("/profile")}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={getNavItemHref("/dashboard/settings")}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={getNavItemHref("/admin")}>
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild size="sm">
                <Link href={getNavItemHref("/login")}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Link>
              </Button>
            )}
          </ClientOnly>

          {/* Mobile Menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="mt-8 flex flex-col space-y-4">
                <div className="text-lg font-semibold">Navigation</div>

                {/* Public Items */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Public</div>
                  {publicNavItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={getNavItemHref(item.href)}
                        className={cn(
                          "flex items-center gap-2 rounded-md p-2 text-sm hover:bg-accent",
                          isActive(item.href) && "bg-accent text-accent-foreground"
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Icon className="h-4 w-4" />
                        {item.title}
                      </Link>
                    )
                  })}
                </div>

                {user && (
                  <>
                    {/* Main Features */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Core Features</div>
                      {mainNavItems.map((item) => {
                        const Icon = item.icon
                        return (
                          <Link
                            key={item.href}
                            href={getNavItemHref(item.href)}
                            className={cn(
                              "flex items-center gap-2 rounded-md p-2 text-sm hover:bg-accent",
                              isActive(item.href) && "bg-accent text-accent-foreground"
                            )}
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <Icon className="h-4 w-4" />
                            {item.title}
                          </Link>
                        )
                      })}
                    </div>

                    {/* Management */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Management</div>
                      {managementNavItems.map((item) => {
                        const Icon = item.icon
                        return (
                          <Link
                            key={item.href}
                            href={getNavItemHref(item.href)}
                            className={cn(
                              "flex items-center gap-2 rounded-md p-2 text-sm hover:bg-accent",
                              isActive(item.href) && "bg-accent text-accent-foreground"
                            )}
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <Icon className="h-4 w-4" />
                            {item.title}
                          </Link>
                        )
                      })}
                    </div>

                    {/* Dashboard */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Dashboard</div>
                      {dashboardNavItems.map((item) => {
                        const Icon = item.icon
                        return (
                          <Link
                            key={item.href}
                            href={getNavItemHref(item.href)}
                            className={cn(
                              "flex items-center gap-2 rounded-md p-2 text-sm hover:bg-accent",
                              isActive(item.href) && "bg-accent text-accent-foreground"
                            )}
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <Icon className="h-4 w-4" />
                            {item.title}
                          </Link>
                        )
                      })}
                    </div>

                    {/* Admin */}
                    {isAdmin && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">Admin</div>
                        {adminNavItems.map((item) => {
                          const Icon = item.icon
                          return (
                            <Link
                              key={item.href}
                              href={getNavItemHref(item.href)}
                              className={cn(
                                "flex items-center gap-2 rounded-md p-2 text-sm hover:bg-accent",
                                isActive(item.href) && "bg-accent text-accent-foreground"
                              )}
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <Icon className="h-4 w-4" />
                              {item.title}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
