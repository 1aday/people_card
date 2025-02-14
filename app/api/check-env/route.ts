import { NextResponse } from 'next/server'

export async function GET() {
  const perplexityKey = process.env.PERPLEXITY_API_KEY
  console.log('Debug - Full key:', perplexityKey) // This will only show in server logs
  
  return NextResponse.json({
    hasKey: !!perplexityKey,
    keyLength: perplexityKey?.length,
    keyStart: perplexityKey?.slice(0, 10),
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('PERPLEXITY')),
    nodeEnv: process.env.NODE_ENV
  })
} 