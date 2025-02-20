import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
  try {
    const { name } = await request.json()

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      )
    }

    // Check if project already exists by checking for any cards with this project name
    const { data: existingProject } = await supabase
      .from('people_cards')
      .select('project_name')
      .eq('project_name', name)
      .limit(1)
      .single()

    if (existingProject) {
      return NextResponse.json(
        { error: 'A project with this name already exists' },
        { status: 409 }
      )
    }

    // Create a placeholder card to establish the project
    // This card will be visible but clearly marked as a placeholder
    const { data: newProject, error } = await supabase
      .from('people_cards')
      .insert([{
        project_name: name,
        name: '📝 New Project',
        current_position: 'This is a new project. Click "Add Person" to start adding people to your project.',
        key_achievements: [],
        expertise_areas: [],
        career_history: []
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating project:', error)
      throw error
    }

    return NextResponse.json({ 
      project: {
        id: name,
        name: name,
        created_at: newProject.created_at,
        count: 1
      }
    })
  } catch (error) {
    console.error('Error in create-project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
} 