import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('people_cards')
      .select('project_name, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    // Get unique projects with their latest card date
    const projects = Array.from(new Set(data.map(d => d.project_name)))
      .map(name => {
        const projectCards = data.filter(d => d.project_name === name)
        return {
          name,
          date: projectCards[0].created_at,
          count: projectCards.length
        }
      })

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
} 