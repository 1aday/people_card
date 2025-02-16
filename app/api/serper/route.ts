import { NextResponse } from 'next/server'

interface SearchRequest {
  searchType: string
  query: string
  variables?: Record<string, string>
}

function replaceVariables(query: string, variables?: Record<string, string>) {
  if (!variables) return query
  return query.replace(/\{\{(\w+)\}\}/g, (match, key) => variables[key] || match)
}

function isValidImageUrl(url: string): boolean {
  // Filter out unwanted image sources
  const unwantedSources = [
    'instagram.com',
    'fbsbx.com',
    'fbcdn.net',
    'facebook.com',
    'cdninstagram.com'
  ]
  
  try {
    const urlObj = new URL(url)
    return !unwantedSources.some(source => urlObj.hostname.includes(source))
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  try {
    const { searchType, query, variables } = await request.json() as SearchRequest
    
    const processedQuery = replaceVariables(query, variables)
    
    const endpoint = searchType === 'images' 
      ? 'https://google.serper.dev/images' 
      : 'https://google.serper.dev/search'

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: processedQuery }),
    })

    if (!response.ok) {
      throw new Error(`Serper API error: ${response.statusText}`)
    }

    const data = await response.json()
    
    // Filter images if it's an image search
    if (searchType === 'images' && data.images) {
      data.images = data.images
        .filter((img: any) => img.imageUrl && isValidImageUrl(img.imageUrl))
        .map((img: any) => ({
          ...img,
          // Add a score based on image dimensions if available
          score: img.width && img.height ? Math.min(img.width / img.height, img.height / img.width) : 0
        }))
        .sort((a: any, b: any) => b.score - a.score) // Sort by score, preferring more square images but not requiring 1:1
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Serper API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch data' },
      { status: 500 }
    )
  }
} 