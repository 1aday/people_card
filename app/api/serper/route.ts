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
  // Filter out unwanted image sources (only Instagram and Facebook-owned domains)
  const unwantedSources = [
    'instagram.com',
    'fbsbx.com',
    'fbcdn.net',
    'facebook.com',
    'cdninstagram.com',
    'fb.com'
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
      console.log('Total images from Serper:', data.images.length)
      
      // First filter out invalid URLs and social media
      let filteredImages = data.images
        .filter((img: any) => {
          if (!img.imageUrl) {
            console.log('Skipping image: No URL')
            return false
          }
          if (!isValidImageUrl(img.imageUrl)) {
            console.log('Skipping image: Social media source:', img.imageUrl)
            return false
          }
          return true
        })

      console.log('Images after URL filtering:', filteredImages.length)

      // Then check dimensions and add ratio
      filteredImages = filteredImages
        .map((img: any) => ({
          ...img,
          ratio: img.width && img.height ? img.width / img.height : null,
          score: img.width && img.height ? Math.min(img.width / img.height, img.height / img.width) : 0
        }))
        .filter((img: any) => {
          if (!img.width || !img.height) {
            console.log('Skipping image: No dimensions')
            return false
          }
          const hasValidSize = img.width >= 200 && img.width <= 1500 && 
                             img.height >= 200 && img.height <= 1500
          if (!hasValidSize) {
            console.log('Skipping image: Invalid size:', img.width, 'x', img.height)
          }
          return hasValidSize
        })

      console.log('Images after dimension filtering:', filteredImages.length)

      // Try to get square images first (ratio between 0.95 and 1.05)
      let squareImages = filteredImages
        .filter((img: any) => {
          const isSquarish = img.ratio >= 0.95 && img.ratio <= 1.05
          if (!isSquarish) {
            console.log('Non-square image ratio:', img.ratio)
          }
          return isSquarish
        })
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 3)

      console.log('Square images found:', squareImages.length)

      // If we don't have enough square images, add other aspect ratios
      if (squareImages.length < 3) {
        console.log('Not enough square images, adding other ratios')
        const remainingImages = filteredImages
          .filter((img: any) => img.ratio < 0.95 || img.ratio > 1.05)
          .sort((a: any, b: any) => b.score - a.score)
          .slice(0, 3 - squareImages.length)

        squareImages = [...squareImages, ...remainingImages]
      }

      // If we still have no images, take any images that passed the URL filter
      if (squareImages.length === 0 && data.images.length > 0) {
        console.log('No images passed filters, taking first 3 valid URLs')
        squareImages = data.images
          .filter((img: any) => img.imageUrl && isValidImageUrl(img.imageUrl))
          .slice(0, 3)
          .map((img: any) => ({
            ...img,
            ratio: img.width && img.height ? img.width / img.height : 1,
            score: 1
          }))
      }

      console.log('Final number of images:', squareImages.length)

      // Update the images in the response
      data.images = squareImages.map((img: any) => ({
        imageUrl: img.imageUrl,
        imageWidth: img.width || 300, // provide fallback dimensions if missing
        imageHeight: img.height || 300,
        link: img.link
      }))
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