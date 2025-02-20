import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    // Get counts of records with and without embeddings
    const { count: totalCount } = await supabase
      .from('people_cards')
      .select('*', { count: 'exact', head: true })

    const { count: withEmbeddingsCount } = await supabase
      .from('people_cards')
      .select('*', { count: 'exact', head: true })
      .not('embedding', 'is', null)

    // Get a few sample records with embeddings
    const { data: samples, error: samplesError } = await supabase
      .from('people_cards')
      .select('id, name, embedding')
      .not('embedding', 'is', null)
      .limit(3)

    if (samplesError) throw samplesError

    return NextResponse.json({
      total_records: totalCount || 0,
      records_with_embeddings: withEmbeddingsCount || 0,
      sample_records: samples?.map(record => ({
        id: record.id,
        name: record.name,
        has_embedding: Boolean(record.embedding),
        embedding_length: record.embedding ? record.embedding.length : 0
      }))
    })
  } catch (error: any) {
    console.error('Error checking embeddings:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
} 