import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Make sure these environment variables are set
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(request: Request) {
  try {
    // Get all records that need embeddings
    const { data: records, error: fetchError } = await supabase
      .from('people_cards')
      .select('id, key_achievements, professional_background, career_history, expertise_areas')
      .is('embedding', null)

    if (fetchError) throw fetchError

    console.log(`Found ${records?.length || 0} records needing embeddings`)

    // Process each record
    const updates = await Promise.all((records || []).map(async (record) => {
      try {
        // Generate embedding via Edge Function
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/embed`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            person_data: {
              key_achievements: record.key_achievements,
              professional_background: record.professional_background,
              career_history: record.career_history,
              expertise_areas: record.expertise_areas
            }
          })
        })

        if (!response.ok) {
          throw new Error(`Failed to generate embedding: ${response.statusText}`)
        }

        const { embedding } = await response.json()

        // Update record with new embedding
        const { error: updateError } = await supabase
          .from('people_cards')
          .update({ embedding })
          .eq('id', record.id)

        if (updateError) throw updateError

        return { id: record.id, status: 'success' as const }
      } catch (error: any) {
        console.error(`Error processing record ${record.id}:`, error)
        return { 
          id: record.id, 
          status: 'error' as const, 
          error: error?.message || 'Unknown error' 
        }
      }
    }))

    return NextResponse.json({
      success: true,
      processed: updates.length,
      results: updates
    })
  } catch (error: any) {
    console.error('Error updating embeddings:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
} 
