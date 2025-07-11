"use client"

import { AuthTest } from "@/components/debug/AuthTest"
import { AuthStatus } from "@/components/auth/AuthStatus"

export default function DebugAuthPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Authentication Debug</h1>
          <p className="text-muted-foreground mt-2">
            Use this page to debug authentication issues and verify your login status.
          </p>
        </div>
        
        {/* Quick Status Check */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Quick Status Check</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AuthStatus showDetails={true} />
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Quick Fixes</h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <button 
                    onClick={() => window.location.reload()}
                    className="block w-full text-left p-2 hover:bg-blue-100 rounded"
                  >
                    1. Refresh the page
                  </button>
                  <button 
                    onClick={() => {
                      localStorage.clear()
                      sessionStorage.clear()
                      window.location.reload()
                    }}
                    className="block w-full text-left p-2 hover:bg-blue-100 rounded"
                  >
                    2. Clear storage and refresh
                  </button>
                  <button 
                    onClick={() => window.location.href = '/login'}
                    className="block w-full text-left p-2 hover:bg-blue-100 rounded"
                  >
                    3. Go to login page
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Detailed Debug Information */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Detailed Debug Information</h2>
          <AuthTest />
        </div>
      </div>
    </div>
  )
}