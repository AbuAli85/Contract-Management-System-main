"use client"

import { redirect } from "next/navigation"

export default function AdminUsersPage() {
  redirect("/dashboard/director")
  return null
}
