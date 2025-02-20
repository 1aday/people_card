export interface SerperImageResult {
  imageUrl: string
  imageWidth: number
  imageHeight: number
  link: string
}

export interface SerperOrganicResult {
  title: string
  link: string
  snippet: string
  position: number
  [key: string]: string | number // For any additional fields with string or number values
}

export interface PerplexityResponse {
  currentRole: string
  keyAchievements: string[]
  professionalBackground: string
  careerHistory: {
    title: string
    company: string
    duration: string
    highlights: string[]
  }[]
  expertiseAreas: string[]
  citations: Record<string, string>
  openai?: OpenAIResponse | null
  [key: string]: string | string[] | { title: string; company: string; duration: string; highlights: string[]; }[] | OpenAIResponse | null | undefined | Record<string, string>
}

interface OpenAIResponse {
  name: string
  profilePhoto: string
  linkedinURL: string
  currentRole: string
  keyAchievements: string[]
  professionalBackground: string
  careerHistory: {
    title: string
    company: string
    duration: string
    highlights: string[]
  }[]
  expertiseAreas: string[]
  citations: Record<string, string>
}

export interface ProcessedResults {
  rocketreach?: string | null
  perplexity?: PerplexityResponse | null
  profileImage?: string | null
  linkedin?: string | null
  openai?: OpenAIResponse | null
  [key: string]: string | PerplexityResponse | OpenAIResponse | null | undefined
} 