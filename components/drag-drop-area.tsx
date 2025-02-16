"use client"

import { useState, useRef } from "react"
import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Loader2, Download, Plus, Minus } from "lucide-react"
import React from "react"
import { ProfileCard } from "./profile-card"
import { Textarea } from "./ui/textarea"
import { SerperOrganicResult, PerplexityResponse } from '../types/api'
import Image from 'next/image'
import { LinkedinIcon } from "lucide-react"

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
  profileImageOptions?: string[]
  selectedImageIndex?: number
  linkedinUrl?: string | null
  imageSelectionFeedback?: boolean
  combinedData?: {
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
  education?: {
    degree: string
    institution: string
    year: string
  }[]
  languages?: {
    language: string
    proficiency: string
  }[]
}

interface MainAPIResult {
  rocketReachData: string | null
  perplexityData: PerplexityResponse | null
  profileImage: string | null
  linkedinUrl: string | null
  combinedData: OpenAIResponse | null
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

export default function DragDropArea() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [currentName, setCurrentName] = useState("Amir Jaffari")
  const [currentCompany, setCurrentCompany] = useState("Shopify")
  const [isProcessing, setIsProcessing] = useState(false)
  const lastRequestTime = useRef<number>(0)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const handleAddEntry = () => {
    if (currentName && currentCompany) {
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
      setEntries([...entries, newEntry])
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

    setEntries(current => [...current, ...newEntries])
  }

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const toggleAPI = (entryId: string, api: 'rocketreach' | 'perplexity' | 'profileImage' | 'linkedin' | 'openai') => {
    setEntries(current =>
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

  const fetchProfileImage = async (name: string, company: string): Promise<{ mainImage: string | null, allImages: string[] }> => {
    try {
      const response = await fetch("/api/serper", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          searchType: 'images',
          query: `${name} ${company}`
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json() as SerperResponse;
      
      // Find up to 4 square images
      const squareImages = data.images?.filter(image => 
        image.imageWidth === image.imageHeight
      ).slice(0, 4).map(image => image.imageUrl) || [];

      return {
        mainImage: squareImages[0] || null,
        allImages: squareImages
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

  const processEntry = async (entry: Entry): Promise<MainAPIResult> => {
    try {
      // First batch: Run main APIs in parallel
      const mainPromises = []
      const mainPromiseTypes: ('rocketreach' | 'perplexity')[] = []
      
      if (entry.runRocketReach) {
        mainPromises.push(
          processRocketReach(entry).then(result => {
            // Update RocketReach result immediately
            setEntries(current =>
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
            // Update Perplexity result immediately
            setEntries(current =>
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

      // Second batch: Run Serper APIs in sequence (they're quick)
      const serperPromises = []
      const serperPromiseTypes: ('serper')[] = []
      
      if (entry.runProfileImage || entry.runLinkedin) {
        const serperCalls = async () => {
          const results: ProcessedResults = {}
          if (entry.runProfileImage) {
            try {
              const { mainImage, allImages } = await fetchProfileImage(entry.name, entry.company)
              // Update profile image immediately
              setEntries(current =>
                current.map(e =>
                  e.id === entry.id ? {
                    ...e,
                    profileImage: mainImage,
                    profileImageOptions: allImages,
                    selectedImageIndex: 0,
                    status: { ...e.status, profileImage: 'completed' }
                  } : e
                )
              )
              results['profileImage'] = mainImage
            } catch (error) {
              setEntries(current =>
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
              // Update LinkedIn URL immediately
              setEntries(current =>
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
              setEntries(current =>
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
      setEntries(current =>
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

      // Run all API calls in parallel
      const [mainResults, serperResults] = await Promise.all([
        Promise.allSettled(mainPromises),
        Promise.allSettled(serperPromises)
      ])
      
      // Process results from all APIs
      const processedResults: ProcessedResults = {}
      
      // Process main API results
      mainResults.forEach((result, index) => {
        const apiType = mainPromiseTypes[index]
        if (result.status === 'fulfilled') {
          if (apiType === 'rocketreach') {
            processedResults.rocketreach = result.value as string || null
          } else if (apiType === 'perplexity') {
            processedResults.perplexity = result.value as PerplexityResponse || null
          }
        } else {
          setEntries(current =>
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
        } else {
          if (entry.runProfileImage) {
            setEntries(current =>
              current.map(e =>
                e.id === entry.id ? {
                  ...e,
                  status: { ...e.status, profileImage: 'error' },
                  error: { ...e.error, profileImage: result.reason?.message || 'Failed to fetch profile image' }
                } : e
              )
            )
          }
          if (entry.runLinkedin) {
            setEntries(current =>
              current.map(e =>
                e.id === entry.id ? {
                  ...e,
                  status: { ...e.status, linkedin: 'error' },
                  error: { ...e.error, linkedin: result.reason?.message || 'Failed to fetch LinkedIn URL' }
                } : e
              )
            )
          }
        }
      })

      // Only call OpenAI if selected
      if (entry.runOpenAI) {
        try {
          setEntries(current =>
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
              company: entry.company
            })
          })

          if (!response.ok) {
            throw new Error('OpenAI API request failed')
          }

          const combinedData = await response.json() as OpenAIResponse
          console.log('OpenAI API response:', combinedData)
          
          // Update entry with combined data immediately
          setEntries(current => {
            const newEntries = current.map(e =>
              e.id === entry.id ? {
                ...e,
                combinedData: {
                  ...combinedData,
                  name: entry.name
                },
                status: { ...e.status, openai: 'completed' as const }
              } : e
            )
            console.log('Updated entries:', newEntries)
            return newEntries
          })
          
          processedResults.openai = {
            ...combinedData,
            name: entry.name
          }
        } catch (error) {
          console.error('OpenAI Error:', error)
          setEntries(current =>
            current.map(e =>
              e.id === entry.id ? {
                ...e,
                status: { ...e.status, openai: 'error' },
                error: { ...e.error, openai: error instanceof Error ? error.message : 'OpenAI processing failed' }
              } : e
            )
          )
        }
      }

      return {
        rocketReachData: processedResults.rocketreach || null,
        perplexityData: processedResults.perplexity || null,
        profileImage: processedResults.profileImage || null,
        linkedinUrl: processedResults.linkedin || null,
        combinedData: processedResults.openai || null
      }
    } catch (error) {
      console.error("Error processing entry:", error)
      throw error
    }
  }

  const processRocketReach = async (entry: Entry) => {
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
        console.error('Missing markdown in response. Full response:', scrapeResult)
        throw new Error('No markdown content in response')
      }

      return markdownContent
    } catch (error) {
      console.error('Error processing RocketReach:', error)
      return '(RocketReach API error - data unavailable)'
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
            content: `Find information about ${entry.name} who works at ${entry.company}. Return the information in this exact JSON structure. Include at least 3-5 expertise areas, and provide a detailed professional background covering their career progression: { currentRole: "string - detailed current position", keyAchievements: [ string - notable accomplishments in current and past roles ], professionalBackground: "string - comprehensive career narrative", careerHistory: [ { title: "string - job title", company: "string - company name", duration: "string - time period", highlights: [ string - key responsibilities and achievements ] } ], expertiseAreas: [ string - 3 to 5 specific areas of expertise ] }`
          }]
        })
      })

      const responseData = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Perplexity API credits exhausted. Please check your account.')
        }
        throw new Error(responseData.error || 'API request failed')
      }

      if (!responseData.choices?.[0]?.message?.content) {
        throw new Error('No content in response')
      }

      const content = responseData.choices[0].message.content

      try {
        return JSON.parse(content)
      } catch {
        console.log('Direct JSON parse failed, trying to extract from markdown...')
        
        const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[1])
          } catch {
            console.error('Failed to parse JSON from markdown:', jsonMatch[1])
            throw new Error('Failed to parse JSON from markdown response')
          }
        }

        const possibleJson = content.match(/\{[\s\S]*\}/)
        if (possibleJson) {
          try {
            return JSON.parse(possibleJson[0])
          } catch {
            console.error('Failed to parse JSON structure:', possibleJson[0])
            throw new Error('Failed to parse JSON structure from response')
          }
        }

        console.error('Failed to parse response:', content)
        throw new Error('Could not extract valid JSON from response')
      }
    } catch (error) {
      console.error('Error in processPerplexity:', error)
      setEntries(current =>
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
      throw error
    }
  }

  const handleProcessAll = async () => {
    console.log('Starting to process all entries')
    setIsProcessing(true)
    
    try {
      const pendingEntries = entries.filter(e => 
        (e.runRocketReach && e.status.rocketreach === 'pending') || 
        (e.runPerplexity && e.status.perplexity === 'pending') ||
        (e.runProfileImage && e.status.profileImage === 'pending') ||
        (e.runLinkedin && e.status.linkedin === 'pending') ||
        (e.runOpenAI && e.status.openai === 'pending')
      )
      console.log('Found pending entries:', pendingEntries.length)
      
      // Process one person at a time
      for (const entry of pendingEntries) {
        console.log('Processing entry:', entry.name)
        
        try {
          const result = await processEntry(entry)
          console.log('Successfully processed entry:', entry.name)
          
          // Update entry with results and completed status
          setEntries(current => 
            current.map(e => 
              e.id === entry.id ? {
                ...e,
                result: result.rocketReachData,
                perplexityResult: result.perplexityData,
                profileImage: result.profileImage,
                linkedinUrl: result.linkedinUrl,
                combinedData: result.combinedData,
                status: {
                  rocketreach: e.runRocketReach ? 'completed' : e.status.rocketreach,
                  perplexity: e.runPerplexity ? 'completed' : e.status.perplexity,
                  profileImage: e.runProfileImage ? 'completed' : e.status.profileImage,
                  linkedin: e.runLinkedin ? 'completed' : e.status.linkedin,
                  openai: e.runOpenAI ? 'completed' : e.status.openai
                }
              } : e
            )
          )

          // Add a small delay between processing each person
          await delay(1000)
        } catch (error) {
          console.error('Error processing entry:', entry.name, error)
          // Continue with next person even if one fails
        }
      }
    } catch (error) {
      console.error('Error in handleProcessAll:', error)
    } finally {
      console.log('Finished processing all entries')
      setIsProcessing(false)
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
    const completedEntries = entries.filter(e => e.combinedData)
    
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
  const handleImageSelect = (entryId: string, imageUrl: string) => {
    setEntries(current =>
      current.map(e =>
        e.id === entryId ? {
          ...e,
          profileImage: imageUrl,
          combinedData: e.combinedData ? {
            ...e.combinedData,
            profilePhoto: imageUrl
          } : null,
          // Add a temporary flag for feedback
          imageSelectionFeedback: true
        } : e
      )
    )

    // Remove the feedback after a short delay
    setTimeout(() => {
      setEntries(current =>
        current.map(e =>
          e.id === entryId ? {
            ...e,
            imageSelectionFeedback: false
          } : e
        )
      )
    }, 2000)
  }

  return (
    <div className="space-y-8">
      <Card className="p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Name"
                value={currentName}
                onChange={(e) => setCurrentName(e.target.value)}
              />
              <Input
                placeholder="Company"
                value={currentCompany}
                onChange={(e) => setCurrentCompany(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <Textarea
                placeholder="Or paste CSV/spreadsheet data here (Name, Company)&#10;Example:&#10;John Doe, Acme Inc&#10;Jane Smith, Tech Corp"
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

          <div className="flex justify-end space-x-4">
            <Button 
              variant="secondary"
              onClick={handleAddEntry}
              disabled={!currentName || !currentCompany}
            >
              Add Single Entry
            </Button>
          </div>
        </div>
      </Card>

      {entries.length > 0 && (
        <div className="space-y-8">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">People to Process ({entries.length})</h2>
              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  onClick={handleExportCSV}
                  className="w-40"
                  disabled={!entries.some(e => e.combinedData)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                <Button
                  onClick={handleProcessAll}
                  disabled={isProcessing || entries.every(e => 
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
                {entries.map((entry) => (
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
                              <span className="font-medium">{entry.name}</span>
                              <span className="text-sm text-gray-500 block">{entry.company}</span>
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
                          {(['rocketreach', 'perplexity', 'profileImage', 'linkedin'] as Array<keyof typeof STATUS_EMOJIS>).map((api) => (
                            entry[`run${api.charAt(0).toUpperCase() + api.slice(1)}` as keyof Entry] && (
                              <div 
                                key={api}
                                className={`flex items-center ${getStatusColor(entry.status[api])}`}
                                title={`${api.charAt(0).toUpperCase() + api.slice(1)}: ${entry.status[api]}`}
                              >
                                <span className={`text-lg transition-opacity duration-200 ${
                                  entry.status[api] === 'completed' ? 'opacity-100' : 'opacity-20'
                                }`}>
                                  {STATUS_EMOJIS[api]}
                                  {entry.status[api] === 'processing' && (
                                    <Loader2 className="ml-1 h-3 w-3 animate-spin inline" />
                                  )}
                                </span>
                              </div>
                            )
                          ))}
                          {entry.linkedinUrl && (
                            <a 
                              href={entry.linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline ml-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <LinkedinIcon className="w-4 h-4" />
                            </a>
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
                            <h3 className="font-semibold">Raw Data</h3>
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

          <div className="grid grid-cols-1 gap-8">
            {entries.map((entry) => (
              entry.combinedData && (
                <div key={entry.id} className="w-full relative">
                  {entry.imageSelectionFeedback && (
                    <div className="absolute top-4 right-4 bg-green-100 text-green-800 px-4 py-2 rounded-md shadow-sm transition-opacity duration-200 ease-in-out">
                      Profile image updated ✓
                    </div>
                  )}
                  <ProfileCard 
                    data={entry.combinedData}
                    imageOptions={entry.profileImageOptions}
                    onImageSelect={(imageUrl) => handleImageSelect(entry.id, imageUrl)}
                  />
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 