export interface PersonCard {
  id?: number;
  name: string;
  profilePhoto: string | null;
  profilePhotos?: string[];
  linkedinURL: string;
  currentRole: string;
  keyAchievements: string[];
  professionalBackground: string;
  careerHistory: {
    title: string;
    company: string;
    duration: string;
    highlights: string[];
  }[];
  expertiseAreas: string[];
  education?: {
    degree: string;
    institution: string;
    year: string;
  }[];
  languages?: {
    language: string;
    proficiency: string;
  }[];
} 