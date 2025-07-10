import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { redirect } from "next/navigation"

export default function PromoterIdLoading() {
  // Redirect to the default locale version if accessed directly without locale
  redirect("/en/manage-promoters")
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-6">
        <Skeleton className="h-9 w-80" />
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-7 w-60" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
