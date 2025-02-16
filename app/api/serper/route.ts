import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { searchType, query } = await request.json()
    
    const endpoint = searchType === 'images' 
      ? 'https://google.serper.dev/images' 
      : 'https://google.serper.dev/search'

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query }),
    })

    if (!response.ok) {
      throw new Error(`Serper API error: ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Serper API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch data' },
      { status: 500 }
    )
  }
} 