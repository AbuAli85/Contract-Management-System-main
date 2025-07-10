"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { Promoter } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeftIcon, Loader2, Save } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function EditPromoterPage() {
  const params = useParams()
  const router = useRouter()
  const promoterId = params?.id as string

  const [promoter, setPromoter] = useState<Promoter | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!promoterId) return

    async function fetchPromoter() {
      setIsLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from("promoters")
        .select("*")
        .eq("id", promoterId)
        .single()

      if (error || !data) {
        setError(error?.message || "Promoter not found.")
        setIsLoading(false)
        return
      }

      setPromoter(data)
      setIsLoading(false)
    }

    fetchPromoter()
  }, [promoterId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!promoter) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from("promoters")
        .update(promoter)
        .eq("id", promoterId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Promoter updated successfully",
      })

      router.push(`/manage-promoters/${promoterId}`)
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update promoter",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading promoter...</span>
      </div>
    )
  }

  if (error || !promoter) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Promoter not found"}</p>
          <Button onClick={() => router.push("/manage-promoters")}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Promoters
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 dark:bg-slate-950 sm:py-12 md:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/manage-promoters/${promoterId}`)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Promoter Details
          </Button>
          <h1 className="mt-2 text-3xl font-bold text-slate-800 dark:text-slate-100">
            Edit Promoter
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Edit Promoter Information</CardTitle>
            <CardDescription>
              Update the promoter's details and information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name_en">Name (English)</Label>
                  <Input
                    id="name_en"
                    value={promoter.name_en || ""}
                    onChange={(e) =>
                      setPromoter({ ...promoter, name_en: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name_ar">Name (Arabic)</Label>
                  <Input
                    id="name_ar"
                    value={promoter.name_ar || ""}
                    onChange={(e) =>
                      setPromoter({ ...promoter, name_ar: e.target.value })
                    }
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={promoter.email || ""}
                    onChange={(e) =>
                      setPromoter({ ...promoter, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={promoter.phone || ""}
                    onChange={(e) =>
                      setPromoter({ ...promoter, phone: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="national_id">National ID</Label>
                  <Input
                    id="national_id"
                    value={promoter.national_id || ""}
                    onChange={(e) =>
                      setPromoter({ ...promoter, national_id: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="crn">CRN</Label>
                  <Input
                    id="crn"
                    value={promoter.crn || ""}
                    onChange={(e) =>
                      setPromoter({ ...promoter, crn: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="id_card_expiry_date">ID Card Expiry Date</Label>
                  <Input
                    id="id_card_expiry_date"
                    type="date"
                    value={promoter.id_card_expiry_date || ""}
                    onChange={(e) =>
                      setPromoter({ ...promoter, id_card_expiry_date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passport_expiry_date">Passport Expiry Date</Label>
                  <Input
                    id="passport_expiry_date"
                    type="date"
                    value={promoter.passport_expiry_date || ""}
                    onChange={(e) =>
                      setPromoter({ ...promoter, passport_expiry_date: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={promoter.address || ""}
                  onChange={(e) =>
                    setPromoter({ ...promoter, address: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/manage-promoters/${promoterId}`)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}