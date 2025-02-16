"use client"

import { forwardRef, useImperativeHandle, useState, useEffect } from "react"
import { PersonCard } from '@/types/project'
import { PerplexityResponse } from '../types/api'
import { toast } from 'sonner'

interface Entry {
  id: string
  name: string
  company: string
  result?: string | null
  perplexityResult?: PerplexityResponse | null
  profileImage?: string | null
  profileImageOptions?: string[]
  selectedImageIndex?: number
  linkedinUrl?: string | null
  imageSelectionFeedback?: boolean
  combinedData?: {
    name: string
    profilePhoto: string
    linkedinURL: string
    currentRole: string
    conciseRole: string
    keyAchievements: string[]
    professionalBackground: string
    careerHistory: {
      title: string
      company: string
      duration: string
      highlights: string[]
    }[]
    expertiseAreas: string[]
    education?: {
      degree: string
      institution: string
      year: string
    }[]
    languages?: {
      language: string
      proficiency: string
    }[]
  } | null
  status: {
    rocketreach: 'pending' | 'processing' | 'completed' | 'error'
    perplexity: 'pending' | 'processing' | 'completed' | 'error'
    profileImage: 'pending' | 'processing' | 'completed' | 'error'
    linkedin: 'pending' | 'processing' | 'completed' | 'error'
    openai: 'pending' | 'processing' | 'completed' | 'error'
  }
  error?: {
    rocketreach?: string
    perplexity?: string
    profileImage?: string
    linkedin?: string
    openai?: string
  }
  runRocketReach: boolean
  runPerplexity: boolean
  runProfileImage: boolean
  runLinkedin: boolean
  runOpenAI: boolean
  saved?: boolean
  databaseId?: string
}

export interface DragDropAreaRef {
  getCompletedCards: () => PersonCard[]
}

interface DragDropAreaProps {
  onCardsUpdate?: (cards: PersonCard[]) => void
  projectName: string | undefined
  disabled: boolean
}

const DragDropArea = forwardRef<DragDropAreaRef, DragDropAreaProps>(function DragDropArea({ onCardsUpdate, projectName, disabled }, ref) {
  const [entries, setEntries] = useState<Entry[]>([])

  // Function to save a single card
  const saveCard = async (card: PersonCard) => {
    try {
      if (!projectName) {
        console.error('Cannot save card: No project name provided');
        toast.error('Cannot save card: No project name set');
        return false;
      }

      console.log('Saving card to database:', {
        projectName,
        cardName: card.name,
        cardData: card
      });
      
      const response = await fetch('/api/save-people-cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_name: projectName,
          people: [card]
        })
      });

      console.log('Save response status:', response.status);
      const data = await response.json();
      console.log('Save response data:', data);

      if (!response.ok) {
        const error = data.error || 'Failed to save card';
        console.error('Save card error:', error);
        toast.error(`Failed to save card: ${error}`);
        return false;
      }

      toast.success(`Saved card: ${card.name} to project: ${projectName}`);
      return true;
    } catch (error) {
      console.error('Error saving card:', error);
      toast.error(`Failed to save card: ${card.name} - ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  // Function to update entries
  const updateEntries = (newEntries: Entry[]) => {
    try {
      // Ensure newEntries is an array
      if (!Array.isArray(newEntries)) {
        console.error('updateEntries received non-array input:', newEntries)
        return
      }

      // Validate each entry has required fields
      const validEntries = newEntries.map(entry => ({
        ...entry,
        status: entry.status || {
          rocketreach: 'pending',
          perplexity: 'pending',
          profileImage: 'pending',
          linkedin: 'pending',
          openai: 'pending'
        },
        error: entry.error || {},
        runRocketReach: entry.runRocketReach ?? true,
        runPerplexity: entry.runPerplexity ?? true,
        runProfileImage: entry.runProfileImage ?? true,
        runLinkedin: entry.runLinkedin ?? true,
        runOpenAI: entry.runOpenAI ?? true,
        saved: entry.saved ?? false
      }))

      setEntries(validEntries)
    } catch (error) {
      console.error('Error in updateEntries:', error)
    }
  }

  // Handle file drop
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()

    if (disabled || !projectName) {
      toast.error('Please enter a project name first')
      return
    }

    try {
      // Example: Create a new entry for each dropped file
      const files = Array.from(event.dataTransfer.files)
      const newEntries: Entry[] = files.map((file, index) => ({
        id: `${Date.now()}-${index}`,
        name: file.name,
        company: '',
        result: null,
        perplexityResult: null,
        profileImage: null,
        profileImageOptions: [],
        selectedImageIndex: undefined,
        linkedinUrl: null,
        imageSelectionFeedback: false,
        combinedData: null,
        status: {
          rocketreach: 'pending',
          perplexity: 'pending',
          profileImage: 'pending',
          linkedin: 'pending',
          openai: 'pending'
        } as const,
        error: {},
        runRocketReach: true,
        runPerplexity: true,
        runProfileImage: true,
        runLinkedin: true,
        runOpenAI: true,
        saved: false
      }))

      updateEntries([...entries, ...newEntries])
    } catch (error) {
      console.error('Error in handleDrop:', error)
    }
  }

  // Notify parent component when entries change
  useEffect(() => {
    try {
      if (onCardsUpdate && Array.isArray(entries)) {
        const completedCards = entries
          .filter(entry => entry?.combinedData)
          .map(entry => ({
            name: entry.name,
            profilePhoto: entry.profileImage || entry.combinedData?.profilePhoto || 'Not found',
            linkedinURL: entry.linkedinUrl || entry.combinedData?.linkedinURL || 'Not found',
            currentRole: entry.combinedData?.currentRole || 'Not specified',
            conciseRole: entry.combinedData?.conciseRole || entry.combinedData?.currentRole || 'Not specified',
            keyAchievements: entry.combinedData?.keyAchievements || [],
            professionalBackground: entry.combinedData?.professionalBackground || 'Not specified',
            careerHistory: entry.combinedData?.careerHistory || [],
            expertiseAreas: entry.combinedData?.expertiseAreas || []
          }))
        onCardsUpdate(completedCards)
      }
    } catch (error) {
      console.error('Error in entries useEffect:', error)
    }
  }, [entries, onCardsUpdate])

  // Add the ref implementation
  useImperativeHandle(ref, () => ({
    getCompletedCards: () => {
      try {
        if (!Array.isArray(entries)) return []
        
        return entries
          .filter(entry => entry?.combinedData)
          .map(entry => ({
            name: entry.name,
            profilePhoto: entry.profileImage || entry.combinedData?.profilePhoto || 'Not found',
            linkedinURL: entry.linkedinUrl || entry.combinedData?.linkedinURL || 'Not found',
            currentRole: entry.combinedData?.currentRole || 'Not specified',
            conciseRole: entry.combinedData?.conciseRole || entry.combinedData?.currentRole || 'Not specified',
            keyAchievements: entry.combinedData?.keyAchievements || [],
            professionalBackground: entry.combinedData?.professionalBackground || 'Not specified',
            careerHistory: entry.combinedData?.careerHistory || [],
            expertiseAreas: entry.combinedData?.expertiseAreas || []
          }))
      } catch (error) {
        console.error('Error in getCompletedCards:', error)
        return []
      }
    }
  }))

  return (
    <div 
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      className={`border-2 border-dashed border-gray-300 rounded-lg p-8 text-center ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <p>{disabled ? 'Please enter a project name to start' : 'Drag and drop files here'}</p>
    </div>
  )
})

export default DragDropArea 