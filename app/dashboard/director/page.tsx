import { redirect } from "next/navigation"

export default function DirectorPage() {
  redirect("/en/dashboard/director") // Change 'en' to your default locale if needed
  return null
}
