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
    const body = await request.json() as RequestBody
    let { project_name } = body
    const { people } = body

    console.log('Save endpoint received:', {
      project_name,
      numberOfPeople: people?.length,
      firstPerson: people?.[0] ? {
        hasName: !!people[0].name,
        hasProfilePhoto: !!people[0].profilePhoto,
        hasLinkedinURL: !!people[0].linkedinURL,
        hasCurrentRole: !!people[0].currentRole,
        hasConciseRole: !!people[0].conciseRole,
        hasKeyAchievements: Array.isArray(people[0].keyAchievements),
        hasProfessionalBackground: !!people[0].professionalBackground,
        hasCareerHistory: Array.isArray(people[0].careerHistory),
        hasExpertiseAreas: Array.isArray(people[0].expertiseAreas),
        rawData: people[0] // Add raw data for debugging
      } : null
    });

    if (!project_name || !people || !Array.isArray(people)) {
      console.error('Invalid request format:', { project_name, peopleIsArray: Array.isArray(people), people });
      return NextResponse.json(
        { error: 'Invalid request format. Requires project_name and people array.' },
        { status: 400 }
      )
    }

    // First check if this project already exists
    const { data: existingProject, error: existingProjectError } = await supabase
      .from('people_cards')
      .select('project_name')
      .eq('project_name', project_name)
      .limit(1);

    if (existingProjectError) {
      throw existingProjectError;
    }

    // Only check for similar names and increment if this is a new project
    if (!existingProject || existingProject.length === 0) {
      console.log('New project, checking for similar names:', project_name);
      const { data: similarProjects, error: projectsError } = await supabase
        .from('people_cards')
        .select('project_name')
        .like('project_name', `${project_name}%`)
        .throwOnError()

      if (projectsError) {
        console.error('Error checking existing projects:', projectsError);
        throw projectsError;
      }

      console.log('Found similar projects:', similarProjects?.map(p => p.project_name));

      // If projects exist with this name, add a suffix
      if (similarProjects && similarProjects.length > 0) {
        const existingNames = new Set(similarProjects.map(p => p.project_name))
        let counter = 1
        let newName = project_name
        
        while (existingNames.has(newName)) {
          newName = `${project_name} (${counter})`
          counter++
        }
        
        project_name = newName
        console.log('Using modified project name for new project:', project_name);
      }
    } else {
      console.log('Adding to existing project:', project_name);
    }

    // Insert all people cards
    const insertPromises = people.map(person => {
      const mappedData = {
        project_name,
        name: person.name,
        profile_photo: person.profilePhoto || null,
        linkedin_url: person.linkedinURL || null,
        current_position: person.currentRole || null,
        concise_role: person.conciseRole || null,
        key_achievements: person.keyAchievements || [],
        professional_background: person.professionalBackground || null,
        career_history: person.careerHistory || [],
        expertise_areas: person.expertiseAreas || []
      }

      console.log('Upserting card:', JSON.stringify(mappedData, null, 2));

      return supabase
        .from('people_cards')
        .upsert([mappedData], {
          onConflict: 'project_name,name',
          ignoreDuplicates: false
        })
        .select()
        .throwOnError()
    })

    // Wait for all insertions to complete
    console.log('Waiting for all insertions to complete...');
    const results = await Promise.all(insertPromises)
    
    // Check for any errors
    const errors = results.filter(result => result.error)
    if (errors.length > 0) {
      console.error('Errors saving people cards:', JSON.stringify(errors, null, 2))
      return NextResponse.json(
        { error: 'Some records failed to save', details: errors },
        { status: 500 }
      )
    }

    console.log('Successfully saved all cards:', {
      project_name,
      numberOfCards: people.length,
      savedData: results.map(r => r.data)
    });

    return NextResponse.json({
      success: true,
      message: `Successfully saved ${people.length} people cards for project "${project_name}"`,
      project_name,
      data: results.map(r => ({
        id: r.data?.[0]?.id,
        name: r.data?.[0]?.name,
        profilePhoto: r.data?.[0]?.profile_photo,
        linkedinURL: r.data?.[0]?.linkedin_url,
        currentRole: r.data?.[0]?.current_position,
        conciseRole: r.data?.[0]?.concise_role,
        keyAchievements: r.data?.[0]?.key_achievements,
        professionalBackground: r.data?.[0]?.professional_background,
        careerHistory: r.data?.[0]?.career_history,
        expertiseAreas: r.data?.[0]?.expertise_areas
      }))
    })

  } catch (error) {
    console.error('Error saving people cards:', error);
    // Add more detailed error logging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return NextResponse.json(
      { error: 'Failed to save people cards', details: error },
      { status: 500 }
    )
  }
} 
