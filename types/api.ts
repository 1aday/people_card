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
}

export interface PerplexityResponse {
  currentRole?: string
  keyAchievements?: string[]
  professionalBackground?: string
  expertiseAreas?: string[]
  [key: string]: any // For any additional fields
}

export interface ProcessedResults {
  rocketreach?: string | null
  perplexity?: PerplexityResponse | null
  profileImage?: string | null
  linkedin?: string | null
  openai?: any | null
  [key: string]: any
} 