"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, AlertCircle, ExternalLink } from "lucide-react"

interface Route {
  path: string
  name: string
  requiresAuth: boolean
  category: string
}

const routes: Route[] = [
  // Public Routes
  { path: "/", name: "Home", requiresAuth: false, category: "Public" },
  { path: "/en/login", name: "Login", requiresAuth: false, category: "Public" },

  // Dashboard Routes
  { path: "/en/dashboard", name: "Dashboard", requiresAuth: true, category: "Dashboard" },
  {
    path: "/en/dashboard/contracts",
    name: "Dashboard Contracts",
    requiresAuth: true,
    category: "Dashboard",
  },
  {
    path: "/en/dashboard/generate-contract",
    name: "Dashboard Generate",
    requiresAuth: true,
    category: "Dashboard",
  },
  {
    path: "/en/dashboard/settings",
    name: "Dashboard Settings",
    requiresAuth: true,
    category: "Dashboard",
  },
  {
    path: "/en/dashboard/analytics",
    name: "Dashboard Analytics",
    requiresAuth: true,
    category: "Dashboard",
  },

  // Main Routes
  { path: "/en/contracts", name: "Contracts", requiresAuth: true, category: "Main" },
  {
    path: "/en/generate-contract",
    name: "Generate Contract",
    requiresAuth: true,
    category: "Main",
  },
  { path: "/en/manage-parties", name: "Manage Parties", requiresAuth: true, category: "Main" },
  { path: "/en/manage-promoters", name: "Manage Promoters", requiresAuth: true, category: "Main" },
  { path: "/en/profile", name: "Profile", requiresAuth: true, category: "Main" },

  // Admin Routes
  { path: "/en/admin", name: "Admin Dashboard", requiresAuth: true, category: "Admin" },
  { path: "/en/admin/users", name: "Admin Users", requiresAuth: true, category: "Admin" },
  { path: "/en/admin/audit", name: "Admin Audit", requiresAuth: true, category: "Admin" },
  {
    path: "/en/admin/roles-permissions",
    name: "Admin Roles",
    requiresAuth: true,
    category: "Admin",
  },
]

export default function NavigationTester() {
  const pathname = usePathname()
  const [testedRoutes, setTestedRoutes] = useState<Record<string, "success" | "error" | "warning">>(
    {}
  )

  const categories = [...new Set(routes.map((r) => r.category))]

  const markRoute = (path: string, status: "success" | "error" | "warning") => {
    setTestedRoutes((prev) => ({ ...prev, [path]: status }))
  }

  const getStatusIcon = (path: string) => {
    const status = testedRoutes[path]
    if (!status) return null

    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusColor = (path: string) => {
    const status = testedRoutes[path]
    if (!status) return ""

    switch (status) {
      case "success":
        return "bg-green-50 border-green-200"
      case "error":
        return "bg-red-50 border-red-200"
      case "warning":
        return "bg-yellow-50 border-yellow-200"
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-h-[80vh] w-96 overflow-auto">
      <Card className="shadow-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            Navigation Tester
            <Button size="sm" variant="outline" onClick={() => setTestedRoutes({})}>
              Reset
            </Button>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Click routes to test, then mark their status
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-xs text-muted-foreground">Current: {pathname}</div>

          {categories.map((category) => (
            <div key={category} className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700">{category}</h3>
              <div className="space-y-1">
                {routes
                  .filter((route) => route.category === category)
                  .map((route) => (
                    <div
                      key={route.path}
                      className={`flex items-center gap-2 rounded-md border p-2 transition-colors ${
                        pathname === route.path
                          ? "border-blue-200 bg-blue-50"
                          : getStatusColor(route.path)
                      }`}
                    >
                      <Link
                        href={route.path}
                        target="_blank"
                        className="flex flex-1 items-center gap-1 text-sm hover:underline"
                      >
                        {route.name}
                        <ExternalLink className="h-3 w-3" />
                      </Link>

                      {route.requiresAuth && (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">Auth</span>
                      )}

                      {getStatusIcon(route.path)}

                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => markRoute(route.path, "success")}
                        >
                          ✓
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => markRoute(route.path, "warning")}
                        >
                          !
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => markRoute(route.path, "error")}
                        >
                          ✗
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}

          <div className="border-t pt-2">
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Page loads correctly</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-3 w-3 text-yellow-500" />
                <span>Page has warnings</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-3 w-3 text-red-500" />
                <span>Page has errors</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
