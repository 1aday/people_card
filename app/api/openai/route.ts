import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { perplexityData, rocketReachData, profileImage, linkedinUrl, name, company } = body

    const prompt = `
    You are a helpful assistant that processes and combines information about people. 
    DO NOT MAKE UP ANY INFORMATION. Only use what is provided in the data sources.
    
    Important: 
    - Only include factual information from the provided data sources
    - Do not invent or assume any details
    - For any missing or failed API results, use appropriate "Not found" messages
    - Always include the person's name and company

    The perplexity data:
    ${perplexityData ? JSON.stringify(perplexityData, null, 2) : '(No Perplexity data found - ignore this section)'}

    The rocket reach data:
    ${rocketReachData || '(No RocketReach data found - ignore this section)'}

    Profile image: ${profileImage || '(No profile image found)'}
    LinkedIn URL: ${linkedinUrl || '(No LinkedIn profile found)'}
    Name: ${name}
    Company: ${company}

    Return the response in this exact JSON structure:
    {
      "name": "${name}",
      "profilePhoto": "${profileImage || 'Not found'}",
      "linkedinURL": "${linkedinUrl || 'Not found'}",
      "currentRole": "${company ? `Role at ${company}` : 'Not found'} (Use actual role if found in data)",
      "keyAchievements": [
        ${perplexityData ? "Use achievements from data" : '"No achievements found"'}
      ],
      "professionalBackground": ${perplexityData || rocketReachData ? "Use available background data" : '"No background information found"'},
      "careerHistory": [
        ${rocketReachData ? "Use career history from RocketReach data" : '{ "title": "No history found", "company": "' + company + '", "duration": "Unknown", "highlights": ["No details available"] }'}
      ],
      "expertiseAreas": [
        ${perplexityData ? "Use expertise areas from data" : '"No expertise information found"'}
      ]
    }
    `

    const completion = await openai.chat.completions.create({
      model: "gpt-4-0125-preview",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that provides information in JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2
    })

    const content = completion.choices[0].message.content
    if (!content) {
      throw new Error('No content in OpenAI response')
    }

    return NextResponse.json(JSON.parse(content))

  } catch (error) {
    console.error('OpenAI API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 