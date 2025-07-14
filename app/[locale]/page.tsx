"use client"

import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"

interface PageProps {
  params: { locale: string }
}

export default function Page() {
  const params = useParams()
  const locale = params.locale as string
  const t = useTranslations('Common')

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center p-4 text-center">
      <h1 className="mb-4 text-4xl font-bold">Welcome to Contract Management</h1>
      <p className="mb-8 text-lg text-muted-foreground">
        Manage your contracts efficiently with our bilingual platform
      </p>
      <div className="flex gap-4">
        <Button asChild>
          <Link href={`/${locale}/dashboard`}>
            Go to Dashboard
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/${locale}/navigation`}>
            View All Routes
          </Link>
        </Button>
      </div>
    </div>
  )
}