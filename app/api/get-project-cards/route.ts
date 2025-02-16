import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Helper function to ensure career history entry has all required fields
const normalizeCareerHistoryEntry = (entry: any) => {
  if (!entry || typeof entry !== 'object') {
    return {
      title: 'Unknown Position',
      company: 'Unknown Company',
      duration: 'Unknown Duration',
      highlights: []
    }
  }

  return {
    title: entry.title || 'Unknown Position',
    company: entry.company || 'Unknown Company',
    duration: entry.duration || 'Unknown Duration',
    highlights: Array.isArray(entry.highlights) ? entry.highlights : []
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectName = searchParams.get('project_name')

    if (!projectName) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      )
    }

    // Get all cards for this project with explicit column selection
    const { data: cards, error: cardsError } = await supabase
      .from('people_cards')
      .select(`
        id,
        created_at,
        project_name,
        name,
        profile_photo,
        linkedin_url,
        current_position,
        concise_role,
        key_achievements,
        professional_background,
        career_history,
        expertise_areas,
        profile_image_options
      `)
      .eq('project_name', projectName)
      .order('created_at', { ascending: true })

    if (cardsError) {
      console.error('Database error:', cardsError)
      throw cardsError
    }

    if (!cards) {
      return NextResponse.json([])
    }

    // Map database fields to PersonCard format with proper type checking
    const formattedCards = cards.map(card => {
      // Parse JSON fields if they're strings
      const parseJsonField = (field: any, defaultValue: any[] = []) => {
        if (!field) return defaultValue;
        if (Array.isArray(field)) return field;
        try {
          const parsed = JSON.parse(field);
          return Array.isArray(parsed) ? parsed : defaultValue;
        } catch {
          return defaultValue;
        }
      };

      // Parse and normalize career history
      let careerHistory = parseJsonField(card.career_history, []);
      careerHistory = Array.isArray(careerHistory) 
        ? careerHistory.map(normalizeCareerHistoryEntry)
        : [normalizeCareerHistoryEntry({})];

      // Parse profile image options
      const profileImageOptions = parseJsonField(card.profile_image_options, []);

      return {
        id: card.id,
        name: card.name || 'Unknown Name',
        profile_photo: card.profile_photo || null,
        linkedin_url: card.linkedin_url || null,
        current_position: card.current_position || 'Unknown Position',
        concise_role: card.concise_role || card.current_position || 'Unknown Position',
        key_achievements: parseJsonField(card.key_achievements, ['No achievements listed']),
        professional_background: card.professional_background || 'No background information available',
        career_history: careerHistory,
        expertise_areas: parseJsonField(card.expertise_areas, ['No expertise areas listed']),
        profile_image_options: profileImageOptions
      };
    });

    return NextResponse.json(formattedCards)
  } catch (error) {
    console.error('Error fetching project cards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project cards' },
      { status: 500 }
    )
  }
} 