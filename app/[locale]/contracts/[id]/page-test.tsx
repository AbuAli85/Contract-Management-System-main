"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"

export default function ContractDetailPage() {
  const params = useParams()
  const contractId = params?.id as string
  const locale = params?.locale as string
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log("Contract ID:", contractId)
    console.log("Locale:", locale)
    setLoading(false)
  }, [contractId, locale])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            border: '2px solid #e5e7eb', 
            borderTop: '2px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <h3>Loading Contract Details...</h3>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', padding: '32px' }}>
        <div style={{ maxWidth: '768px', margin: '0 auto' }}>
          <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '24px' }}>
            <h3 style={{ color: '#dc2626', marginBottom: '16px' }}>Error Loading Contract</h3>
            <p style={{ color: '#dc2626', marginBottom: '24px' }}>{error}</p>
            <button 
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', padding: '32px', backgroundColor: '#f8fafc' }}>
      <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px' }}>Contract Details</h1>
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '14px' }}>
              <div>
                <label style={{ fontWeight: '500', color: '#6b7280' }}>Contract ID</label>
                <div style={{ marginTop: '4px' }}>
                  <code style={{ backgroundColor: '#f3f4f6', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace' }}>
                    {contractId}
                  </code>
                </div>
              </div>
              <div>
                <label style={{ fontWeight: '500', color: '#6b7280' }}>Locale</label>
                <p style={{ marginTop: '4px' }}>{locale}</p>
              </div>
              <div>
                <label style={{ fontWeight: '500', color: '#6b7280' }}>Status</label>
                <p style={{ marginTop: '4px' }}>✅ Page loaded successfully!</p>
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Simple Contract View</h2>
          <p style={{ color: '#6b7280', marginBottom: '16px' }}>
            This is a simplified version of the contract detail page to test if the basic routing and params work correctly.
          </p>
          <div style={{ padding: '16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
            <p style={{ color: '#166534' }}>
              ✅ The page is rendering correctly without hydration errors.
            </p>
          </div>
          <div style={{ marginTop: '24px' }}>
            <button 
              onClick={() => window.history.back()}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                marginRight: '12px'
              }}
            >
              ← Back
            </button>
            <button 
              onClick={() => setError('This is a test error')}
              style={{
                backgroundColor: '#dc2626',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Test Error
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
