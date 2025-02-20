import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { PersonCard } from '@/types/project'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface RequestBody {
  project_name: string
  people: PersonCard[]
}

export async function POST(request: Request) {
  try {
    const { project_name, people } = await request.json()

    if (!project_name || !people || !Array.isArray(people)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    // Add debug logging
    console.log('Saving cards with profile image options:', people.map(p => ({
      name: p.name,
      image_count: p.profile_image_options?.length || 0,
      images: p.profile_image_options
    })))

    const { data, error } = await supabase
      .from('people_cards')
      .upsert(
        people.map(person => ({
          project_name,
          name: person.name,
          profile_photo: person.profilePhoto,
          linkedin_url: person.linkedinURL,
          current_position: person.currentRole,
          concise_role: person.conciseRole,
          key_achievements: person.keyAchievements,
          professional_background: person.professionalBackground,
          career_history: person.careerHistory,
          expertise_areas: person.expertiseAreas,
          profile_image_options: person.profile_image_options,
          citations: person.citations || {}  // Add citations field with default empty object
        })),
        { onConflict: 'project_name,name' }
      )
      .select()

    if (error) {
      console.error('Error saving cards:', error)
      console.log('Attempted to save data:', people)  // Log the full data being saved
      throw error
    }

    // Log saved data
    console.log('Successfully saved cards with data:', data?.map(d => ({
      name: d.name,
      image_options_saved: d.profile_image_options
    })))

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in save-people-cards:', error)
    return NextResponse.json(
      { error: 'Failed to save people cards' },
      { status: 500 }
    )
  }
} 
