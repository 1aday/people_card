import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const targetId = searchParams.get('id')
    const limit = parseInt(searchParams.get('limit') || '5')
    const threshold = parseFloat(searchParams.get('threshold') || '0.5')

    if (!targetId) {
      return NextResponse.json(
        { error: 'Missing target ID parameter' },
        { status: 400 }
      )
    }

    // First get the target person's embedding
    const { data: targetPerson, error: targetError } = await supabase
      .from('people_cards')
      .select('embedding')
      .eq('id', targetId)
      .single()

    if (targetError || !targetPerson) {
      return NextResponse.json(
        { error: 'Target person not found' },
        { status: 404 }
      )
    }

    // Then find similar people using the embedding
    const { data: similarPeople, error: searchError } = await supabase
      .rpc('find_similar_people', {
        query_embedding: targetPerson.embedding,
        match_threshold: threshold,
        match_count: limit
      })

    if (searchError) {
      throw searchError
    }

    return NextResponse.json({
      success: true,
      similar_people: similarPeople
    })
  } catch (error: any) {
    console.error('Error finding similar people:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
} 