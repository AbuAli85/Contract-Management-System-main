import { getTranslations } from "next-intl/server"
import { notFound, redirect } from "next/navigation"
import Image from "next/image"

import { getPromoterById } from "@/app/actions/promoters"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Edit } from "lucide-react"
import { Promoter } from "@/lib/types"

interface PromoterDetailsPageProps {
  params: {
    id: string
  }
}

export default async function PromoterDetailsPage({ params }: PromoterDetailsPageProps) {
  // Redirect to the default locale version if accessed directly without locale
  // redirect("/en/manage-promoters")

  const t = await getTranslations("PromoterDetailsPage")
  const promoter: Promoter | null = await getPromoterById(params.id)

  if (!promoter) {
    notFound()
    return null // Ensure the function exits here
  }

  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      <Card>
        <CardHeader className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div className="flex items-center space-x-4">
            {promoter.profile_picture_url ? (
              <Image
                src={promoter.profile_picture_url}
                alt={promoter.name_en || "Promoter"}
                width={80}
                height={80}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-2xl font-bold text-muted-foreground">
                {promoter.name_en?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold">{promoter.name_en}</CardTitle>
              <CardDescription>{promoter.company || "N/A"}</CardDescription>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href={`/manage-promoters/${promoter.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              {t("editProfile")}
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-lg font-semibold">{t("contactInformation")}</h3>
              <p>
                <span className="font-medium">{t("email")}:</span> {promoter.email || "N/A"}
              </p>
              <p>
                <span className="font-medium">{t("phone")}:</span> {promoter.phone || "N/A"}
              </p>
              <p>
                <span className="font-medium">{t("website")}:</span>{" "}
                {promoter.website ? (
                  <a
                    href={promoter.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    {promoter.website}
                  </a>
                ) : (
                  "N/A"
                )}
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold">{t("companyAddress")}</h3>
              <p>{promoter.address || "N/A"}</p>
              <p>
                {promoter.city && `${promoter.city}, `}
                {promoter.state && `${promoter.state} `}
                {promoter.zip_code}
              </p>
              <p>{promoter.country || "N/A"}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="mb-2 text-lg font-semibold">{t("aboutPromoter")}</h3>
            <p className="text-muted-foreground">{promoter.bio || t("noBioAvailable")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
