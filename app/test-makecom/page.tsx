// Test component for MakecomContractTemplates
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import MakecomContractTemplates from "@/components/makecom-contract-templates"

export default function TestMakecomTemplates() {
  const [showComponent, setShowComponent] = useState(false)

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Make.com Contract Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setShowComponent(!showComponent)}>
            {showComponent ? "Hide" : "Show"} Make.com Templates Component
          </Button>
          
          <div className="mt-6">
            {showComponent && <MakecomContractTemplates />}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
