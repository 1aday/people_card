import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface PersonData {
  key_achievements: string[];
  professional_background: string;
  career_history: Array<{
    title: string;
    company: string;
    duration: string;
    highlights: string[];
  }>;
  expertise_areas: string[];
}

serve(async (req) => {
  try {
    const { person_data, id } = await req.json() as { person_data: PersonData; id: number };
    console.log('Processing request for ID:', id);
    
    // Combine all relevant text data into a single string
    const textToEmbed = [
      // Key achievements
      ...(Array.isArray(person_data.key_achievements) ? person_data.key_achievements : []),
      
      // Professional background
      person_data.professional_background || '',
      
      // Career history
      ...(Array.isArray(person_data.career_history) ? person_data.career_history.map(position => 
        `${position.title || ''} at ${position.company || ''} (${position.duration || ''}). ${Array.isArray(position.highlights) ? position.highlights.join(' ') : ''}`
      ) : []),
      
      // Expertise areas
      ...(Array.isArray(person_data.expertise_areas) ? person_data.expertise_areas : [])
    ].filter(Boolean).join(' ');

    console.log('Generated text to embed for ID:', id, 'Text length:', textToEmbed.length);

    // Generate embedding using OpenAI
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: textToEmbed,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const embedding = data.data[0].embedding;
    console.log('Generated embedding for ID:', id, 'Length:', embedding.length);

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update the record with the new embedding
    console.log('Attempting to update record:', id);
    const updateResult = await supabaseClient
      .from('people_cards')
      .update({
        embedding: {
          type: 'vector',
          array: embedding
        }
      })
      .eq('id', id);

    if (updateResult.error) {
      console.error('Error updating record:', id, JSON.stringify(updateResult.error));
      throw new Error(`Failed to update record: ${JSON.stringify(updateResult.error)}`);
    }

    console.log('Successfully updated embedding for ID:', id);

    return new Response(
      JSON.stringify({ embedding }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Expose-Headers': 'Content-Length, X-JSON',
        } 
      }
    );
  } catch (error) {
    console.error('Error in Edge Function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
}); 