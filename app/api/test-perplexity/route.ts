import { NextResponse } from 'next/server'

interface PerplexityRequest {
  query: string
  variables?: Record<string, string>
}

function replaceVariables(query: string, variables?: Record<string, string>) {
  if (!variables) return query
  return query.replace(/\{\{(\w+)\}\}/g, (match, key) => variables[key] || match)
}

export async function POST(request: Request) {
  const apiKey = process.env.PERPLEXITY_API_KEY
  
  try {
    const { query, variables } = await request.json() as PerplexityRequest
    const processedQuery = replaceVariables(query, variables)

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [{
          role: "user",
          content: processedQuery
        }]
      })
    })

    const data = await response.json()
    return NextResponse.json({
      success: response.ok,
      status: response.status,
      data: data
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 