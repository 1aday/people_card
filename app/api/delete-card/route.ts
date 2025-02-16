import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectName = searchParams.get('project_name')
    const cardId = searchParams.get('card_id')

    if (!projectName || !cardId) {
      return NextResponse.json(
        { error: 'Project name and card ID are required' },
        { status: 400 }
      )
    }

    // Delete the card from the database
    const { error } = await supabase
      .from('people_cards')
      .delete()
      .eq('id', cardId)
      .eq('project_name', projectName)

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting card:', error)
    return NextResponse.json(
      { error: 'Failed to delete card' },
      { status: 500 }
    )
  }
} 