"use client"

import { useState, useEffect } from 'react'
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from 'sonner'
import { 
  Loader2, Plus, FileText, Sparkles, ArrowRight, 
  CheckCircle2, XCircle, AlertCircle, RefreshCcw,
  ChevronDown, ChevronUp
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import React from 'react'

interface Person {
  id: string
  name: string
  company: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  runRocketReach: boolean
  runPerplexity: boolean
  runProfileImage: boolean
  runLinkedin: boolean
  runOpenAI: boolean
}

const API_SERVICES = ['rocketreach', 'perplexity', 'profileImage', 'linkedin', 'openai'] as const
type ApiService = typeof API_SERVICES[number]

export default function StartPage() {
  const [step, setStep] = useState<'project' | 'people'>('project')
  const [projectName, setProjectName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [people, setPeople] = useState<Person[]>([])
  const [newPersonName, setNewPersonName] = useState("")
  const [newPersonCompany, setNewPersonCompany] = useState("")
  const [bulkInput, setBulkInput] = useState("")
  const [showBulkInput, setShowBulkInput] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const router = useRouter()

  const isValidProjectName = (name: string) => {
    return name.length >= 3 && /^[a-zA-Z0-9-_ ]+$/.test(name);
  }

  const handleCreateProject = async () => {
    if (!isValidProjectName(projectName)) {
      toast.error('Please enter a valid project name (at least 3 characters, alphanumeric with spaces, hyphens, and underscores only)')
      return
    }

    setIsCreating(true)
    try {
      // Skip project creation for now - we'll create it when we process people
      setStep('people')
      toast.success('Project name set successfully')
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsCreating(false)
    }
  }

  const handleAddPerson = () => {
    if (!newPersonName || !newPersonCompany) {
      toast.error('Please enter both name and company')
      return
    }

    setPeople([
      ...people,
      {
        id: Math.random().toString(36).substring(7),
        name: newPersonName,
        company: newPersonCompany,
        status: 'pending',
        runRocketReach: true,
        runPerplexity: true,
        runProfileImage: true,
        runLinkedin: true,
        runOpenAI: true
      }
    ])

    setNewPersonName("")
    setNewPersonCompany("")
  }

  const handleBulkAdd = () => {
    const lines = bulkInput.split('\n')
    const newPeople: Person[] = []
    const errors: string[] = []
    
    lines.forEach((line, index) => {
      if (!line.trim()) return // Skip empty lines
      
      // Try to extract name and company
      let name = '', company = ''
      
      // Check for tab separation first
      if (line.includes('\t')) {
        [name, company] = line.split('\t').map(s => s.trim())
      }
      // Then check for CSV format
      else if (line.includes(',')) {
        [name, company] = line.split(',').map(s => s.trim())
      }
      // Then try to extract company in parentheses
      else {
        const match = line.match(/(.*?)\s*\((.*?)\)/)
        if (match) {
          name = match[1].trim()
          company = match[2].trim()
        }
        // If no clear separator, try to split on multiple spaces
        else {
          const parts = line.trim().split(/\s{2,}/)
          if (parts.length >= 2) {
            name = parts[0].trim()
            company = parts.slice(1).join(' ').trim()
          } else {
            // If no clear company indicator, treat whole line as name
            name = line.trim()
          }
        }
      }
      
      if (!name) {
        errors.push(`Line ${index + 1}: Could not extract name`)
        return
      }
      
      newPeople.push({
        id: Math.random().toString(36).substring(7),
        name,
        company: company || 'Unknown',
        status: 'pending',
        runRocketReach: true,
        runPerplexity: true,
        runProfileImage: true,
        runLinkedin: true,
        runOpenAI: true
      })
    })
    
    if (errors.length > 0) {
      toast.error(
        <div>
          <p>Some lines could not be processed:</p>
          <ul className="list-disc pl-4 mt-2 text-sm">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )
    }
    
    if (newPeople.length > 0) {
      setPeople([...people, ...newPeople])
      setBulkInput("")
      setShowBulkInput(false)
      toast.success(`Added ${newPeople.length} people`)
    }
  }

  const toggleService = (personId: string, service: ApiService) => {
    setPeople(people.map(person => {
      if (person.id === personId) {
        const key = `run${service.charAt(0).toUpperCase()}${service.slice(1)}` as keyof Person
        return {
          ...person,
          [key]: !person[key]
        }
      }
      return person
    }))
  }

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const handleProcess = () => {
    if (people.length === 0) {
      toast.error('Please add at least one person')
      return
    }

    // Format people data to match exactly what DragDropArea expects
    const peopleData = people.map(person => ({
      name: person.name,
      company: person.company
    }))

    console.log('Start Page - People Data Structure:', JSON.stringify(peopleData, null, 2))
    
    const url = `/?project=${encodeURIComponent(projectName)}&initialPeople=${encodeURIComponent(JSON.stringify(peopleData))}`
    console.log('Start Page - Redirect URL:', url)

    // Redirect to main page with project name and properly structured data
    router.push(url)
  }

  return (
    <main className="min-h-screen p-4">
      <nav className="w-full bg-background border-b mb-8">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Start New Project</h1>
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto max-w-4xl">
        <Card className="p-6">
          {step === 'project' ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-500" />
                  Name Your Project
                </h2>
                <div className="space-y-4">
                  <Input
                    placeholder="Enter project name..."
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="text-lg"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && isValidProjectName(projectName)) {
                        handleCreateProject()
                      }
                    }}
                  />
                  {projectName && !isValidProjectName(projectName) && (
                    <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md border border-red-200">
                      <p className="font-medium">Project name requirements:</p>
                      <ul className="list-disc pl-5 mt-1 text-xs space-y-1">
                        <li>At least 3 characters long</li>
                        <li>Can contain letters, numbers, spaces, hyphens, and underscores</li>
                        <li>No special characters or symbols</li>
                      </ul>
                    </div>
                  )}
                  <Button
                    onClick={handleCreateProject}
                    disabled={!isValidProjectName(projectName) || isCreating}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Continue
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-500" />
                  Add People to {projectName}
                </h2>
                
                {!showBulkInput ? (
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <Input
                        placeholder="Name"
                        value={newPersonName}
                        onChange={(e) => setNewPersonName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newPersonName && newPersonCompany) {
                            handleAddPerson()
                          }
                        }}
                      />
                      <Input
                        placeholder="Company"
                        value={newPersonCompany}
                        onChange={(e) => setNewPersonCompany(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newPersonName && newPersonCompany) {
                            handleAddPerson()
                          }
                        }}
                      />
                      <Button onClick={handleAddPerson}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowBulkInput(true)}
                      className="w-full"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Bulk Add from Text
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Textarea
                      placeholder={`Paste names and companies in any of these formats:
John Doe, Acme Inc
Jane Smith (Tech Corp)
Bob Wilson    Mega Corp
Alice Johnson	Tech Inc
Sarah Brown

Each person on a new line. Supports:
- Comma separated
- Tab separated (paste from Excel/Sheets)
- Multiple spaces
- Name (Company)
- Just name`}
                      value={bulkInput}
                      onChange={(e) => setBulkInput(e.target.value)}
                      className="min-h-[200px] font-mono text-sm"
                    />
                    <div className="flex gap-3">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowBulkInput(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleBulkAdd}
                        className="flex-1"
                        disabled={!bulkInput.trim()}
                      >
                        Add People
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {people.length > 0 && (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[30px]"></TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Services</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {people.map((person) => (
                        <React.Fragment key={person.id}>
                          <TableRow className="group">
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                onClick={() => toggleRowExpansion(person.id)}
                              >
                                {expandedRows.has(person.id) ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell className="font-medium">{person.name}</TableCell>
                            <TableCell>{person.company}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1.5">
                                {API_SERVICES.map((service) => {
                                  const isEnabled = person[`run${service.charAt(0).toUpperCase()}${service.slice(1)}` as keyof Person]
                                  if (!isEnabled) return null;
                                  return (
                                    <Badge
                                      key={service}
                                      variant="secondary"
                                      className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100"
                                    >
                                      {service}
                                    </Badge>
                                  )
                                })}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setPeople(people.filter(p => p.id !== person.id))}
                                className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 hover:bg-red-50"
                              >
                                Remove
                              </Button>
                            </TableCell>
                          </TableRow>
                          {expandedRows.has(person.id) && (
                            <TableRow>
                              <TableCell colSpan={5}>
                                <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                                  <div className="text-sm font-medium text-gray-500">
                                    Toggle services:
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {API_SERVICES.map((service) => {
                                      const isEnabled = person[`run${service.charAt(0).toUpperCase()}${service.slice(1)}` as keyof Person]
                                      return (
                                        <Badge
                                          key={service}
                                          variant={isEnabled ? "default" : "outline"}
                                          className="cursor-pointer"
                                          onClick={() => toggleService(person.id, service)}
                                        >
                                          {service}
                                        </Badge>
                                      )
                                    })}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>

                  <Button
                    onClick={handleProcess}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Process {people.length} {people.length === 1 ? 'Person' : 'People'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </main>
  )
} 