"use client"
import { useEffect, useState } from "react"
import PartyForm from "@/components/party-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import type { Party } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EditIcon, PlusCircleIcon, ArrowLeftIcon, BuildingIcon, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ManagePartiesPage() {
  const [parties, setParties] = useState<Party[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedParty, setSelectedParty] = useState<Party | null>(null)
  const [showForm, setShowForm] = useState(false)
  const { toast } = useToast()

  async function fetchParties() {
    setIsLoading(true)
    const { data, error } = await supabase.from("parties").select("*").order("name_en")
    if (error) {
      toast({ title: "Error fetching parties", description: error.message, variant: "destructive" })
      setParties([])
    } else {
      setParties(data || [])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchParties()
  }, [])

  const handleEdit = (party: Party) => {
    setSelectedParty(party)
    setShowForm(true)
  }

  const handleAddNew = () => {
    setSelectedParty(null)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setSelectedParty(null)
    fetchParties() // Refresh the list after form submission
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-lg">Loading parties...</p>
      </div>
    )
  }

  if (showForm) {
    return (
      <div className="min-h-screen bg-background px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-2xl">
          <Button variant="outline" onClick={handleFormClose} className="mb-4">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Party List
          </Button>
          <PartyForm partyToEdit={selectedParty} onFormSubmit={handleFormClose} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Manage Parties</h1>
          <Button onClick={handleAddNew}>
            <PlusCircleIcon className="mr-2 h-5 w-5" />
            Add New Party
          </Button>
        </div>

        {parties.length === 0 ? (
          <Card className="py-10 text-center">
            <CardHeader>
              <BuildingIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <CardTitle>No Parties Found</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Get started by adding your first party. Click the "Add New Party" button.
              </CardDescription>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Party List</CardTitle>
              <CardDescription>View, add, or edit party details.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name (EN)</TableHead>
                    <TableHead>Name (AR)</TableHead>
                    <TableHead>CRN</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parties.map((party) => (
                    <TableRow key={party.id}>
                      <TableCell>{party.name_en}</TableCell>
                      <TableCell>{party.name_ar}</TableCell>
                      <TableCell>{party.crn}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(party)}>
                          <EditIcon className="mr-1 h-4 w-4" /> Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
        <div className="mt-8 text-center">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
