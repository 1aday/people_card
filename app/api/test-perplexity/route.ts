import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.PERPLEXITY_API_KEY
  
  try {
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
          content: "Say hello"
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