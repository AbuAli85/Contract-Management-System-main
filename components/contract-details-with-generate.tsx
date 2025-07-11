"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  FileText,
  Download,
  Eye,
  Calendar,
  Building2,
  User,
  MapPin,
  Briefcase,
  DollarSign,
  Hash,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { format } from "date-fns"
import { ContractGenerateButton } from "./contract-generate-button"
import Link from "next/link"

interface ContractDetailsProps {
  contract: any // Replace with your Contract type
}

export function ContractDetailsWithGenerate({ contract }: ContractDetailsProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "generated":
        return "default"
      case "draft":
        return "secondary"
      case "processing":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "generated":
        return <CheckCircle2 className="h-3 w-3" />
      case "processing":
        return <Clock className="h-3 w-3 animate-spin" />
      default:
        return <AlertCircle className="h-3 w-3" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Hash className="h-5 w-5 text-muted-foreground" />
                {contract.contract_number}
              </CardTitle>
              <CardDescription>
                Created on {format(new Date(contract.created_at), "PPP")}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusColor(contract.status)} className="gap-1">
                {getStatusIcon(contract.status)}
                {contract.status}
              </Badge>
              {contract.is_current && <Badge variant="outline">Current</Badge>}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Document Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contract Document
          </CardTitle>
          <CardDescription>Generated document and actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {contract.pdf_url ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Contract Document</p>
                    <p className="text-sm text-muted-foreground">
                      Generated on {format(new Date(contract.document_generated_at), "PPp")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={contract.pdf_url} target="_blank">
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={contract.pdf_url} download>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </a>
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <ContractGenerateButton
                  contractId={contract.id}
                  contractNumber={contract.contract_number}
                  hasDocument={true}
                  onSuccess={() => window.location.reload()}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <p className="font-medium">No document generated yet</p>
                <p className="text-sm text-muted-foreground">
                  Click the button below to generate the contract document
                </p>
              </div>
              <ContractGenerateButton
                contractId={contract.id}
                contractNumber={contract.contract_number}
                hasDocument={false}
                onSuccess={() => window.location.reload()}
                className="mx-auto"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contract Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Parties */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Contract Parties
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">First Party</p>
              <p className="font-medium">{contract.first_party?.name_en}</p>
              {contract.first_party?.crn && (
                <p className="text-sm text-muted-foreground">CRN: {contract.first_party.crn}</p>
              )}
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Second Party</p>
              <p className="font-medium">{contract.second_party?.name_en}</p>
              {contract.second_party?.crn && (
                <p className="text-sm text-muted-foreground">CRN: {contract.second_party.crn}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Promoter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Promoter Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="font-medium">{contract.promoter?.name_en}</p>
              {contract.promoter?.name_ar && (
                <p className="text-sm text-muted-foreground">{contract.promoter.name_ar}</p>
              )}
            </div>
            {contract.promoter?.id_card_number && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">ID Card Number</p>
                <p className="font-medium">{contract.promoter.id_card_number}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Duration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Contract Duration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Start Date</p>
              <p className="font-medium">{format(new Date(contract.contract_start_date), "PPP")}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">End Date</p>
              <p className="font-medium">{format(new Date(contract.contract_end_date), "PPP")}</p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Additional Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {contract.job_title && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Job Title</p>
                <p className="font-medium">{contract.job_title}</p>
              </div>
            )}
            {contract.work_location && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Work Location</p>
                <p className="flex items-center gap-1 font-medium">
                  <MapPin className="h-3 w-3" />
                  {contract.work_location}
                </p>
              </div>
            )}
            {contract.contract_value && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contract Value</p>
                <p className="flex items-center gap-1 font-medium">
                  <DollarSign className="h-3 w-3" />
                  {contract.contract_value.toLocaleString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
