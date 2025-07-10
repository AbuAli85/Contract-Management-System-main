import PromoterDataAnalyzer from '@/components/promoter-data-analyzer'

export default function PromoterAnalysisPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Promoter Data Analysis</h1>
        <p className="text-muted-foreground">
          Analyze your promoter CSV data to gain insights into document status, notification settings, and more.
        </p>
      </div>
      
      <PromoterDataAnalyzer />
    </div>
  )
}
