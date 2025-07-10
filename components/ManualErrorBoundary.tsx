"use client"

import React from "react"

interface State {
  hasError: boolean
}

export class ManualErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ManualErrorBoundary caught an error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="border border-red-500 p-4">
          <h2 className="font-semibold text-red-700">An Error Occurred</h2>
          <p>This part of the application has crashed.</p>
          <button onClick={() => this.setState({ hasError: false })} className="text-sm underline">
            Try to reload this component
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
