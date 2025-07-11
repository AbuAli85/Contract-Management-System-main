"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ContractNavigation } from "@/components/contract-navigation"
import { FileText, Plus, Sparkles } from "lucide-react"
import Link from "next/link"

export default function ContractsPage() {
  return (
    <div className="container max-w-7xl space-y-8 py-8">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Contracts</h1>
          <p className="text-muted-foreground">Manage your contracts and generate new ones</p>
        </div>

        {/* Navigation */}
        <ContractNavigation />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/generate-contract-v2">
          <Card className="cursor-pointer transition-shadow hover:shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Sparkles className="h-8 w-8 text-primary" />
                <span className="text-xs text-muted-foreground">Recommended</span>
              </div>
              <CardTitle>Generate with Template</CardTitle>
              <CardDescription>
                Use contract templates for faster generation with Make.com integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Sparkles className="mr-2 h-4 w-4" />
                Start with Template
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/generate-contract">
          <Card className="cursor-pointer transition-shadow hover:shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Classic Form</CardTitle>
              <CardDescription>
                Use the original contract generation form without templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Classic Form
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/contracts/draft">
          <Card className="cursor-pointer transition-shadow hover:shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Manage Drafts</CardTitle>
              <CardDescription>View and generate documents for draft contracts</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <FileText className="mr-2 h-4 w-4" />
                View Drafts
              </Button>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Contract List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Contracts</CardTitle>
          <CardDescription>Your recently created contracts will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Add your contract list component here */}
          <p className="py-8 text-center text-muted-foreground">
            Contract list component goes here
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
