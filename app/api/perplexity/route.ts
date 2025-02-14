import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const apiKey = process.env.PERPLEXITY_API_KEY
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Perplexity API key not found' },
        { status: 500 }
      )
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that provides information in JSON format."
          },
          ...body.messages
        ],
        temperature: 0.2,
        max_tokens: 4000,
        top_p: 0.9
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      
      // Handle specific error cases
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'API credits exhausted or invalid API key. Please check your Perplexity account.' },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        { error: `API Error (${response.status}): ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Server Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Add OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
} 