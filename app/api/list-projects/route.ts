import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    // Get distinct project names with their latest created_at using a single query
    const { data: projects, error } = await supabase
      .from('people_cards')
      .select('project_name, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching projects:', error)
      throw error
    }

    // Process the results to get unique projects with their latest timestamp
    const projectMap = new Map()
    projects?.forEach(project => {
      if (!projectMap.has(project.project_name)) {
        projectMap.set(project.project_name, {
          name: project.project_name,
          created_at: project.created_at
        })
      }
    })

    // Convert map to array and sort by created_at
    const uniqueProjects = Array.from(projectMap.values())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json({ projects: uniqueProjects })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
} 