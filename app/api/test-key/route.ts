import { NextResponse } from 'next/server'

export async function GET() {
  return testPerplexity()
}

export async function POST() {
  return testPerplexity()
}

async function testPerplexity() {
  const apiKey = process.env.PERPLEXITY_API_KEY
  
  // Log the API key format (safely)
  console.log('API Key Debug:', {
    hasKey: !!apiKey,
    length: apiKey?.length,
    prefix: apiKey?.substring(0, 10),
    format: apiKey?.match(/^pplx-[a-f0-9]{40}$/) ? 'valid' : 'invalid'
  })

  try {
    // Test request with minimal payload
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`.trim()
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          {
            role: "user",
            content: "Hello"
          }
        ]
      })
    })

    // Log the full request details
    console.log('Request Debug:', {
      url: 'https://api.perplexity.ai/chat/completions',
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey?.slice(0, 10)}...`
      }
    })

    const responseText = await response.text()
    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = responseText
    }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      apiKeyInfo: {
        length: apiKey?.length,
        prefix: apiKey?.slice(0, 5),
        format: apiKey?.match(/^pplx-[a-f0-9]{40}$/) ? 'valid' : 'invalid'
      },
      response: responseData
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response('Error testing API key', { status: 500 })
  }
} 