import { NextResponse } from 'next/server'

export async function GET() {
  const envVars = {
    PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
    NEXT_PUBLIC_PERPLEXITY_API_KEY: process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY,
    NODE_ENV: process.env.NODE_ENV,
    allKeys: Object.keys(process.env).filter(key => key.includes('PERPLEXITY'))
  }

  console.log('Server-side environment variables:', envVars)

  return NextResponse.json({
    hasServerKey: !!process.env.PERPLEXITY_API_KEY,
    hasPublicKey: !!process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY,
    serverKeyLength: process.env.PERPLEXITY_API_KEY?.length,
    publicKeyLength: process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY?.length,
    allPerplexityKeys: Object.keys(process.env).filter(key => key.includes('PERPLEXITY'))
  })
} 