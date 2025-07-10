"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { SummaryWidgetData } from "@/lib/dashboard-types"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface SummaryWidgetProps {
  data: SummaryWidgetData
  isLoading?: boolean
}

export default function SummaryWidget({ data, isLoading = false }: SummaryWidgetProps) {
  const Icon = data.icon
  return (
    <Card className="shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        {isLoading ? (
          <Skeleton className="h-4 w-3/4" />
        ) : (
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {data.title} / {data.titleAr}
          </CardTitle>
        )}
        {isLoading ? (
          <Skeleton className="h-5 w-5 rounded-full" />
        ) : (
          <Icon className={cn("h-5 w-5", data.color || "text-muted-foreground")} />
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="mb-1 h-8 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </>
        ) : (
          <>
            <div className="text-3xl font-bold">{data.value}</div>
            {data.comparison && (
              <p
                className={cn(
                  "text-xs",
                  data.color ? data.color.replace("text-", "text-") : "text-muted-foreground",
                )}
              >
                {data.comparison}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
