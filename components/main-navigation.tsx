"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"
import { ClientOnly } from "@/components/ClientOnly"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Briefcase,
  FileText,
  Users,
  UserCheck,
  LayoutDashboard,
  Shield,
  Plus,
  Bell,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from "lucide-react"

interface NavItem {
  title: string
  href: string
  description: string
  icon: React.ElementType
  requiresAuth: boolean
}

const mainNavItems: NavItem[] = [
  {
    title: "Generate Contract",
    href: "/generate-contract",
    description: "Create new contracts",
    icon: FileText,
    requiresAuth: true,
  },
  {
    title: "View Contracts",
    href: "/contracts",
    description: "View and manage existing contracts",
    icon: FileText,
    requiresAuth: true,
  },
]

const managementNavItems: NavItem[] = [
  {
    title: "Manage Parties",
    href: "/manage-parties",
    description: "Manage employers and clients",
    icon: Users,
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
    title: "Dashboard",
    href: "/dashboard",
    description: "Main dashboard with analytics",
    icon: LayoutDashboard,
    requiresAuth: true,
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    description: "View detailed analytics",
    icon: LayoutDashboard,
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
  },
  {
    title: "User Management",
    href: "/admin/users",
    description: "Manage system users",
    icon: Users,
    requiresAuth: true,
  },
]

function LoadingSkeleton() {
  return (
    <div className="h-16 bg-gray-100 animate-pulse" />
  )
}

export default function MainNavigation() {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(false)
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const isActive = (href: string) => {
    const currentLocale = pathname.split('/')[1] || 'en'
    const fullPath = `/${currentLocale}${href}`
    return pathname === fullPath || pathname.startsWith(fullPath + '/')
  }

  const getNavItemHref = (href: string) => {
    const currentLocale = pathname.split('/')[1] || 'en'
    return `/${currentLocale}${href}`
  }

  if (isLoading) {
    return <LoadingSkeleton />
  }

  return (
    <ClientOnly fallback={<div className="h-16 bg-background border-b" />}>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="mr-4 hidden md:flex">
            <Link href={getNavItemHref("/")} className="mr-6 flex items-center space-x-2">
              <Briefcase className="h-6 w-6" />
              <span className="hidden font-bold sm:inline-block">
                Contract Manager
              </span>
            </Link>
            {user && (
              <div className="flex items-center space-x-6 text-sm font-medium">
                <NavigationMenu>
                  <NavigationMenuList>
                    <NavigationMenuItem>
                      <NavigationMenuTrigger>Core Features</NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <div className="grid w-[500px] grid-cols-1 gap-3 p-4">
                          {mainNavItems
                            .filter((item) => !item.requiresAuth || user)
                            .map((item) => {
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

                    {profile?.role === "admin" && (
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
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <div className="hidden md:flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={getNavItemHref("/generate-contract")}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Contract
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={getNavItemHref("/contracts")}>
                    <FileText className="h-4 w-4 mr-2" />
                    Contracts
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={getNavItemHref("/dashboard")}>
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
              </div>
            )}

            {!user ? (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={getNavItemHref("/auth/signin")}>
                    Sign In
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href={getNavItemHref("/auth/signup")}>
                    Sign Up
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm">
                  <Bell className="h-4 w-4" />
                  <span className="sr-only">Notifications</span>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email} />
                        <AvatarFallback>
                          {user.email?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {profile?.full_name || user.email}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={getNavItemHref("/profile")}>
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={getNavItemHref("/settings")}>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    {profile?.role === "admin" && (
                      <DropdownMenuItem asChild>
                        <Link href={getNavItemHref("/admin")}>
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" className="lg:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full !max-w-lg">
                <div className="flex items-center justify-between mb-4">
                  <Link href={getNavItemHref("/")} className="flex items-center space-x-2">
                    <Briefcase className="h-6 w-6" />
                    <span className="font-bold">Contract Manager</span>
                  </Link>
                  <Button variant="ghost" className="lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
                    <X className="h-6 w-6" />
                    <span className="sr-only">Close Menu</span>
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {user ? (
                    <>
                      <Button asChild className="w-full justify-start">
                        <Link href={getNavItemHref("/dashboard")}>
                          <LayoutDashboard className="h-4 w-4 mr-2" />
                          Dashboard
                        </Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="w-full justify-start">
                            Core Features
                            <ChevronDown className="ml-auto h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-full">
                          <DropdownMenuLabel>Core Features</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {mainNavItems
                            .filter((item) => !item.requiresAuth || user)
                            .map((item) => {
                              const Icon = item.icon
                              return (
                                <DropdownMenuItem key={item.href} asChild>
                                  <Link href={getNavItemHref(item.href)} className="w-full justify-start">
                                    <div className="flex items-center gap-2">
                                      <Icon className="h-4 w-4" />
                                      <div className="text-sm font-medium">{item.title}</div>
                                    </div>
                                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                      {item.description}
                                    </p>
                                  </Link>
                                </DropdownMenuItem>
                              )
                            })}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="w-full justify-start">
                            Management
                            <ChevronDown className="ml-auto h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-full">
                          <DropdownMenuLabel>Management</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {managementNavItems.map((item) => {
                            const Icon = item.icon
                            return (
                              <DropdownMenuItem key={item.href} asChild>
                                <Link href={getNavItemHref(item.href)} className="w-full justify-start">
                                  <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4" />
                                    <div className="text-sm font-medium">{item.title}</div>
                                  </div>
                                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                    {item.description}
                                  </p>
                                </Link>
                              </DropdownMenuItem>
                            )
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="w-full justify-start">
                            Dashboard
                            <ChevronDown className="ml-auto h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-full">
                          <DropdownMenuLabel>Dashboard</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {dashboardNavItems.map((item) => {
                            const Icon = item.icon
                            return (
                              <DropdownMenuItem key={item.href} asChild>
                                <Link href={getNavItemHref(item.href)} className="w-full justify-start">
                                  <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4" />
                                    <div className="text-sm font-medium">{item.title}</div>
                                  </div>
                                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                    {item.description}
                                  </p>
                                </Link>
                              </DropdownMenuItem>
                            )
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {profile?.role === "admin" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="w-full justify-start">
                              Admin
                              <ChevronDown className="ml-auto h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-full">
                            <DropdownMenuLabel>Admin</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {adminNavItems.map((item) => {
                              const Icon = item.icon
                              return (
                                <DropdownMenuItem key={item.href} asChild>
                                  <Link href={getNavItemHref(item.href)} className="w-full justify-start">
                                    <div className="flex items-center gap-2">
                                      <Icon className="h-4 w-4" />
                                      <div className="text-sm font-medium">{item.title}</div>
                                    </div>
                                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                      {item.description}
                                    </p>
                                  </Link>
                                </DropdownMenuItem>
                              )
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </>
                  ) : (
                    <>
                      <Button asChild className="w-full justify-start">
                        <Link href={getNavItemHref("/auth/signin")}>
                          Sign In
                        </Link>
                      </Button>
                      <Button asChild className="w-full justify-start">
                        <Link href={getNavItemHref("/auth/signup")}>
                          Sign Up
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </ClientOnly>
  )
}