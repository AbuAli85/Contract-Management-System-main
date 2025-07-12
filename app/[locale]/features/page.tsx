import { EnhancedMainNav } from "@/components/navigation/EnhancedMainNav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  FileText,
  Users,
  UserCheck,
  BarChart3,
  Settings,
  Shield,
  Building,
  Plus,
  CheckCircle,
  Star,
  Zap,
  Globe,
  Lock,
  Clock,
} from "lucide-react"

interface PageProps {
  params: Promise<{ locale: string }>
}

const features = [
  {
    title: "Contract Management",
    description: "Create, manage, and track all your contracts in one place",
    icon: FileText,
    href: "/contracts",
    color: "bg-blue-500",
  },
  {
    title: "Party Management",
    description: "Manage clients, employers, and business partners efficiently",
    icon: Building,
    href: "/manage-parties",
    color: "bg-green-500",
  },
  {
    title: "Promoter Management",
    description: "Track and manage contract promoters and their documents",
    icon: UserCheck,
    href: "/manage-promoters",
    color: "bg-purple-500",
  },
  {
    title: "Analytics & Insights",
    description: "Get detailed insights into your contract performance",
    icon: BarChart3,
    href: "/dashboard/analytics",
    color: "bg-orange-500",
  },
  {
    title: "Admin Tools",
    description: "Comprehensive administrative tools for system management",
    icon: Shield,
    href: "/admin",
    color: "bg-red-500",
  },
  {
    title: "User Management",
    description: "Manage users, roles, and permissions across your organization",
    icon: Users,
    href: "/admin/users",
    color: "bg-indigo-500",
  },
]

const benefits = [
  {
    title: "Time Saving",
    description: "Reduce contract creation time by up to 80%",
    icon: Clock,
  },
  {
    title: "Secure & Compliant",
    description: "Enterprise-grade security with full audit trails",
    icon: Lock,
  },
  {
    title: "Multi-language Support",
    description: "Native support for English and Arabic",
    icon: Globe,
  },
  {
    title: "Real-time Updates",
    description: "Live synchronization across all your devices",
    icon: Zap,
  },
  {
    title: "Premium Features",
    description: "Advanced analytics and bulk operations",
    icon: Star,
  },
  {
    title: "Quality Assurance",
    description: "Built-in validation and error checking",
    icon: CheckCircle,
  },
]

export default async function FeaturesPage({ params }: PageProps) {
  const { locale } = await params

  return (
    <div className="min-h-screen bg-background">
      <EnhancedMainNav />

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">Powerful Contract Management Features</h1>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
            Discover all the tools and features that make contract management effortless
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg">
              <Link href={`/${locale}/generate-contract`}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Contract
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={`/${locale}/dashboard`}>
                <BarChart3 className="mr-2 h-4 w-4" />
                View Dashboard
              </Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="mb-8 text-center text-3xl font-bold">Core Features</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <div
                      className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${feature.color} mb-4`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/${locale}${feature.href}`}>Explore Feature</Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-16">
          <h2 className="mb-8 text-center text-3xl font-bold">Why Choose Our System</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <div
                  key={index}
                  className="flex items-start space-x-4 rounded-lg border bg-card p-6"
                >
                  <div className="flex-shrink-0">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="mb-2 text-lg font-semibold">{benefit.title}</h3>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA Section */}
        <div className="rounded-lg bg-primary/5 p-8 text-center">
          <h2 className="mb-4 text-3xl font-bold">Ready to Get Started?</h2>
          <p className="mb-6 text-lg text-muted-foreground">
            Join thousands of users who trust our contract management system
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg">
              <Link href={`/${locale}/auth/signin`}>Get Started Today</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={`/${locale}/test-navigation`}>View All Pages</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
