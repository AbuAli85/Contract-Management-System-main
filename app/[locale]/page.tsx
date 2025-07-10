import { HomePageContent } from "@/components/home-page-content"

export default function HomePage({ params }: { params: { locale: string } }) {
  return <HomePageContent locale={params.locale} />
}
