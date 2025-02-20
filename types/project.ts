export interface CareerHistoryEntry {
  title: string
  company: string
  duration: string
  highlights: string[]
}

export interface PersonCard {
  id?: number  // Database ID
  name: string
  profilePhoto: string
  linkedinURL: string
  currentRole: string
  conciseRole: string
  keyAchievements: string[]
  professionalBackground: string
  careerHistory: CareerHistoryEntry[]
  expertiseAreas: string[]
  profile_image_options?: string[]  // Add profile image options array
  citations?: Record<string, string>  // Changed from string[] to Record<string, string>
}

export interface Project {
  id: string | number
  name: string
  count: number
  last_updated: string
  created_at?: string
  description?: string
  is_archived: boolean
  user_id?: string
}

export interface ProjectStatistics {
  total_cards: number
  unique_companies: number
  creation_date: string
  last_updated: string
}

export interface ProjectWithStats extends Project {
  statistics?: ProjectStatistics
  people_cards?: PersonCard[]
  card_count?: number
}

export interface ProjectUpdate {
  name?: string
  description?: string
  is_archived?: boolean
} 