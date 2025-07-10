'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, Download, Users, FileText, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { parsePromoterCSV, analyzePromoterData, downloadPromoterCSV, validatePromoterData, type PromoterCSVRow } from '@/lib/promoter-data-utils'

export default function PromoterDataAnalyzer() {
  const [csvData, setCsvData] = useState('')
  const [parsedData, setParsedData] = useState<PromoterCSVRow[]>([])
  const [analysis, setAnalysis] = useState<any>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleCSVInput = (value: string) => {
    setCsvData(value)
    setParsedData([])
    setAnalysis(null)
    setErrors([])
  }

  const analyzeData = () => {
    if (!csvData.trim()) {
      setErrors(['Please enter CSV data'])
      return
    }

    setIsAnalyzing(true)
    setErrors([])

    try {
      const parsed = parsePromoterCSV(csvData)
      setParsedData(parsed)

      if (parsed.length === 0) {
        setErrors(['No valid data found in CSV'])
        return
      }

      const validationErrors: string[] = []
      parsed.forEach((row, index) => {
        const validation = validatePromoterData(row)
        if (!validation.isValid) {
          validationErrors.push(`Row ${index + 1}: ${validation.errors.join(', ')}`)
        }
      })

      if (validationErrors.length > 0) {
        setErrors(validationErrors)
      }

      const analysisResult = analyzePromoterData(parsed)
      setAnalysis(analysisResult)

    } catch (error) {
      setErrors([`Error parsing CSV: ${error instanceof Error ? error.message : 'Unknown error'}`])
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setCsvData(content)
      }
      reader.readAsText(file)
    }
  }

  const exportAnalysis = () => {
    if (parsedData.length > 0) {
      const promoters = parsedData.map(row => ({
        id: row.id,
        name_en: row.name_en,
        name_ar: row.name_ar,
        id_card_number: row.id_card_number,
        id_card_url: row.id_card_url,
        passport_url: row.passport_url,
        employer_id: row.employer_id,
        outsourced_to_id: row.outsourced_to_id,
        job_title: row.job_title,
        work_location: row.work_location,
        status: row.status,
        contract_valid_until: row.contract_valid_until,
        id_card_expiry_date: row.id_card_expiry_date,
        passport_expiry_date: row.passport_expiry_date,
        notify_days_before_id_expiry: row.notify_days_before_id_expiry,
        notify_days_before_passport_expiry: row.notify_days_before_passport_expiry,
        notes: row.notes,
        created_at: row.created_at
      }))
      
      downloadPromoterCSV(promoters, 'promoter-analysis.csv')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Promoter Data Analyzer
          </CardTitle>
          <CardDescription>
            Upload or paste CSV data to analyze promoter information and generate insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Textarea
                placeholder="Paste your CSV data here..."
                value={csvData}
                onChange={(e) => handleCSVInput(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => document.getElementById('csv-upload')?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload CSV
              </Button>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={analyzeData} disabled={isAnalyzing || !csvData.trim()}>
              {isAnalyzing ? 'Analyzing...' : 'Analyze Data'}
            </Button>
            {parsedData.length > 0 && (
              <Button variant="outline" onClick={exportAnalysis}>
                <Download className="mr-2 h-4 w-4" />
                Export Analysis
              </Button>
            )}
          </div>

          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <Users className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{analysis.total}</p>
                  <p className="text-sm text-muted-foreground">Total Promoters</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {analysis.byStatus.active || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <FileText className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {analysis.byDocumentStatus.hasBothDocuments}
                  </p>
                  <p className="text-sm text-muted-foreground">Complete Documents</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <Clock className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {analysis.recentUpdates.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Recent Updates</p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-semibold mb-3">Status Distribution</h4>
              <div className="space-y-2">
                {Object.entries(analysis.byStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <Badge variant={status === 'active' ? 'default' : 'secondary'}>
                      {status}
                    </Badge>
                    <span className="font-medium">{count as number}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
