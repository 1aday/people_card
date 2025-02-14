'use client'

import { useState, useEffect } from 'react'

interface TestResult {
  success: boolean
  status: number
  statusText: string
  headers: Record<string, string>
  apiKeyInfo: {
    length?: number
    prefix?: string
    format: string
  }
  response: unknown
}

export default function TestPage() {
  const [result, setResult] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/test-key')
      .then(res => res.json())
      .then(data => {
        setResult(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Test Page</h1>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <div className="text-red-500">Error: {error}</div>
      ) : (
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
} 