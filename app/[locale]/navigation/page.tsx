import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Home,
  LogIn,
  LayoutDashboard,
  FileText,
  Users,
  UserCheck,
  User,
  Settings,
  Shield,
  TestTube,
} from "lucide-react"

interface RouteGroup {
  title: string
  description: string
  routes: {
    path: string
    name: string
    icon: any
    description: string
    requiresAuth: boolean
  }[]
}

export default async function NavigationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  const routeGroups: RouteGroup[] = [
    {
      title: "Public Pages",
      description: "Pages accessible without authentication",
      routes: [
        {
          path: `/${locale}`,
          name: "Home",
          icon: Home,
          description: "Landing page",
          requiresAuth: false,
        },
        {
          path: `/${locale}/login`,
          name: "Login",
          icon: LogIn,
          description: "Sign in or create account",
          requiresAuth: false,
        },
        {
          path: `/${locale}/test-navigation`,
          name: "Test Navigation",
          icon: TestTube,
          description: "Navigation testing tool",
          requiresAuth: false,
        },
      ],
    },
    {
      title: "Main Features",
      description: "Core application features (requires authentication)",
      routes: [
        {
          path: `/${locale}/dashboard`,
          name: "Dashboard",
          icon: LayoutDashboard,
          description: "Main dashboard with analytics",
          requiresAuth: true,
        },
        {
          path: `/${locale}/contracts`,
          name: "Contracts",
          icon: FileText,
          description: "View and manage contracts",
          requiresAuth: true,
        },
        {
          path: `/${locale}/generate-contract`,
          name: "Generate Contract",
          icon: FileText,
          description: "Create new contracts",
          requiresAuth: true,
        },
        {
          path: `/${locale}/manage-parties`,
          name: "Manage Parties",
          icon: Users,
          description: "Manage employers and clients",
          requiresAuth: true,
        },
        {
          path: `/${locale}/manage-promoters`,
          name: "Manage Promoters",
          icon: UserCheck,
          description: "Manage contract promoters",
          requiresAuth: true,
        },
        {
          path: `/${locale}/profile`,
          name: "Profile",
          icon: User,
          description: "User profile and settings",
          requiresAuth: true,
        },
      ],
    },
    {
      title: "Dashboard Pages",
      description: "Dashboard sub-pages",
      routes: [
        {
          path: `/${locale}/dashboard/contracts`,
          name: "Dashboard Contracts",
          icon: FileText,
          description: "Contract management in dashboard",
          requiresAuth: true,
        },
        {
          path: `/${locale}/dashboard/generate-contract`,
          name: "Dashboard Generate",
          icon: FileText,
          description: "Generate contracts from dashboard",
          requiresAuth: true,
        },
        {
          path: `/${locale}/dashboard/settings`,
          name: "Dashboard Settings",
          icon: Settings,
          description: "Dashboard configuration",
          requiresAuth: true,
        },
        {
          path: `/${locale}/dashboard/analytics`,
          name: "Dashboard Analytics",
          icon: LayoutDashboard,
          description: "Analytics and insights",
          requiresAuth: true,
        },
      ],
    },
    {
      title: "Admin Pages",
      description: "Administrative features (requires admin role)",
      routes: [
        {
          path: `/${locale}/admin`,
          name: "Admin Dashboard",
          icon: Shield,
          description: "Admin overview",
          requiresAuth: true,
        },
        {
          path: `/${locale}/admin/users`,
          name: "Admin Users",
          icon: Users,
          description: "User management",
          requiresAuth: true,
        },
        {
          path: `/${locale}/admin/audit`,
          name: "Admin Audit",
          icon: Shield,
          description: "Audit logs",
          requiresAuth: true,
        },
        {
          path: `/${locale}/admin/roles-permissions`,
          name: "Admin Roles",
          icon: Shield,
          description: "Roles and permissions",
          requiresAuth: true,
        },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900">Application Navigation</h1>
          <p className="text-lg text-gray-600">
            All available routes in the Contract Management System
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild variant="outline">
              <Link href={`/${locale}/test-navigation`}>
                <TestTube className="mr-2 h-4 w-4" />
                Open Navigation Tester
              </Link>
            </Button>
          </div>
        </div>

        {routeGroups.map((group, groupIndex) => (
          <Card key={groupIndex} className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">{group.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{group.description}</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {group.routes.map((route, routeIndex) => {
                  const Icon = route.icon
                  return (
                    <Link
                      key={routeIndex}
                      href={route.path}
                      className="group flex items-start gap-4 rounded-lg border border-gray-200 p-4 transition-all hover:border-blue-300 hover:bg-blue-50"
                    >
                      <div className="rounded-lg bg-gray-100 p-2 group-hover:bg-blue-100">
                        <Icon className="h-5 w-5 text-gray-600 group-hover:text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                          {route.name}
                        </h3>
                        <p className="text-sm text-gray-600">{route.description}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <code className="rounded bg-gray-100 px-2 py-0.5 text-xs">
                            {route.path}
                          </code>
                          {route.requiresAuth && (
                            <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">
                              Auth Required
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg">Testing Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>• Click any route above to navigate to that page</p>
            <p>• Pages marked "Auth Required" will redirect to login if you're not authenticated</p>
            <p>• Use the Navigation Tester for systematic testing with error tracking</p>
            <p>• Check the browser console (F12) for any errors</p>
            <p>• Test both authenticated and non-authenticated states</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
