"use client"

import { useState, useEffect } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProfileCard } from "@/components/profile-card"
import { MinimalProfileCard } from "@/components/minimal-profile-card"
import { Loader2, LayoutGrid, LayoutList } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from 'next/link'
import { Project, PersonCard } from '@/types/project'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'

interface ProjectWithCount extends Pick<Project, 'name' | 'created_at'> {
  count: number
}

interface DatabaseCard {
  id: number
  name: string
  profile_photo: string
  linkedin_url: string
  current_position: string
  concise_role: string | null
  key_achievements: string[]
  professional_background: string
  career_history: {
    title: string
    company: string
    duration: string
    highlights: string[]
  }[]
  expertise_areas: string[]
}

export default function ViewPage() {
  const [projects, setProjects] = useState<ProjectWithCount[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [cards, setCards] = useState<PersonCard[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingProjects, setLoadingProjects] = useState(true)
  const searchParams = useSearchParams()

  // Handle URL parameters
  useEffect(() => {
    const projectParam = searchParams.get('project')
    if (projectParam) {
      setSelectedProject(projectParam)
    }
  }, [searchParams])

  // Fetch projects on mount
  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch('/api/get-projects')
        if (!response.ok) throw new Error('Failed to fetch projects')
        const data = await response.json()
        setProjects(data)
      } catch (error) {
        console.error('Error loading projects:', error)
      } finally {
        setLoadingProjects(false)
      }
    }

    fetchProjects()
  }, [])

  // Fetch cards when project is selected
  useEffect(() => {
    if (!selectedProject) return

    async function fetchCards() {
      setLoading(true)
      try {
        const response = await fetch(`/api/get-project-cards?project_name=${encodeURIComponent(selectedProject)}`)
        if (!response.ok) throw new Error('Failed to fetch cards')
        const data = await response.json()
        setCards(data.map((card: DatabaseCard) => ({
          id: card.id,
          name: card.name,
          profilePhoto: card.profile_photo,
          linkedinURL: card.linkedin_url,
          currentRole: card.current_position,
          conciseRole: card.concise_role || card.current_position,
          keyAchievements: card.key_achievements,
          professionalBackground: card.professional_background,
          careerHistory: card.career_history,
          expertiseAreas: card.expertise_areas
        })))
      } catch (error) {
        console.error('Error loading cards:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCards()
  }, [selectedProject])

  return (
    <main className="min-h-screen p-4">
      <nav className="w-full bg-background border-b mb-8">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">View Saved Projects</h1>
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto">
        <Card className="p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-80">
              <Select
                value={selectedProject}
                onValueChange={setSelectedProject}
                disabled={loadingProjects}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.name} value={project.name}>
                      {project.name} ({project.count} cards)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {loadingProjects && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading projects...
              </div>
            )}
          </div>
        </Card>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading cards...</span>
          </div>
        ) : cards.length > 0 ? (
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
                </TabsList>
              </div>

              <TabsContent value="minimal" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cards.map((card) => (
                    <MinimalProfileCard 
                      key={card.id || card.name}
                      data={card}
                      projectName={selectedProject}
                      onDelete={() => {
                        setCards(cards.filter(c => c.id !== card.id))
                      }}
                      onImageSelect={async (newPhotoString) => {
                        if (!card.id) return;
                        
                        try {
                          const response = await fetch('/api/save-people-cards', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              project_name: selectedProject,
                              people: [{
                                ...card,
                                profilePhoto: newPhotoString
                              }]
                            })
                          });

                          if (!response.ok) {
                            throw new Error('Failed to update profile photo');
                          }

                          // Update local state
                          setCards(cards.map(c => 
                            c.id === card.id 
                              ? { ...c, profilePhoto: newPhotoString }
                              : c
                          ));

                          toast.success('Profile photo updated successfully');
                        } catch (error) {
                          console.error('Error updating profile photo:', error);
                          toast.error('Failed to update profile photo');
                        }
                      }}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="expanded" className="mt-0">
                <div className="grid grid-cols-1 gap-8">
                  {cards.map((card) => (
                    <ProfileCard 
                      key={card.id || card.name}
                      data={card}
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : selectedProject ? (
          <div className="text-center text-gray-500 mt-8">
            No cards found in this project
          </div>
        ) : null}
      </div>
    </main>
  )
} 