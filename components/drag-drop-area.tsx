"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { 
  Loader2, 
  Download, 
  Plus, 
  Minus, 
  LinkedinIcon,
  LayoutGrid,
  LayoutList,
  Edit as EditIcon,
  Check,
  Upload
} from "lucide-react"
import React from "react"
import { ProfileCard } from "./profile-card"
import { Textarea } from "./ui/textarea"
import { SerperOrganicResult, PerplexityResponse } from '../types/api'
import { PersonCard } from '@/types/project'
import Image from 'next/image'
import { MinimalProfileCard } from "./minimal-profile-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from 'sonner'
import { ProjectSelector } from "./project-selector"
import { NiceCard } from "@/components/nice-card"

// Define SerperImageResult type
interface SerperImageResult {
  imageUrl: string
  imageWidth: number
  imageHeight: number
  link: string
}

// Define our own ProcessedResults type
interface ProcessedResults {
  rocketreach?: string | null
  perplexity?: PerplexityResponse | null
  profileImage?: string | null
  linkedin?: string | null
  openai?: {
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
}

// Rate limiting configuration for Standard plan
const RATE_LIMIT = {
  SCRAPE_REQUESTS_PER_MINUTE: 100,
  MIN_DELAY_BETWEEN_REQUESTS: 600, // 600ms = 100 requests per minute
}

interface Entry {
  id: string
  name: string
  company: string
  result?: string | null
  perplexityResult?: PerplexityResponse | null
  profileImage?: string | null
  profile_photo?: string | null  // Add this field to match database
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
    citations?: Record<string, string>
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

// Define types for API responses
interface SerperResponse {
  organic?: SerperOrganicResult[]
  images?: SerperImageResult[]
}

interface PromiseSettledResult<T> {
  status: 'fulfilled' | 'rejected'
  value?: T
  reason?: Error
}

// Add status emoji mapping
const STATUS_EMOJIS = {
  rocketreach: '🚀',
  perplexity: '🧠',
  profileImage: '🖼️',
  linkedin: '💼',
  openai: '🤖'
} as const

// Add status color mapping
const getStatusColor = (status: 'pending' | 'processing' | 'completed' | 'error') => {
  switch (status) {
    case 'pending':
      return 'text-gray-400'
    case 'processing':
      return 'text-blue-500'
    case 'completed':
      return 'text-green-500'
    case 'error':
      return 'text-red-500'
  }
}

// Update the DragDropAreaProps interface
interface DragDropAreaProps {
  onCardsUpdate: (cards: PersonCard[]) => void
  projectName: string | undefined
  onProjectChange?: (projectName: string) => void
  disabled: boolean
  isViewMode?: boolean
}

// Update the component definition
export default function DragDropArea({ 
  onCardsUpdate, 
  projectName, 
  onProjectChange,
  disabled,
  isViewMode = false 
}: DragDropAreaProps) {
  const [entriesToProcess, setEntriesToProcess] = useState<Entry[]>([])
  const [processedEntries, setProcessedEntries] = useState<Entry[]>([])
  const [currentName, setCurrentName] = useState("Amir Jaffari")
  const [currentCompany, setCurrentCompany] = useState("Shopify")
  const [isProcessing, setIsProcessing] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [isCreatingNewProject, setIsCreatingNewProject] = useState(false)
  const lastRequestTime = useRef<number>(0)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [isLoadingProject, setIsLoadingProject] = useState(false)

  // Add validation for project name
  const isValidProjectName = (name: string) => {
    return name.length >= 3 && /^[a-zA-Z0-9-_ ]+$/.test(name);
  };

  // Handle new project creation
  const handleCreateNewProject = () => {
    if (!isValidProjectName(newProjectName)) {
      toast.error('Please enter a valid project name (at least 3 characters, alphanumeric with spaces, hyphens, and underscores only)');
      return;
    }
    setIsCreatingNewProject(false);
    if (onProjectChange) {
      onProjectChange(newProjectName);
    }
  };

  // Update useEffect to handle card updates
  useEffect(() => {
    // Create a stable array of entries that have combinedData
    const entriesToShow = [...processedEntries, ...entriesToProcess].filter(e => e.combinedData);
    
    // Only update if we have entries to show
    if (entriesToShow.length > 0) {
      const formattedCards = entriesToShow.map(entry => ({
        name: entry.name,
        profilePhoto: entry.profileImage || '',
        linkedinURL: entry.linkedinUrl || '',
        currentRole: entry.combinedData?.currentRole || '',
        conciseRole: entry.combinedData?.conciseRole || entry.combinedData?.currentRole || '',
        keyAchievements: entry.combinedData?.keyAchievements || [],
        professionalBackground: entry.combinedData?.professionalBackground || '',
        careerHistory: entry.combinedData?.careerHistory || [],
        expertiseAreas: entry.combinedData?.expertiseAreas || []
      }));
      
      // Only call onCardsUpdate if we have new cards to show
      onCardsUpdate(formattedCards);
    }
  }, [processedEntries, entriesToProcess]); // Remove onCardsUpdate from dependencies

  // Update useEffect for loading project data
  useEffect(() => {
    let isMounted = true;
    const loadExistingProject = async () => {
      if (!projectName) {
        console.log('No project name, clearing entries');
        setProcessedEntries([])
        setEntriesToProcess([])
        return
      }

      try {
        setIsLoadingProject(true);
        console.log('Loading project:', projectName);
        
        // First, verify the project exists
        const projectsResponse = await fetch('/api/list-projects');
        const projectsData = await projectsResponse.json();
        const projectExists = projectsData.projects.some((p: any) => p.name === projectName);
        
        if (!projectExists) {
          // Instead of showing an error, just clear the entries
          // This allows for creating new projects
          console.log('Project does not exist yet:', projectName);
          if (isMounted) {
            setProcessedEntries([]);
            setEntriesToProcess([]);
          }
          return;
        }

        // Then load the project data
        const response = await fetch(`/api/get-project-cards?project_name=${encodeURIComponent(projectName)}`);
        if (!response.ok) {
          throw new Error('Failed to load project data');
        }

        const data = await response.json();
        if (!isMounted) return;

        // Log the received data for debugging
        console.log('Received project data:', data);

        // Validate data structure
        if (!data || !data.cards || !Array.isArray(data.cards)) {
          console.error('Invalid data structure received:', data);
          toast.error('Invalid data structure received from server');
          return;
        }

        const formattedEntries = data.cards.map((card: any) => ({
          id: card.id.toString(),
          name: card.name,
          company: card.company || '',
          profileImage: card.profile_photo,
          profile_photo: card.profile_photo,  // Add this field
          linkedinUrl: card.linkedin_url,
          databaseId: card.id.toString(),
          saved: true,
          combinedData: {
            name: card.name,
            profilePhoto: card.profile_photo,
            linkedinURL: card.linkedin_url,
            currentRole: card.current_position,
            conciseRole: card.concise_role,
            keyAchievements: card.key_achievements || [],
            professionalBackground: card.professional_background || '',
            careerHistory: card.career_history || [],
            expertiseAreas: card.expertise_areas || [],
            profile_image_options: card.profile_image_options || [],
            citations: card.citations || {}  // Add citations here
          },
          status: {
            rocketreach: 'completed',
            perplexity: 'completed',
            profileImage: 'completed',
            linkedin: 'completed',
            openai: 'completed'
          },
          runRocketReach: false,
          runPerplexity: false,
          runProfileImage: false,
          runLinkedin: false,
          runOpenAI: false
        }));

        if (isMounted) {
          setProcessedEntries(formattedEntries);
          setEntriesToProcess([]);
        }
      } catch (error) {
        console.error('Error loading project:', error);
        toast.error('Failed to load project data');
      } finally {
        if (isMounted) {
          setIsLoadingProject(false);
        }
      }
    };

    loadExistingProject();
    return () => {
      isMounted = false;
    };
  }, [projectName]); // Only depend on projectName

  useEffect(() => {
    console.log('All entries:', entriesToProcess.map(e => ({
      id: e.id,
      name: e.name,
      hasCombinedData: !!e.combinedData,
      status: e.status,
      error: e.error
    })));
    console.log('Entries with combined data:', entriesToProcess
      .filter(e => e.combinedData)
      .map(e => ({
        id: e.id,
        name: e.name,
        combinedData: e.combinedData
      }))
    );
  }, [entriesToProcess])

  const handleAddEntry = () => {
    if (currentName && currentCompany) {
      // Check if entry already exists in processedEntries
      const existingEntry = processedEntries.find(e => 
        e.name.toLowerCase() === currentName.toLowerCase() && 
        e.company.toLowerCase() === currentCompany.toLowerCase()
      );

      if (existingEntry) {
        toast.info(`${currentName} from ${currentCompany} already exists in this project`);
        setCurrentName("");
        setCurrentCompany("");
        return;
      }

      const newEntry: Entry = {
        id: Date.now().toString(),
        name: currentName,
        company: currentCompany,
        status: {
          rocketreach: 'pending',
          perplexity: 'pending',
          profileImage: 'pending',
          linkedin: 'pending',
          openai: 'pending'
        },
        runRocketReach: true,
        runPerplexity: true,
        runProfileImage: true,
        runLinkedin: true,
        runOpenAI: true
      }
      setEntriesToProcess(prev => [...prev, newEntry])
      setCurrentName("")
      setCurrentCompany("")
    }
  }

  const handleBulkPaste = (text: string) => {
    // Split by newline and handle both CSV and tab-delimited formats
    const rows = text.split(/\n/).filter(row => row.trim())
    
    const newEntries = rows.map(row => {
      // Try comma first, then tab
      let [name, company] = row.includes(',') 
        ? row.split(',') 
        : row.split('\t')

      // Clean up the values
      name = name?.trim() || ''
      company = company?.trim() || ''

      if (!name || !company) return null

      // Check if entry already exists in processedEntries
      const exists = processedEntries.some(e => 
        e.name.toLowerCase() === name.toLowerCase() && 
        e.company.toLowerCase() === company.toLowerCase()
      );

      if (exists) {
        console.log(`Skipping ${name} from ${company} - already exists in project`);
        return null;
      }

      return {
        id: Date.now().toString() + Math.random(),
        name,
        company,
        status: {
          rocketreach: 'pending',
          perplexity: 'pending',
          profileImage: 'pending',
          linkedin: 'pending',
          openai: 'pending'
        },
        runRocketReach: true,
        runPerplexity: true,
        runProfileImage: true,
        runLinkedin: true,
        runOpenAI: true
      } as Entry
    }).filter(Boolean) as Entry[]

    if (newEntries.length === 0) {
      toast.info('All entries already exist in this project');
      return;
    }

    const skippedCount = rows.length - newEntries.length;
    if (skippedCount > 0) {
      toast.info(`Skipped ${skippedCount} existing entries`);
    }

    setEntriesToProcess(current => [...current, ...newEntries])
  }

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const toggleAPI = (entryId: string, api: 'rocketreach' | 'perplexity' | 'profileImage' | 'linkedin' | 'openai') => {
    setEntriesToProcess(current =>
      current.map(e =>
        e.id === entryId
          ? {
              ...e,
              [api === 'rocketreach' ? 'runRocketReach' : api === 'perplexity' ? 'runPerplexity' : api === 'profileImage' ? 'runProfileImage' : api === 'linkedin' ? 'runLinkedin' : 'runOpenAI']: !e[api === 'rocketreach' ? 'runRocketReach' : api === 'perplexity' ? 'runPerplexity' : api === 'profileImage' ? 'runProfileImage' : api === 'linkedin' ? 'runLinkedin' : 'runOpenAI']
            }
          : e
      )
    )
  }

  const fetchProfileImage = async (name: string, company: string, projectName?: string): Promise<{ mainImage: string | null, allImages: string[] }> => {
    try {
      const response = await fetch("/api/serper", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          searchType: 'images',
          query: `${name} ${company} professional headshot`
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json() as SerperResponse;
      
      // Get all valid images from the response
      const validImages = (data.images || [])
        .map(image => image.imageUrl)
        .filter(url => url && url !== '');  // Filter out empty URLs

      // Get the first valid image as main image
      const mainImage = validImages.length > 0 ? validImages[0] : null;

      // Save profile image options immediately if we have a project name
      if (projectName) {
        console.log('Saving profile image options:', {
          name,
          mainImage,
          validImages
        });

        const saveResponse = await fetch('/api/save-people-cards', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            project_name: projectName,
            people: [{
              name,
              profilePhoto: mainImage || '',
              linkedinURL: '',  // Will be updated later
              currentRole: company || '',
              conciseRole: company || '',
              keyAchievements: [],
              professionalBackground: '',
              careerHistory: [],
              expertiseAreas: [],
              profile_image_options: validImages  // Save all valid images
            }]
          })
        });

        if (!saveResponse.ok) {
          console.error('Failed to save profile image options:', await saveResponse.json());
        } else {
          console.log('Successfully saved profile image options');
        }
      }

      return {
        mainImage,
        allImages: validImages
      };
    } catch (error) {
      console.error('Error fetching profile image:', error);
      return { mainImage: null, allImages: [] };
    }
  }

  const fetchLinkedinUrl = async (name: string, company: string): Promise<string | null> => {
    try {
      const response = await fetch("/api/serper", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          searchType: 'search',
          query: `"${name}" ${company} site:linkedin.com`
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json() as SerperResponse;
      
      // Find the first result that matches our criteria
      const linkedinResult = data.organic?.find((result: SerperOrganicResult) => {
        const isProfileUrl = result.link.includes('linkedin.com/in/');
        const hasNameAndCompany = 
          result.snippet.toLowerCase().includes(name.toLowerCase()) && 
          result.snippet.toLowerCase().includes(company.toLowerCase());
        return isProfileUrl && hasNameAndCompany;
      });

      if (!linkedinResult?.link) {
        return null;
      }

      return linkedinResult.link;
    } catch (error) {
      console.error('Error fetching LinkedIn URL:', error);
      return null;
    }
  }

  const processRocketReach = async (entry: Entry): Promise<string> => {
    try {
      console.log('Starting to process entry:', entry.name)
      
      // Rate limiting: Calculate delay needed
      const now = Date.now()
      const timeSinceLastRequest = now - lastRequestTime.current
      if (timeSinceLastRequest < RATE_LIMIT.MIN_DELAY_BETWEEN_REQUESTS) {
        const delayNeeded = RATE_LIMIT.MIN_DELAY_BETWEEN_REQUESTS - timeSinceLastRequest
        await delay(delayNeeded)
      }

      // 1. Create search query
      const query = `site:rocketreach.co ${entry.name} ${entry.company}`
      console.log('Searching with query:', query)
      
      // 2. Call Serper API through our server endpoint
      const serperResponse = await fetch("/api/serper", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          searchType: 'search',
          query: query
        })
      });

      if (!serperResponse.ok) {
        throw new Error(`API error: ${serperResponse.statusText}`)
      }

      const data = await serperResponse.json()
      console.log('Serper response:', data)

      // 3. Find matching result
      const matchingResult = data.organic?.find((result: SerperOrganicResult) => 
        result.snippet.toLowerCase().includes(entry.name.toLowerCase()) && 
        result.snippet.toLowerCase().includes(entry.company.toLowerCase())
      );

      if (!matchingResult) {
        return '(No RocketReach data found)'
      }

      console.log('Found matching result:', matchingResult)

      // 4. Call Firecrawl API through our server endpoint
      console.log('Calling Firecrawl with URL:', matchingResult.link)
      const firecrawlResponse = await fetch("/api/firecrawl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: matchingResult.link
        }),
      })

      if (!firecrawlResponse.ok) {
        throw new Error(`API error: ${firecrawlResponse.statusText}`)
      }

      const scrapeResult = await firecrawlResponse.json()
      console.log('Firecrawl Raw Response:', {
        status: firecrawlResponse.status,
        statusText: firecrawlResponse.statusText,
        headers: Object.fromEntries(firecrawlResponse.headers.entries()),
        body: scrapeResult
      })
      
      // Log the structure of the response
      console.log('Response Keys:', Object.keys(scrapeResult))
      console.log('Full Response:', JSON.stringify(scrapeResult, null, 2))

      // Check for markdown in the nested data structure
      const markdownContent = scrapeResult?.data?.markdown
      if (!markdownContent) {
        console.log('No markdown content found in Firecrawl response')
        return '(No RocketReach data available)'
      }

      return markdownContent
    } catch (error) {
      console.error('Error processing RocketReach:', error)
      return '(RocketReach data unavailable)'
    }
  }

  const processPerplexity = async (entry: Entry): Promise<PerplexityResponse> => {
    try {
      console.log('Calling Perplexity API for:', entry.name)

      const response = await fetch('/api/perplexity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Find information about ${entry.name} who works at ${entry.company}. Return the information in this exact JSON structure. Include at least 3-5 expertise areas, provide a detailed professional background covering their career progression, and include citations with links to your sources: {
              currentRole: "string - detailed current position",
              keyAchievements: [ "string - notable accomplishments in current and past roles" ],
              professionalBackground: "string - comprehensive career narrative",
              careerHistory: [
                {
                  title: "string - job title",
                  company: "string - company name",
                  duration: "string - time period",
                  highlights: [ "string - key responsibilities and achievements" ]
                }
              ],
              expertiseAreas: [ "string - 3 to 5 specific areas of expertise" ],
              citations: {
                "string - source name or description": "string - URL or reference to the source"
              }
            }`
          }]
        })
      })

      const responseData = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Perplexity API credits exhausted')
        }
        throw new Error(responseData.error || 'API request failed')
      }

      if (!responseData.choices?.[0]?.message?.content) {
        console.warn('No content in Perplexity response')
        return createDefaultPerplexityResponse(entry.name, entry.company)
      }

      const content = responseData.choices[0].message.content

      try {
        // First try direct JSON parse
        return JSON.parse(content)
      } catch {
        console.log('Direct JSON parse failed, trying to extract from markdown...')
        
        // Try to extract JSON from markdown code blocks
        const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[1])
          } catch {
            console.warn('Failed to parse JSON from markdown')
          }
        }

        // Try to find any JSON-like structure
        const possibleJson = content.match(/\{[\s\S]*\}/)
        if (possibleJson) {
          try {
            return JSON.parse(possibleJson[0])
          } catch {
            console.warn('Failed to parse JSON structure')
          }
        }

        // If all parsing attempts fail, create a default response
        console.warn('Could not parse Perplexity response, using default structure')
        return createDefaultPerplexityResponse(entry.name, entry.company)
      }
    } catch (error) {
      console.warn('Error in processPerplexity:', error)
      // Update the entry status without throwing
      setEntriesToProcess(current =>
        current.map(e =>
          e.id === entry.id ? {
            ...e,
            status: { ...e.status, perplexity: 'error' },
            error: { 
              ...e.error, 
              perplexity: error instanceof Error ? error.message : 'Unknown error'
            }
          } : e
        )
      )
      // Return default response instead of throwing
      return createDefaultPerplexityResponse(entry.name, entry.company)
    }
  }

  // Helper function to create a default response when parsing fails
  const createDefaultPerplexityResponse = (name: string, company: string): PerplexityResponse => ({
    currentRole: `Employee at ${company}`,
    keyAchievements: [
      'Information not available',
    ],
    professionalBackground: `${name} works at ${company}. Additional information could not be retrieved.`,
    careerHistory: [{
      title: 'Employee',
      company: company,
      duration: 'Present',
      highlights: ['Information not available']
    }],
    expertiseAreas: ['Information not available'],
    citations: {
      'No sources available': 'Information could not be retrieved'
    }
  })

  const handleProcessAll = async () => {
    // Check for project name first
    if (!projectName) {
      toast.error('Please select or create a project first');
      return;
    }

    console.log('Starting to process all entries')
    setIsProcessing(true)

    try {
      const pendingEntries = entriesToProcess.filter(e => 
        (e.runRocketReach && e.status.rocketreach === 'pending') ||
        (e.runPerplexity && e.status.perplexity === 'pending') ||
        (e.runProfileImage && e.status.profileImage === 'pending') ||
        (e.runLinkedin && e.status.linkedin === 'pending') ||
        (e.runOpenAI && e.status.openai === 'pending')
      )

      // Array to store all OpenAI promises that will be executed after their respective non-OpenAI calls
      const openAIPromises: Promise<void>[] = []

      // Process each person's non-OpenAI calls in parallel
      await Promise.all(pendingEntries.map(async (entry) => {
        console.log('Processing entry:', entry.name)
        
        try {
          // First, process all non-OpenAI calls
          const mainPromises: Promise<any>[] = []
          const mainPromiseTypes: ('rocketreach' | 'perplexity')[] = []
          
          if (entry.runRocketReach) {
            mainPromises.push(
              processRocketReach(entry).then(result => {
                setEntriesToProcess(current =>
                  current.map(e =>
                    e.id === entry.id ? {
                      ...e,
                      result: result,
                      status: { ...e.status, rocketreach: 'completed' }
                    } : e
                  )
                )
                return result
              })
            )
            mainPromiseTypes.push('rocketreach')
          }

          if (entry.runPerplexity) {
            mainPromises.push(
              processPerplexity(entry).then(result => {
                setEntriesToProcess(current =>
                  current.map(e =>
                    e.id === entry.id ? {
                      ...e,
                      perplexityResult: result,
                      status: { ...e.status, perplexity: 'completed' }
                    } : e
                  )
                )
                return result
              })
            )
            mainPromiseTypes.push('perplexity')
          }

          // Process Serper calls
          const serperPromises: Promise<ProcessedResults>[] = []
          const serperPromiseTypes: ('serper')[] = []

          if (entry.runProfileImage || entry.runLinkedin) {
            const serperCalls = async () => {
              const results: ProcessedResults = {}

              if (entry.runProfileImage) {
                try {
                  const { mainImage, allImages } = await fetchProfileImage(entry.name, entry.company, projectName)
                  setEntriesToProcess(current =>
                    current.map(e =>
                      e.id === entry.id ? {
                        ...e,
                        profileImage: mainImage,
                        profileImageOptions: allImages,  // Store all qualifying images
                        selectedImageIndex: 0,
                        status: { ...e.status, profileImage: 'completed' }
                      } : e
                    )
                  )
                  results['profileImage'] = mainImage
                } catch (error) {
                  setEntriesToProcess(current =>
                    current.map(e =>
                      e.id === entry.id ? {
                        ...e,
                        status: { ...e.status, profileImage: 'error' },
                        error: { ...e.error, profileImage: error instanceof Error ? error.message : 'Failed to fetch profile image' }
                      } : e
                    )
                  )
                }
              }

              if (entry.runLinkedin) {
                try {
                  const linkedinUrl = await fetchLinkedinUrl(entry.name, entry.company)
                  setEntriesToProcess(current =>
                    current.map(e =>
                      e.id === entry.id ? {
                        ...e,
                        linkedinUrl,
                        status: { ...e.status, linkedin: 'completed' }
                      } : e
                    )
                  )
                  results['linkedin'] = linkedinUrl
                } catch (error) {
                  setEntriesToProcess(current =>
                    current.map(e =>
                      e.id === entry.id ? {
                        ...e,
                        status: { ...e.status, linkedin: 'error' },
                        error: { ...e.error, linkedin: error instanceof Error ? error.message : 'Failed to fetch LinkedIn URL' }
                      } : e
                    )
                  )
                }
              }
              return results
            }
            serperPromises.push(serperCalls())
            serperPromiseTypes.push('serper')
          }

          // Update status to processing for all selected APIs
          setEntriesToProcess(current =>
            current.map(e =>
              e.id === entry.id ? {
                ...e,
                status: {
                  ...e.status,
                  ...(e.runRocketReach && { rocketreach: 'processing' }),
                  ...(e.runPerplexity && { perplexity: 'processing' }),
                  ...(e.runProfileImage && { profileImage: 'processing' }),
                  ...(e.runLinkedin && { linkedin: 'processing' })
                }
              } : e
            )
          )

          // Wait for all non-OpenAI calls to complete
          const [mainResults, serperResults] = await Promise.all([
            Promise.allSettled(mainPromises),
            Promise.allSettled(serperPromises)
          ])
          
          // Process results from all APIs
          const processedResults: ProcessedResults = {}
          
          // Process main API results
          mainResults.forEach((result: PromiseSettledResult<any>, index: number) => {
            const apiType = mainPromiseTypes[index]
            if (result.status === 'fulfilled') {
              if (apiType === 'rocketreach') {
                processedResults.rocketreach = result.value as string || null
              } else if (apiType === 'perplexity') {
                processedResults.perplexity = result.value as PerplexityResponse || null
              }
            } else {
              setEntriesToProcess(current =>
                current.map(e =>
                  e.id === entry.id ? {
                    ...e,
                    status: { ...e.status, [apiType]: 'error' },
                    error: { ...e.error, [apiType]: result.reason?.message || 'API call failed' }
                  } : e
                )
              )
            }
          })

          // Process Serper results
          serperResults.forEach((result: PromiseSettledResult<ProcessedResults>) => {
            if (result.status === 'fulfilled' && result.value) {
              const serperData = result.value
              if (serperData.profileImage) {
                processedResults.profileImage = serperData.profileImage
              }
              if (serperData.linkedin) {
                processedResults.linkedin = serperData.linkedin
              }
            }
          })

          // Queue OpenAI processing to run after non-OpenAI calls are complete
          if (entry.runOpenAI) {
            const openAIPromise = (async () => {
              try {
                setEntriesToProcess(current =>
                  current.map(e =>
                    e.id === entry.id ? {
                      ...e,
                      status: { ...e.status, openai: 'processing' }
                    } : e
                  )
                )

                console.log('Calling OpenAI API with data:', {
                  perplexityData: entry.runPerplexity ? processedResults.perplexity : null,
                  rocketReachData: entry.runRocketReach ? processedResults.rocketreach : null,
                  profileImage: entry.runProfileImage ? processedResults.profileImage : null,
                  linkedinUrl: entry.runLinkedin ? processedResults.linkedin : null,
                  name: entry.name,
                  company: entry.company
                })

                const response = await fetch('/api/openai', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    perplexityData: entry.runPerplexity ? processedResults.perplexity : null,
                    rocketReachData: entry.runRocketReach ? processedResults.rocketreach : null,
                    profileImage: entry.runProfileImage ? processedResults.profileImage : null,
                    linkedinUrl: entry.runLinkedin ? processedResults.linkedin : null,
                    name: entry.name,
                    company: entry.company,
                    responseSchema: {
                      name: "string - person's full name",
                      profilePhoto: "string - URL of profile photo",
                      linkedinURL: "string - LinkedIn profile URL",
                      currentRole: "string - detailed current position",
                      conciseRole: "string - brief version of current role",
                      keyAchievements: ["string - notable accomplishments"],
                      professionalBackground: "string - comprehensive career narrative",
                      careerHistory: [{
                        title: "string - job title",
                        company: "string - company name",
                        duration: "string - time period",
                        highlights: ["string - key responsibilities and achievements"]
                      }],
                      expertiseAreas: ["string - areas of expertise"],
                      citations: {
                        "string - source name or description": "string - URL or reference to source"
                      }
                    }
                  })
                })

                if (!response.ok) {
                  const errorData = await response.json().catch(() => ({}))
                  console.error('OpenAI API error:', errorData)
                  throw new Error(errorData.error || `OpenAI API request failed with status ${response.status}`)
                }

                const combinedData = await response.json()
                
                // Validate the response structure
                if (!combinedData || typeof combinedData !== 'object') {
                  throw new Error('Invalid response format from OpenAI API')
                }

                // Ensure required fields are present
                const requiredFields = ['name', 'currentRole', 'keyAchievements', 'professionalBackground', 'careerHistory', 'expertiseAreas']
                const missingFields = requiredFields.filter(field => !(field in combinedData))
                if (missingFields.length > 0) {
                  throw new Error(`Missing required fields in OpenAI response: ${missingFields.join(', ')}`)
                }

                console.log('OpenAI API response:', combinedData)
                
                // Ensure citations are properly merged and stored
                const mergedCitations = {
                  ...(combinedData.citations || {}),
                  ...(entry.perplexityResult?.citations || {})
                }

                console.log('Merged citations:', mergedCitations)  // Debug log

                // First set the combinedData regardless of project name
                setEntriesToProcess(current =>
                  current.map(e =>
                    e.id === entry.id ? {
                      ...e,
                      status: { ...e.status, openai: 'completed' },
                      combinedData: {
                        name: entry.name,
                        profilePhoto: entry.profileImage || combinedData.profilePhoto || 'Not found',
                        linkedinURL: entry.linkedinUrl || combinedData.linkedinURL || 'Not found',
                        currentRole: combinedData.currentRole || 'Not specified',
                        conciseRole: combinedData.conciseRole || combinedData.currentRole || 'Not specified',
                        keyAchievements: combinedData.keyAchievements || [],
                        professionalBackground: combinedData.professionalBackground || 'Not specified',
                        careerHistory: combinedData.careerHistory || [],
                        expertiseAreas: combinedData.expertiseAreas || [],
                        profile_image_options: entry.profileImageOptions || [],
                        citations: mergedCitations  // Use the merged citations
                      }
                    } : e
                  )
                );

                // Create the card data
                const card: PersonCard = {
                  name: entry.name,
                  profilePhoto: entry.profileImage || combinedData.profilePhoto || 'Not found',
                  linkedinURL: entry.linkedinUrl || combinedData.linkedinURL || 'Not found',
                  currentRole: combinedData.currentRole || 'Not specified',
                  conciseRole: combinedData.conciseRole || combinedData.currentRole || 'Not specified',
                  keyAchievements: combinedData.keyAchievements || [],
                  professionalBackground: combinedData.professionalBackground || 'Not specified',
                  careerHistory: combinedData.careerHistory || [],
                  expertiseAreas: combinedData.expertiseAreas || [],
                  profile_image_options: entry.profileImageOptions || [],
                  citations: {
                    ...(combinedData.citations || {}),  // Include OpenAI citations
                    ...(entry.perplexityResult?.citations || {})  // Include Perplexity citations
                  }
                };

                // Only save to database if project name exists
                if (projectName) {
                  console.log('Saving card immediately after OpenAI processing:', {
                    projectName,
                    cardData: {
                      ...card,
                      profile_image_options: card.profile_image_options?.length || 0  // Log count for brevity
                    }
                  });
                  
                  try {
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

                    const responseData = await response.json();
                    
                    if (!response.ok) {
                      console.error('Error saving card:', {
                        status: response.status,
                        statusText: response.statusText,
                        error: responseData,
                        cardData: {
                          name: card.name,
                          projectName,
                          hasProfileImage: !!card.profilePhoto,
                          imageOptionsCount: card.profile_image_options?.length || 0,
                          citations: card.citations  // Log citations on error
                        }
                      });
                      throw new Error(responseData.error || `Failed to save card: ${response.statusText}`);
                    }

                    console.log('Card saved successfully:', {
                      responseData,
                      savedCard: responseData.data?.[0],
                      citations: responseData.data?.[0]?.citations  // Log saved citations
                    });

                    // Update the database ID after saving
                    setEntriesToProcess(current =>
                      current.map(e =>
                        e.id === entry.id ? {
                          ...e,
                          saved: true,
                          databaseId: responseData.data?.[0]?.id
                        } : e
                      )
                    );

                  } catch (error) {
                    console.error('Error in save operation:', error);
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error saving card';
                    toast.error(errorMessage);
                    throw error;  // Re-throw to be caught by outer try-catch
                  }
                }

              } catch (error) {
                console.error('OpenAI processing error:', error)
                setEntriesToProcess(current =>
                  current.map(e =>
                    e.id === entry.id ? {
                      ...e,
                      status: { ...e.status, openai: 'error' },
                      error: { ...e.error, openai: error instanceof Error ? error.message : 'OpenAI processing failed' }
                    } : e
                  )
                )
              }
            })()
            openAIPromises.push(openAIPromise)
          }

        } catch (error) {
          console.error(`Error processing entry ${entry.name}:`, error)
          toast.error(`Error processing ${entry.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }))

      // Wait for all OpenAI calls to complete
      await Promise.all(openAIPromises)

      console.log('All processing completed')
      setIsProcessing(false)
      toast.success('Processing completed')

    } catch (error) {
      console.error('Processing error:', error)
      setIsProcessing(false)
      toast.error(`Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const toggleRowExpansion = (id: string) => {
    setExpandedRows(current => {
      const newSet = new Set(current)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const handleExportCSV = () => {
    // Only export entries that have completed OpenAI processing
    const completedEntries = entriesToProcess.filter(e => e.combinedData)
    
    if (completedEntries.length === 0) {
      alert('No completed cards to export')
      return
    }

    // Define CSV headers based on card components
    const headers = [
      'Name',
      'Current Role',
      'LinkedIn URL',
      'Profile Image URL',
      'Professional Background',
      'Key Achievements',
      'Expertise Areas',
      'Career History',
      'Education',
      'Languages'
    ]

    // Convert data to CSV rows
    const rows = completedEntries.map(entry => {
      const data = entry.combinedData!
      return [
        data.name,
        data.currentRole,
        data.linkedinURL,
        entry.profileImage || data.profilePhoto, // Use the selected profile image
        data.professionalBackground,
        data.keyAchievements.join('|'),
        data.expertiseAreas.join('|'),
        data.careerHistory.map(h => 
          `${h.title} at ${h.company} (${h.duration}): ${h.highlights.join('; ')}`
        ).join('|'),
        data.education ? data.education.map(e => 
          `${e.degree} from ${e.institution} (${e.year})`
        ).join('|') : '',
        data.languages ? data.languages.map(l => 
          `${l.language} - ${l.proficiency}`
        ).join('|') : ''
      ]
    })

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(cell => 
          // Escape special characters and wrap in quotes if needed
          typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n')) 
            ? `"${cell.replace(/"/g, '""')}"` 
            : cell
        ).join(',')
      )
    ].join('\n')

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `people_cards_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Add a new function to handle image selection feedback
  const handleImageSelect = async (entryId: string, imageUrl: string) => {
    // First update the UI
    setEntriesToProcess(current =>
      current.map(e =>
        e.id === entryId ? {
          ...e,
          profileImage: imageUrl,
          combinedData: e.combinedData ? {
            ...e.combinedData,
            profilePhoto: imageUrl
          } : null,
          imageSelectionFeedback: true
        } : e
      )
    )

    // Find the entry
    const entry = [...entriesToProcess, ...processedEntries].find(e => e.id === entryId)
    if (!entry || !entry.combinedData || !projectName) return

    // Update the database - keep profile_image_options but update the main profile photo
    try {
      const response = await fetch('/api/save-people-cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_name: projectName,
          people: [{
            ...entry.combinedData,
            profilePhoto: imageUrl,
            profile_image_options: entry.profileImageOptions  // Keep all image options
          }]
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update profile image')
      }

      toast.success('Profile image updated')
    } catch (error) {
      console.error('Error updating profile image:', error)
      toast.error('Failed to update profile image')
    }

    // Remove the feedback after a short delay
    setTimeout(() => {
      setEntriesToProcess(current =>
        current.map(e =>
          e.id === entryId ? {
            ...e,
            imageSelectionFeedback: false
          } : e
        )
      )
    }, 2000)
  }

  // Update the EditableCard component type definition
  const EditableCard = ({ 
    data, 
    onSave,
    onDelete,
    projectName,
    imageOptions 
  }: { 
    data: Omit<PersonCard, 'id'> & { id?: string | number },
    onSave: (updatedData: PersonCard) => void,
    onDelete: () => void,
    projectName: string | undefined,
    imageOptions?: string[]
  }) => {
    const [isEditing, setIsEditing] = useState(false)
    // Initialize editedData with default values for optional fields
    const [editedData, setEditedData] = useState({
      ...data,
      keyAchievements: data.keyAchievements || [],
      careerHistory: data.careerHistory || [],
      expertiseAreas: data.expertiseAreas || [],
      professionalBackground: data.professionalBackground || '',
      currentRole: data.currentRole || '',
      conciseRole: data.conciseRole || '',
      linkedinURL: data.linkedinURL || '',
      profilePhoto: data.profilePhoto || ''
    })
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    // Convert the data to the correct type for ProfileCard
    const profileCardData: PersonCard = {
      ...data,
      id: data.id ? (typeof data.id === 'string' ? parseInt(data.id) : data.id) : undefined
    }

    const handleSave = async () => {
      if (!projectName) {
        toast.error('No project name set')
        return
      }

      setIsSaving(true)
      try {
        // Convert editedData to PersonCard type and include profile image options
        const cardToSave: PersonCard = {
          ...editedData,
          id: editedData.id ? (typeof editedData.id === 'string' ? parseInt(editedData.id) : editedData.id) : undefined,
          profile_image_options: imageOptions || []  // Include image options in save data
        }

        const response = await fetch('/api/save-people-cards', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            project_name: projectName,
            people: [cardToSave]
          })
        })

        if (!response.ok) {
          throw new Error('Failed to save changes')
        }

        onSave(cardToSave)
        setIsEditing(false)
        toast.success('Changes saved successfully')
      } catch (error) {
        console.error('Error saving changes:', error)
        toast.error('Failed to save changes')
      } finally {
        setIsSaving(false)
      }
    }

    const handleDelete = async () => {
      if (!projectName || !data.id) {
        toast.error('Cannot delete card: Missing project name or card ID')
        return
      }

      setIsDeleting(true)
      try {
        const response = await fetch(`/api/delete-card?project_name=${encodeURIComponent(projectName)}&card_id=${data.id}`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          throw new Error('Failed to delete card')
        }

        onDelete()
        toast.success('Card deleted successfully')
      } catch (error) {
        console.error('Error deleting card:', error)
        toast.error('Failed to delete card')
      } finally {
        setIsDeleting(false)
      }
    }

    if (!isEditing) {
      return (
        <Card className="p-6 relative">
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <EditIcon className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Minus className="w-4 h-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </div>
          <ProfileCard data={profileCardData} />
        </Card>
      )
    }

    return (
      <Card className="p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={editedData.name || ''}
                onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
                className="capitalize"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Profile Image URL</label>
              <Input
                value={editedData.profilePhoto || ''}
                onChange={(e) => setEditedData({ ...editedData, profilePhoto: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
              {imageOptions && imageOptions.length > 0 && (
                <div className="mt-2">
                  <label className="text-sm font-medium">Available Profile Images</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                    {imageOptions.map((imageUrl: string, index: number) => (
                      <div 
                        key={index}
                        className={`relative cursor-pointer rounded-lg overflow-hidden border-2 ${
                          imageUrl === editedData.profilePhoto ? 'border-primary' : 'border-transparent'
                        }`}
                        onClick={() => setEditedData({ ...editedData, profilePhoto: imageUrl })}
                      >
                        <Image
                          src={imageUrl}
                          alt={`Profile option ${index + 1}`}
                          width={100}
                          height={100}
                          className="w-full h-full object-cover aspect-square"
                          unoptimized
                        />
                        {imageUrl === editedData.profilePhoto && (
                          <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                            <Check className="w-6 h-6 text-primary" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Current Role</label>
              <Input
                value={editedData.currentRole || ''}
                onChange={(e) => setEditedData({ ...editedData, currentRole: e.target.value })}
                className="capitalize"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Concise Role</label>
              <Input
                value={editedData.conciseRole || ''}
                onChange={(e) => setEditedData({ ...editedData, conciseRole: e.target.value })}
                className="capitalize"
              />
            </div>
            <div>
              <label className="text-sm font-medium">LinkedIn URL</label>
              <Input
                value={editedData.linkedinURL || ''}
                onChange={(e) => setEditedData({ ...editedData, linkedinURL: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Professional Background</label>
            <Textarea
              value={editedData.professionalBackground || ''}
              onChange={(e) => setEditedData({ ...editedData, professionalBackground: e.target.value })}
              rows={4}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Key Achievements</label>
            <div className="space-y-2">
              {(editedData.keyAchievements || []).map((achievement, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={achievement}
                    onChange={(e) => {
                      const newAchievements = [...editedData.keyAchievements]
                      newAchievements[index] = e.target.value
                      setEditedData({ ...editedData, keyAchievements: newAchievements })
                    }}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const newAchievements = editedData.keyAchievements.filter((_, i) => i !== index)
                      setEditedData({ ...editedData, keyAchievements: newAchievements })
                    }}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => {
                  setEditedData({
                    ...editedData,
                    keyAchievements: [...(editedData.keyAchievements || []), '']
                  })
                }}
              >
                Add Achievement
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Career History</label>
            <div className="space-y-4">
              {(editedData.careerHistory || []).map((history, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium">Title</label>
                        <Input
                          value={history.title}
                          onChange={(e) => {
                            const newHistory = [...editedData.careerHistory]
                            newHistory[index] = { ...history, title: e.target.value }
                            setEditedData({ ...editedData, careerHistory: newHistory })
                          }}
                          className="capitalize"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Company</label>
                        <Input
                          value={history.company}
                          onChange={(e) => {
                            const newHistory = [...editedData.careerHistory]
                            newHistory[index] = { ...history, company: e.target.value }
                            setEditedData({ ...editedData, careerHistory: newHistory })
                          }}
                          className="capitalize"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Duration</label>
                        <Input
                          value={history.duration}
                          onChange={(e) => {
                            const newHistory = [...editedData.careerHistory]
                            newHistory[index] = { ...history, duration: e.target.value }
                            setEditedData({ ...editedData, careerHistory: newHistory })
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Highlights</label>
                      <div className="space-y-2">
                        {history.highlights.map((highlight, hIndex) => (
                          <div key={hIndex} className="flex gap-2">
                            <Input
                              value={highlight}
                              onChange={(e) => {
                                const newHistory = [...editedData.careerHistory]
                                newHistory[index] = {
                                  ...history,
                                  highlights: history.highlights.map((h, i) =>
                                    i === hIndex ? e.target.value : h
                                  )
                                }
                                setEditedData({ ...editedData, careerHistory: newHistory })
                              }}
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                const newHistory = [...editedData.careerHistory]
                                newHistory[index] = {
                                  ...history,
                                  highlights: history.highlights.filter((_, i) => i !== hIndex)
                                }
                                setEditedData({ ...editedData, careerHistory: newHistory })
                              }}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          onClick={() => {
                            const newHistory = [...editedData.careerHistory]
                            newHistory[index] = {
                              ...history,
                              highlights: [...history.highlights, '']
                            }
                            setEditedData({ ...editedData, careerHistory: newHistory })
                          }}
                        >
                          Add Highlight
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        const newHistory = editedData.careerHistory.filter((_, i) => i !== index)
                        setEditedData({ ...editedData, careerHistory: newHistory })
                      }}
                    >
                      Remove Position
                    </Button>
                  </div>
                </Card>
              ))}
              <Button
                variant="outline"
                onClick={() => {
                  setEditedData({
                    ...editedData,
                    careerHistory: [...(editedData.careerHistory || []), {
                      title: '',
                      company: '',
                      duration: '',
                      highlights: []
                    }]
                  })
                }}
              >
                Add Position
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Expertise Areas</label>
            <div className="space-y-2">
              {(editedData.expertiseAreas || []).map((area, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={area}
                    onChange={(e) => {
                      const newAreas = [...editedData.expertiseAreas]
                      newAreas[index] = e.target.value
                      setEditedData({ ...editedData, expertiseAreas: newAreas })
                    }}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const newAreas = editedData.expertiseAreas.filter((_, i) => i !== index)
                      setEditedData({ ...editedData, expertiseAreas: newAreas })
                    }}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => {
                  setEditedData({
                    ...editedData,
                    expertiseAreas: [...(editedData.expertiseAreas || []), '']
                  })
                }}
              >
                Add Expertise Area
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || isSaving}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Minus className="mr-2 h-4 w-4" />
                  Delete Card
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              disabled={isSaving || isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || isDeleting}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  const handleSaveCards = async (cards: PersonCard[]) => {
    if (!projectName) {
      toast.error('Please select a project first')
      return
    }

    try {
      // First try to save the cards
      const response = await fetch('/api/save-people-cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_name: projectName,
          people: cards
        })
      })

      if (!response.ok) {
        // If it fails because project doesn't exist, create it first
        if (response.status === 404) {
          // Create project
          const createProjectResponse = await fetch('/api/create-project', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: projectName,
            })
          });

          if (!createProjectResponse.ok) {
            throw new Error('Failed to create project');
          }

          // Try saving cards again
          const retryResponse = await fetch('/api/save-people-cards', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              project_name: projectName,
              people: cards
            })
          });

          if (!retryResponse.ok) {
            throw new Error('Failed to save cards after creating project');
          }
        } else {
          throw new Error('Failed to save cards');
        }
      }

      toast.success('Cards saved successfully')
    } catch (error) {
      console.error('Error saving cards:', error)
      toast.error('Failed to save cards')
    }
  }

  return (
    <div className="space-y-8">
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            {isCreatingNewProject ? (
              <div className="flex items-center gap-4 w-full">
                <Input
                  placeholder="Enter new project name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-[250px]"
                />
                <Button
                  onClick={handleCreateNewProject}
                  disabled={!isValidProjectName(newProjectName)}
                >
                  Create Project
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setIsCreatingNewProject(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : projectName ? (
              <div className="flex items-center gap-4">
                <div className="text-lg font-semibold">
                  Project: {projectName}
                </div>
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (onProjectChange) {
                      onProjectChange("");
                    }
                  }}
                >
                  Clear Project
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <ProjectSelector 
                  value={projectName} 
                  onChange={(value) => {
                    if (onProjectChange) {
                      onProjectChange(value)
                    }
                  }}
                  disabled={disabled || isProcessing} 
                />
              </div>
            )}
            {isLoadingProject && (
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading project...
              </div>
            )}
          </div>

          {(projectName || isCreatingNewProject) && (
            <>
              <div className="grid grid-cols-1 gap-4">
                <div className="relative">
                  <Textarea
                    placeholder="Paste CSV/spreadsheet data here (Name, Company)&#10;Example:&#10;Amir Jaffari, Shopify&#10;Jane Smith, Tech Corp"
                    className="min-h-[100px]"
                    onChange={(e) => {
                      const text = e.target.value
                      if (text) {
                        handleBulkPaste(text)
                        e.target.value = '' // Clear after processing
                      }
                    }}
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                    Paste and it will automatically add to the table
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      {(entriesToProcess.length > 0 || processedEntries.length > 0) && (
        <div className="space-y-8">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">
                {entriesToProcess.length > 0 ? `People to Process (${entriesToProcess.length})` : 'Project Cards'}
              </h2>
              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  onClick={handleExportCSV}
                  className="w-40"
                  disabled={!entriesToProcess.some(e => e.combinedData)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                <Button
                  onClick={handleProcessAll}
                  disabled={isProcessing || entriesToProcess.every(e => 
                    (!e.runRocketReach || e.status.rocketreach === 'completed') &&
                    (!e.runPerplexity || e.status.perplexity === 'completed') &&
                    (!e.runProfileImage || e.status.profileImage === 'completed') &&
                    (!e.runLinkedin || e.status.linkedin === 'completed') &&
                    (!e.runOpenAI || e.status.openai === 'completed')
                  )}
                  className="w-40"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : 'Process All'}
                </Button>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>APIs to Run</TableHead>
                  <TableHead>Data Progress</TableHead>
                  <TableHead>Card Generation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entriesToProcess.map((entry) => (
                  <React.Fragment key={entry.id}>
                    <TableRow 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleRowExpansion(entry.id)}
                    >
                      <TableCell>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {entry.profileImage && (
                              <Image 
                                src={entry.profileImage} 
                                alt={`${entry.name}'s profile`}
                                className="w-10 h-10 rounded-full object-cover"
                                width={40}
                                height={40}
                                unoptimized
                              />
                            )}
                            <div>
                              <span className="font-medium capitalize">{entry.name}</span>
                              <span className="text-sm text-gray-500 block capitalize">{entry.company}</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleRowExpansion(entry.id)
                            }}
                            className="h-8 w-8 p-0"
                          >
                            {expandedRows.has(entry.id) ? (
                              <Minus className="h-4 w-4" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={entry.runRocketReach}
                              onChange={() => toggleAPI(entry.id, 'rocketreach')}
                              disabled={entry.status.rocketreach !== 'pending'}
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span>RocketReach</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={entry.runPerplexity}
                              onChange={() => toggleAPI(entry.id, 'perplexity')}
                              disabled={entry.status.perplexity !== 'pending'}
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span>Perplexity</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={entry.runProfileImage}
                              onChange={() => toggleAPI(entry.id, 'profileImage')}
                              disabled={entry.status.profileImage !== 'pending'}
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span>Profile Image</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={entry.runLinkedin}
                              onChange={() => toggleAPI(entry.id, 'linkedin')}
                              disabled={entry.status.linkedin !== 'pending'}
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span>LinkedIn URL</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={entry.runOpenAI}
                              onChange={() => toggleAPI(entry.id, 'openai')}
                              disabled={entry.status.openai !== 'pending'}
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span>OpenAI</span>
                          </label>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {entry.runRocketReach && (
                            <div 
                              className={`flex items-center ${getStatusColor(entry.status.rocketreach)}`}
                              title={`RocketReach: ${entry.status.rocketreach}`}
                            >
                              <span className={`text-lg transition-opacity duration-200 ${
                                entry.status.rocketreach === 'completed' ? 'opacity-100' : 'opacity-20'
                              }`}>
                                {STATUS_EMOJIS.rocketreach}
                                {entry.status.rocketreach === 'processing' && (
                                  <Loader2 className="ml-1 h-3 w-3 animate-spin inline" />
                                )}
                              </span>
                            </div>
                          )}
                          {entry.runPerplexity && (
                            <div 
                              className={`flex items-center ${getStatusColor(entry.status.perplexity)}`}
                              title={`Perplexity: ${entry.status.perplexity}`}
                            >
                              <span className={`text-lg transition-opacity duration-200 ${
                                entry.status.perplexity === 'completed' ? 'opacity-100' : 'opacity-20'
                              }`}>
                                {STATUS_EMOJIS.perplexity}
                                {entry.status.perplexity === 'processing' && (
                                  <Loader2 className="ml-1 h-3 w-3 animate-spin inline" />
                                )}
                              </span>
                            </div>
                          )}
                          {entry.runProfileImage && (
                            <div 
                              className={`flex items-center ${getStatusColor(entry.status.profileImage)}`}
                              title={`Profile Image: ${entry.status.profileImage}`}
                            >
                              <span className={`text-lg transition-opacity duration-200 ${
                                entry.status.profileImage === 'completed' ? 'opacity-100' : 'opacity-20'
                              }`}>
                                {STATUS_EMOJIS.profileImage}
                                {entry.status.profileImage === 'processing' && (
                                  <Loader2 className="ml-1 h-3 w-3 animate-spin inline" />
                                )}
                              </span>
                            </div>
                          )}
                          {entry.runLinkedin && (
                            <div 
                              className={`flex items-center ${getStatusColor(entry.status.linkedin)}`}
                              title={`LinkedIn: ${entry.status.linkedin}`}
                            >
                              <span className={`text-lg transition-opacity duration-200 ${
                                entry.status.linkedin === 'completed' ? 'opacity-100' : 'opacity-20'
                              }`}>
                                {STATUS_EMOJIS.linkedin}
                                {entry.status.linkedin === 'processing' && (
                                  <Loader2 className="ml-1 h-3 w-3 animate-spin inline" />
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {entry.runOpenAI && (
                            <div 
                              className={`flex items-center ${getStatusColor(entry.status.openai)}`}
                              title={`OpenAI: ${entry.status.openai}`}
                            >
                              <span className={`text-lg transition-opacity duration-200 ${
                                entry.status.openai === 'completed' ? 'opacity-100' : 'opacity-20'
                              }`}>
                                {STATUS_EMOJIS.openai}
                                {entry.status.openai === 'processing' && (
                                  <Loader2 className="ml-1 h-3 w-3 animate-spin inline" />
                                )}
                              </span>
                              <span className="ml-2 text-sm">
                                {entry.status.openai === 'completed' ? 'Card Ready' : 
                                 entry.status.openai === 'processing' ? 'Generating...' :
                                 entry.status.openai === 'error' ? 'Failed' :
                                 'Waiting'}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    {/* Expanded Content */}
                    {expandedRows.has(entry.id) && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-gray-50 p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-sm">Raw Data</h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRowExpansion(entry.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            {/* RocketReach Data */}
                            {entry.result && (
                              <div className="space-y-2">
                                <h3 className="font-semibold text-sm">RocketReach Data</h3>
                                <div className="bg-white rounded-md p-4 shadow-sm">
                                  <pre className="text-xs whitespace-pre-wrap">
                                    {entry.result}
                                  </pre>
                                </div>
                              </div>
                            )}
                            
                            {/* Perplexity Data */}
                            {entry.perplexityResult && (
                              <div className="space-y-2">
                                <h3 className="font-semibold text-sm">Perplexity Data</h3>
                                <div className="bg-white rounded-md p-4 shadow-sm">
                                  <pre className="text-xs whitespace-pre-wrap">
                                    {JSON.stringify(entry.perplexityResult, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </Card>

          <div className="space-y-4">
            <Tabs defaultValue="minimal" className="w-full">
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="minimal" className="flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4" />
                    Minimal View
                  </TabsTrigger>
                  <TabsTrigger value="expanded" className="flex items-center gap-2">
                    <LayoutList className="w-4 h-4" />
                    Expanded View
                  </TabsTrigger>
                  <TabsTrigger value="edit" className="flex items-center gap-2">
                    <EditIcon className="w-4 h-4" />
                    Edit View
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="minimal" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...processedEntries, ...entriesToProcess]
                    .filter((entry): entry is Entry & { combinedData: NonNullable<Entry['combinedData']> } => 
                      entry.combinedData !== null && entry.combinedData !== undefined
                    )
                    .map((entry) => (
                      <MinimalProfileCard 
                        key={entry.id}
                        data={{
                          id: entry.databaseId ? parseInt(entry.databaseId.toString()) : undefined,
                          name: entry.name,
                          profilePhoto: entry.profile_photo || entry.profileImage || entry.combinedData.profilePhoto || '',
                          linkedinURL: entry.linkedinUrl || entry.combinedData.linkedinURL || '',
                          currentRole: entry.combinedData.currentRole || '',
                          conciseRole: entry.combinedData.conciseRole || entry.combinedData.currentRole || '',
                          keyAchievements: entry.combinedData.keyAchievements || [],
                          professionalBackground: entry.combinedData.professionalBackground || '',
                          careerHistory: entry.combinedData.careerHistory || [],
                          expertiseAreas: entry.combinedData.expertiseAreas || [],
                          profile_image_options: entry.profileImageOptions || [],
                          citations: entry.combinedData.citations || {}
                        }}
                        projectName={projectName || ''}
                        onDelete={() => {
                          if (processedEntries.find(e => e.id === entry.id)) {
                            setProcessedEntries(current =>
                              current.filter(e => e.id !== entry.id)
                            )
                          } else {
                            setEntriesToProcess(current =>
                              current.filter(e => e.id !== entry.id)
                            )
                          }
                        }}
                        onImageSelect={(imageUrl) => handleImageSelect(entry.id, imageUrl)}
                      />
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="expanded" className="mt-0">
                <div className="grid grid-cols-1 gap-8">
                  {[...processedEntries, ...entriesToProcess]
                    .filter((entry): entry is Entry & { combinedData: NonNullable<Entry['combinedData']> } => 
                      entry.combinedData !== null && entry.combinedData !== undefined
                    )
                    .map((entry) => (
                      <NiceCard
                        key={entry.id}
                        data={{
                          id: entry.databaseId ? parseInt(entry.databaseId.toString()) : undefined,
                          name: entry.name,
                          profilePhoto: entry.profile_photo || entry.profileImage || entry.combinedData.profilePhoto || '',
                          linkedinURL: entry.linkedinUrl || entry.combinedData.linkedinURL || '',
                          currentRole: entry.combinedData.currentRole || '',
                          conciseRole: entry.combinedData.conciseRole || entry.combinedData.currentRole || '',
                          keyAchievements: entry.combinedData.keyAchievements || [],
                          professionalBackground: entry.combinedData.professionalBackground || '',
                          careerHistory: entry.combinedData.careerHistory || [],
                          expertiseAreas: entry.combinedData.expertiseAreas || [],
                          profile_image_options: entry.profileImageOptions || [],
                          citations: entry.combinedData.citations || {}  // Make sure citations are passed correctly
                        }}
                        projectName={projectName || ''}
                        onDelete={() => {
                          if (processedEntries.find(e => e.id === entry.id)) {
                            setProcessedEntries(current =>
                              current.filter(e => e.id !== entry.id)
                            )
                          } else {
                            setEntriesToProcess(current =>
                              current.filter(e => e.id !== entry.id)
                            )
                          }
                        }}
                        onImageSelect={(imageUrl) => handleImageSelect(entry.id, imageUrl)}
                      />
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="edit" className="mt-0">
                <div className="grid grid-cols-1 gap-8">
                  {(processedEntries.length > 0 || entriesToProcess.length > 0) ? (
                    <>
                      {processedEntries
                        .filter((entry): entry is Entry & { combinedData: NonNullable<Entry['combinedData']> } => 
                          entry.combinedData !== null && entry.combinedData !== undefined
                        )
                        .map((entry) => (
                          <EditableCard
                            key={entry.id}
                            data={{
                              id: entry.id,
                              ...entry.combinedData,
                              profilePhoto: entry.profileImage || entry.combinedData.profilePhoto,
                              linkedinURL: entry.linkedinUrl || entry.combinedData.linkedinURL
                            }}
                            onSave={(updatedData) => {
                              setEntriesToProcess(current =>
                                current.map(e =>
                                  e.id === entry.id ? {
                                    ...e,
                                    combinedData: updatedData
                                  } : e
                                )
                              )
                            }}
                            onDelete={() => {
                              setEntriesToProcess(current =>
                                current.filter(e => e.id !== entry.id)
                              )
                            }}
                            projectName={projectName}
                            imageOptions={entry.profileImageOptions}
                          />
                        ))}
                      {entriesToProcess
                        .filter((entry): entry is Entry & { combinedData: NonNullable<Entry['combinedData']> } => 
                          entry.combinedData !== null && entry.combinedData !== undefined
                        )
                        .map((entry) => (
                          <EditableCard
                            key={entry.id}
                            data={{
                              id: entry.id,
                              ...entry.combinedData,
                              profilePhoto: entry.profileImage || entry.combinedData.profilePhoto,
                              linkedinURL: entry.linkedinUrl || entry.combinedData.linkedinURL
                            }}
                            onSave={(updatedData) => {
                              setEntriesToProcess(current =>
                                current.map(e =>
                                  e.id === entry.id ? {
                                    ...e,
                                    combinedData: updatedData
                                  } : e
                                )
                              )
                            }}
                            onDelete={() => {
                              setEntriesToProcess(current =>
                                current.filter(e => e.id !== entry.id)
                              )
                            }}
                            projectName={projectName}
                            imageOptions={entry.profileImageOptions}
                          />
                        ))}
                    </>
                  ) : (
                    projectName && !isLoadingProject && (
                      <div className="text-center py-8 text-gray-500">
                        No cards found in this project
                      </div>
                    )
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  )
} 