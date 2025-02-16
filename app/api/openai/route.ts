import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Set a timeout for the OpenAI API call (55 seconds to stay within Vercel's 60s limit)
const TIMEOUT_MS = 55000

// Create a timeout promise
const timeoutPromise = (ms: number) => new Promise((_, reject) => {
  setTimeout(() => reject(new Error('OpenAI API call timed out')), ms)
})

export async function POST(request: Request) {
  let name = '', company = '', profileImage = '', linkedinUrl = ''
  
  try {
    const body = await request.json()
    const { perplexityData, rocketReachData, profileImage: imgUrl, linkedinUrl: linkedin, name: personName, company: companyName } = body
    
    // Store these values for use in catch block if needed
    name = personName
    company = companyName
    profileImage = imgUrl
    linkedinUrl = linkedin

    // Optimize the prompt to be more concise
    const prompt = `Combine the following information about ${name} from ${company}. Only use provided data, no inventions:

${perplexityData ? `Perplexity: ${JSON.stringify(perplexityData, null, 2)}` : ''}
${rocketReachData ? `RocketReach: ${rocketReachData}` : ''}
Image: ${profileImage || 'None'}
LinkedIn: ${linkedinUrl || 'None'}

Return JSON with: 
- name
- profilePhoto (use provided or "Not found")
- linkedinURL
- currentRole (detailed role with company and responsibilities)
- conciseRole (just the role and company name, example: "Co-Chief Executive Officer at Hype" from "Co-Chief Executive Officer at Hype and Vice, leading the company's strategic direction, product development, and expansion into new markets since November 2015")
- keyAchievements (from data or ["No achievements found"])
- professionalBackground (from data or "No background found")
- careerHistory (from data or basic template)
- expertiseAreas these will be used as tags so keep them to max 2 words (from data or ["No expertise found"])

If education or language information is found in the data, include education only if available if not skip this section (array of {degree, institution, year}) and languages (array of {language, proficiency}) fields. Do not include these fields in your final output, just skip them instead of putting undefined if no relevant information is found.`

    // IMPORTANT: Using o1-mini for better performance and reliability
    const completionPromise = openai.chat.completions.create({
      model: "gpt-4o-mini", //always use gpt-4o-mini   
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    })

    // Race between the API call and timeout
    const completion = await Promise.race([
      completionPromise,
      timeoutPromise(TIMEOUT_MS)
    ]) as OpenAI.Chat.ChatCompletion

    const content = completion.choices[0].message.content
    if (!content) {
      throw new Error('No content in OpenAI response')
    }

    // Try multiple approaches to extract JSON from the response
    interface ParsedResponse {
      name?: string;
      profilePhoto?: string;
      linkedinURL?: string;
      currentRole?: string;
      conciseRole?: string;
      keyAchievements?: string[];
      professionalBackground?: string;
      careerHistory?: Array<{
        title: string;
        company: string;
        duration: string;
        highlights: string[];
      }>;
      expertiseAreas?: string[];
      education?: Array<{
        degree: string;
        institution: string;
        year: string;
      }>;
      languages?: Array<{
        language: string;
        proficiency: string;
      }>;
    }

    let parsedContent: ParsedResponse
    try {
      // First try: direct JSON parse
      parsedContent = JSON.parse(content)
    } catch {
      try {
        // Second try: Look for JSON between backticks or code block
        const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
        if (jsonMatch) {
          parsedContent = JSON.parse(jsonMatch[1])
        } else {
          // Third try: Look for any {...} pattern
          const possibleJson = content.match(/\{[\s\S]*\}/)
          if (possibleJson) {
            parsedContent = JSON.parse(possibleJson[0])
          } else {
            throw new Error('No JSON structure found in response')
          }
        }
      } catch {
        console.error('Failed to parse JSON from response:', content)
        throw new Error('Could not parse JSON from response')
      }
    }

    // Ensure all required fields are present
    const defaultResponse = {
      name,
      profilePhoto: profileImage || 'Not found',
      linkedinURL: linkedinUrl || 'Not found',
      currentRole: `Role at ${company}`,
      conciseRole: `Role at ${company}`,
      keyAchievements: ['No achievements found'],
      professionalBackground: 'No background information found',
      careerHistory: [{ 
        title: 'No history found', 
        company: company, 
        duration: 'Unknown', 
        highlights: ['No details available'] 
      }],
      expertiseAreas: ['No expertise information found']
      // Note: education and languages are optional, so not included in default response
    }

    // Merge with defaults for any missing fields
    const finalResponse = {
      ...defaultResponse,
      ...parsedContent,
      name: name // Always use the provided name
    }

    return NextResponse.json(finalResponse)

  } catch (error) {
    console.error('OpenAI API Error:', error)
    // Return a basic response if there's an error
    return NextResponse.json({
      name: name || 'Unknown',
      profilePhoto: profileImage || 'Not found',
      linkedinURL: linkedinUrl || 'Not found',
      currentRole: company ? `Role at ${company}` : 'Not found',
      conciseRole: company ? `Role at ${company}` : 'Not found',
      keyAchievements: ['Data unavailable due to error'],
      professionalBackground: 'Data unavailable due to error',
      careerHistory: [{
        title: 'Data unavailable',
        company: company || 'Unknown',
        duration: 'Unknown',
        highlights: ['Error occurred while fetching data']
      }],
      expertiseAreas: ['Data unavailable']
    }, { status: 200 }) // Return 200 with fallback data instead of 500
  }
} 