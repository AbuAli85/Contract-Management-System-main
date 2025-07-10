"use client"

import { redirect } from "next/navigation"

export default function AdminUsersPage() {
  redirect("/en/dashboard/director") // Change 'en' to your default locale if needed
  return null
}
