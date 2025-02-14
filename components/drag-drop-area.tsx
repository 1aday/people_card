"use client"

import { useState, useRef } from "react"
import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Loader2 } from "lucide-react"
import React from "react"
import { ProfileCard } from "./profile-card"
import { Textarea } from "./ui/textarea"

// Rate limiting configuration for Standard plan
const RATE_LIMIT = {
  SCRAPE_REQUESTS_PER_MINUTE: 100,
  MIN_DELAY_BETWEEN_REQUESTS: 600, // 600ms = 100 requests per minute
}

interface Entry {
  id: string
  name: string
  company: string
  result?: string // RocketReach markdown result
  perplexityResult?: any // Perplexity JSON result
  profileImage?: string  // Add this field
  linkedinUrl?: string  // Add this field
  combinedData?: {
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
  }
  status: {
    rocketreach: 'pending' | 'processing' | 'completed' | 'error'
    perplexity: 'pending' | 'processing' | 'completed' | 'error'
    profileImage: 'pending' | 'processing' | 'completed' | 'error'  // Add this
    linkedin: 'pending' | 'processing' | 'completed' | 'error'  // Add this
    openai: 'pending' | 'processing' | 'completed' | 'error'
  }
  error?: {
    rocketreach?: string
    perplexity?: string
    profileImage?: string  // Add this
    linkedin?: string  // Add this
    openai?: string
  }
  // Add these fields to control which APIs to run
  runRocketReach: boolean
  runPerplexity: boolean
  runProfileImage: boolean  // Add this
  runLinkedin: boolean  // Add this
  runOpenAI: boolean
}

interface SerperResult {
  organic: {
    title: string
    link: string
    snippet: string
    position: number
  }[]
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

  const fetchProfileImage = async (name: string, company: string): Promise<string | null> => {
    try {
      const response = await fetch("https://google.serper.dev/images", {
        method: "POST",
        headers: {
          "X-API-KEY": process.env.NEXT_PUBLIC_SERPER_API_KEY!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: `"${name}" ${company}`
        })
      });

      const data = await response.json();
      
      // Find the first image that looks like a profile picture
      const profileImage = data.images?.find((image: any) => {
        const isSquare = image.imageWidth === image.imageHeight;
        const hasProfileKeyword = image.imageUrl.toLowerCase().includes('profile') || 
                                 image.link.toLowerCase().includes('linkedin');
        return isSquare && hasProfileKeyword;
      });

      if (!profileImage?.imageUrl) {
        return null;
      }

      return profileImage.imageUrl;
    } catch (error) {
      console.error('Error fetching profile image:', error);
      return null;
    }
  }

  const fetchLinkedinUrl = async (name: string, company: string): Promise<string | null> => {
    try {
      const response = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": process.env.NEXT_PUBLIC_SERPER_API_KEY!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: `"${name}" ${company} site:linkedin.com`
        })
      });

      const data = await response.json();
      
      // Find the first result that matches our criteria
      const linkedinResult = data.organic?.find((result: any) => {
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

  const processEntry = async (entry: Entry) => {
    try {
      // First batch: Run main APIs in parallel
      const mainPromises = []
      const mainPromiseTypes = []
      
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
      const serperPromiseTypes = []
      
      if (entry.runProfileImage || entry.runLinkedin) {
        const serperCalls = async () => {
          const results = {}
          if (entry.runProfileImage) {
            try {
              const profileImage = await fetchProfileImage(entry.name, entry.company)
              // Update profile image immediately
              setEntries(current =>
                current.map(e =>
                  e.id === entry.id ? {
                    ...e,
                    profileImage,
                    status: { ...e.status, profileImage: 'completed' }
                  } : e
                )
              )
              results['profileImage'] = profileImage
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
      const processedResults: any = {}
      
      // Process main API results
      mainResults.forEach((result, index) => {
        const apiType = mainPromiseTypes[index]
        if (result.status === 'fulfilled') {
          processedResults[apiType] = result.value
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
      serperResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
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

          const response = await fetch('/api/openai', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              // Send empty/null values for failed APIs
              perplexityData: entry.runPerplexity ? processedResults.perplexity : null,
              rocketReachData: entry.runRocketReach ? processedResults.rocketreach : null,
              profileImage: entry.runProfileImage ? processedResults.profileImage : null,
              linkedinUrl: entry.runLinkedin ? processedResults.linkedin : null,
              name: entry.name,  // Always send name
              company: entry.company  // Always send company
            })
          })

          if (!response.ok) {
            throw new Error('OpenAI API request failed')
          }

          const combinedData = await response.json()
          
          // Update entry with combined data immediately
          setEntries(current =>
            current.map(e =>
              e.id === entry.id ? {
                ...e,
                combinedData,
                status: { ...e.status, openai: 'completed' }
              } : e
            )
          )
          
          processedResults.openai = combinedData
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
      
      // 2. Call Serper API
      const serperResponse = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": process.env.NEXT_PUBLIC_SERPER_API_KEY!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ q: query }),
      })

      if (!serperResponse.ok) {
        throw new Error(`Serper API error: ${serperResponse.statusText}`)
      }

      const serperData: SerperResult = await serperResponse.json()
      console.log('Serper response:', serperData)

      // 3. Find matching result
      const matchingResult = serperData.organic?.find(result => 
        result.snippet.toLowerCase().includes(entry.name.toLowerCase()) && 
        result.snippet.toLowerCase().includes(entry.company.toLowerCase())
      )

      if (!matchingResult) {
        return '(No RocketReach data found)'
      }

      console.log('Found matching result:', matchingResult)

      // 4. Call Firecrawl API with the matching URL
      console.log('Calling Firecrawl with URL:', matchingResult.link)
      const firecrawlResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_FIRECRAWL_API_KEY}`,
        },
        body: JSON.stringify({
          url: matchingResult.link,
          formats: ["markdown"],
          includeTags: [".history"]
        }),
      })

      if (!firecrawlResponse.ok) {
        throw new Error(`Firecrawl API error: ${firecrawlResponse.statusText}`)
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

  const processPerplexity = async (entry: Entry) => {
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
            content: `Find information about ${entry.name} who works at ${entry.company}...`
          }]
        })
      })

      const responseData = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          return '(Perplexity API credits exhausted)'
        }
        return '(Perplexity API request failed)'
      }

      if (!responseData.choices?.[0]?.message?.content) {
        return '(No content in Perplexity response)'
      }

      const content = responseData.choices[0].message.content

      try {
        // First try direct JSON parse
        return JSON.parse(content)
      } catch (parseError) {
        // If direct parse fails, try to extract JSON from markdown
        console.log('Direct JSON parse failed, trying to extract from markdown...')
        
        // Look for JSON between triple backticks
        const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[1])
          } catch (markdownParseError) {
            console.error('Failed to parse JSON from markdown:', jsonMatch[1])
            return '(Could not parse Perplexity JSON response)'
          }
        }

        // If no markdown format, try to find any JSON-like structure
        const possibleJson = content.match(/\{[\s\S]*\}/)
        if (possibleJson) {
          try {
            return JSON.parse(possibleJson[0])
          } catch (structureParseError) {
            console.error('Failed to parse JSON structure:', possibleJson[0])
            return '(Could not parse Perplexity JSON response)'
          }
        }

        // If all parsing attempts fail, check if it's a "no information" response
        if (content.toLowerCase().includes('do not have enough accurate information') ||
            content.toLowerCase().includes('cannot provide') ||
            content.toLowerCase().includes('no reliable details')) {
          return '(No information found in Perplexity response)'
        }

        // For any other unparseable response
        console.error('Failed to parse response:', content)
        return '(Unexpected Perplexity response format)'
      }

    } catch (error) {
      console.error('Error in processPerplexity:', error)
      return '(Perplexity API error)'
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
            {entries.length > 0 && (
              <Button
                onClick={handleProcessAll}
                disabled={isProcessing || entries.every(e => 
                  (!e.runRocketReach || e.status.rocketreach === 'completed') &&
                  (!e.runPerplexity || e.status.perplexity === 'completed') &&
                  (!e.runProfileImage || e.status.profileImage === 'completed') &&
                  (!e.runLinkedin || e.status.linkedin === 'completed') &&
                  (!e.runOpenAI || e.status.openai === 'completed')
                )}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : 'Process All'}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {entries.length > 0 && (
        <div className="space-y-8">
          <Card className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>APIs to Run</TableHead>
                  <TableHead>RocketReach Status</TableHead>
                  <TableHead>Perplexity Status</TableHead>
                  <TableHead>Profile Image Status</TableHead>
                  <TableHead>LinkedIn URL</TableHead>
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
                        <div className="flex items-center space-x-4">
                          {entry.profileImage && (
                            <img 
                              src={entry.profileImage} 
                              alt={`${entry.name}'s profile`}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          )}
                          <div>
                            <span className="font-medium">{entry.name}</span>
                            <span className="text-sm text-gray-500 block">{entry.company}</span>
                          </div>
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
                        <div className="space-y-1">
                          <span className={
                            !entry.runRocketReach ? 'text-gray-400 italic' :
                            entry.status.rocketreach === 'pending' ? 'text-gray-500' :
                            entry.status.rocketreach === 'processing' ? 'text-blue-500' :
                            entry.status.rocketreach === 'completed' ? 'text-green-500' :
                            'text-red-500'
                          }>
                            {!entry.runRocketReach ? 'Not Selected' :
                             entry.status.rocketreach.charAt(0).toUpperCase() + entry.status.rocketreach.slice(1)}
                            {entry.runRocketReach && entry.status.rocketreach === 'processing' && (
                              <Loader2 className="ml-2 h-4 w-4 animate-spin inline" />
                            )}
                          </span>
                          {entry.result && (
                            <div className="text-xs text-gray-600 truncate max-w-[200px]">
                              {entry.result}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <span className={
                            !entry.runPerplexity ? 'text-gray-400 italic' :
                            entry.status.perplexity === 'pending' ? 'text-gray-500' :
                            entry.status.perplexity === 'processing' ? 'text-blue-500' :
                            entry.status.perplexity === 'completed' ? 'text-green-500' :
                            'text-red-500'
                          }>
                            {!entry.runPerplexity ? 'Not Selected' :
                             entry.status.perplexity.charAt(0).toUpperCase() + entry.status.perplexity.slice(1)}
                            {entry.runPerplexity && entry.status.perplexity === 'processing' && (
                              <Loader2 className="ml-2 h-4 w-4 animate-spin inline" />
                            )}
                          </span>
                          {entry.perplexityResult && (
                            <div className="text-xs text-gray-600 truncate max-w-[200px]">
                              {JSON.stringify(entry.perplexityResult).slice(0, 100)}...
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <span className={
                            !entry.runProfileImage ? 'text-gray-400 italic' :
                            entry.status.profileImage === 'pending' ? 'text-gray-500' :
                            entry.status.profileImage === 'processing' ? 'text-blue-500' :
                            entry.status.profileImage === 'completed' ? 'text-green-500' :
                            'text-red-500'
                          }>
                            {!entry.runProfileImage ? 'Not Selected' :
                             entry.status.profileImage.charAt(0).toUpperCase() + entry.status.profileImage.slice(1)}
                            {entry.runProfileImage && entry.status.profileImage === 'processing' && (
                              <Loader2 className="ml-2 h-4 w-4 animate-spin inline" />
                            )}
                          </span>
                          {entry.profileImage && (
                            <div className="text-xs text-gray-600 truncate max-w-[200px]">
                              {entry.profileImage.slice(0, 50)}...
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <span className={
                            !entry.runLinkedin ? 'text-gray-400 italic' :
                            entry.status.linkedin === 'pending' ? 'text-gray-500' :
                            entry.status.linkedin === 'processing' ? 'text-blue-500' :
                            entry.status.linkedin === 'completed' ? 'text-green-500' :
                            'text-red-500'
                          }>
                            {!entry.runLinkedin ? 'Not Selected' :
                             entry.status.linkedin.charAt(0).toUpperCase() + entry.status.linkedin.slice(1)}
                            {entry.runLinkedin && entry.status.linkedin === 'processing' && (
                              <Loader2 className="ml-2 h-4 w-4 animate-spin inline" />
                            )}
                          </span>
                          {entry.linkedinUrl && (
                            <a 
                              href={entry.linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-500 hover:underline truncate block max-w-[200px]"
                            >
                              {entry.linkedinUrl}
                            </a>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Row Content */}
                    {expandedRows.has(entry.id) && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-gray-50 p-6">
                          <div className="grid grid-cols-2 gap-6">
                            {/* RocketReach Data */}
                            <div className="space-y-2">
                              <h3 className="font-semibold text-sm flex items-center gap-2">
                                <span className={
                                  entry.status.rocketreach === 'completed' ? 'text-green-500' :
                                  entry.status.rocketreach === 'error' ? 'text-red-500' :
                                  'text-gray-500'
                                }>●</span>
                                RocketReach Data
                              </h3>
                              {entry.result ? (
                                <pre className="text-xs bg-white p-4 rounded-md border overflow-auto max-h-[300px]">
                                  {entry.result}
                                </pre>
                              ) : (
                                <p className="text-sm text-gray-500 italic">No data available</p>
                              )}
                            </div>

                            {/* Perplexity Data */}
                            <div className="space-y-2">
                              <h3 className="font-semibold text-sm flex items-center gap-2">
                                <span className={
                                  entry.status.perplexity === 'completed' ? 'text-green-500' :
                                  entry.status.perplexity === 'error' ? 'text-red-500' :
                                  'text-gray-500'
                                }>●</span>
                                Perplexity Data
                              </h3>
                              {entry.perplexityResult ? (
                                <pre className="text-xs bg-white p-4 rounded-md border overflow-auto max-h-[300px]">
                                  {JSON.stringify(entry.perplexityResult, null, 2)}
                                </pre>
                              ) : (
                                <p className="text-sm text-gray-500 italic">No data available</p>
                              )}
                            </div>
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
                <div key={entry.id} className="w-full">
                  <ProfileCard data={entry.combinedData} />
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 