import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Project, ProjectUpdate, ProjectWithStats } from '@/types/project'

// Initialize Supabase client
const supabase: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('id')
    const includeStats = searchParams.get('stats') === 'true'

    if (projectId) {
      // Get a specific project with its cards
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*, people_cards(*)')
        .eq('id', projectId)
        .single()

      if (projectError) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        )
      }

      if (includeStats) {
        const { data: stats, error: statsError } = await supabase
          .rpc('get_project_statistics', { p_project_id: projectId })

        if (!statsError && project) {
          (project as ProjectWithStats).statistics = stats
        }
      }

      return NextResponse.json(project)
    }

    // List all projects with basic stats
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*, people_cards(count)')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json(projects)

  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description } = body as Pick<Project, 'name' | 'description'>

    if (!name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('projects')
      .insert([
        { 
          name,
          description: description || null
        }
      ])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json(
          { error: 'A project with this name already exists' },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('id')

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('id')
    const body = await request.json()
    const updates = body as ProjectUpdate

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json(
          { error: 'A project with this name already exists' },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
} 