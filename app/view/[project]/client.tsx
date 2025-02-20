"use client"

import { useState, useEffect } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Toaster, toast } from 'sonner'
import Link from 'next/link'
import { PersonCard } from '@/types/project'
import { useRouter } from 'next/navigation'

export default function ProjectViewClient({ projectName }: { projectName: string }) {
  const [cards, setCards] = useState<PersonCard[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const decodedProjectName = decodeURIComponent(projectName)

  useEffect(() => {
    const fetchProjectCards = async () => {
      try {
        const response = await fetch(`/api/get-project-cards?project_name=${encodeURIComponent(decodedProjectName)}`)
        if (!response.ok) throw new Error('Failed to fetch project cards')
        const data = await response.json()
        setCards(data.cards || [])
      } catch (error) {
        console.error('Error fetching project cards:', error)
        toast.error('Failed to load project cards')
      } finally {
        setLoading(false)
      }
    }

    fetchProjectCards()
  }, [decodedProjectName])

  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      <nav className="w-full bg-white border-b border-gray-100">
        <div className="container mx-auto px-8 h-[72px] flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl text-black font-[600] tracking-[-0.02em]">
              People<span className="font-[800] text-blue-600">.</span>
            </h1>
          </div>
          <div className="flex items-center gap-8">
            <Link href="/gallery">
              <Button 
                variant="ghost" 
                className="text-[15px] font-medium text-gray-600 hover:text-blue-600 hover:bg-transparent"
              >
                Back to Gallery
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-8 py-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">{decodedProjectName}</h2>
          <p className="text-gray-500">Cards: {cards.length}</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <div className="animate-pulse">
                  <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {cards.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card, index) => (
                  <Card key={card.id || index} className="p-4 hover:shadow-lg transition-shadow duration-200 relative group min-h-[420px] flex flex-col">
                    <div className="space-y-4 flex-1">
                      <div className="flex gap-4">
                        <div className="relative w-32 h-32 flex-shrink-0">
                          {card.profilePhoto ? (
                            <img 
                              src={card.profilePhoto} 
                              alt={`${card.name}'s profile`}
                              className="rounded-lg object-cover w-full h-full shadow-sm"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2.5 min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-base capitalize truncate leading-tight">{card.name}</h3>
                              </div>
                              <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                                  <rect width="20" height="14" x="2" y="6" rx="2"></rect>
                                </svg>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-700 truncate">{card.currentRole}</p>
                                </div>
                              </div>
                              {card.expertiseAreas && card.expertiseAreas.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {card.expertiseAreas.map((area: string, i: number) => (
                                    <span 
                                      key={i}
                                      className="inline-flex items-center rounded-md text-xs capitalize px-2 py-0.5 font-medium transition-all duration-200 ease-in-out transform hover:scale-[1.02] shadow-sm cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-700 border-0"
                                    >
                                      {area}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"></path>
                          <circle cx="12" cy="8" r="6"></circle>
                        </svg>
                        <h4 className="text-sm font-medium text-gray-700">Key Achievements</h4>
                      </div>
                      <div className="space-y-1.5">
                        {card.keyAchievements && card.keyAchievements.length > 0 ? (
                          card.keyAchievements.map((achievement: string, i: number) => (
                            <div key={i} className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0 opacity-60"></div>
                              <p className="text-xs text-gray-600 leading-relaxed">{achievement}</p>
                            </div>
                          ))
                        ) : (
                          <div className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0 opacity-60"></div>
                            <p className="text-xs text-gray-600 leading-relaxed">No achievements listed</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                          <rect width="20" height="14" x="2" y="6" rx="2"></rect>
                        </svg>
                        <h4 className="text-sm font-medium text-gray-700">Professional Background</h4>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                          {card.professionalBackground}
                        </p>
                        <button className="text-xs text-blue-600 hover:text-blue-700 mt-1 flex items-center gap-0.5 group/btn">
                          Read more
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 group-hover/btn:translate-y-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m6 9 6 6 6-6"></path>
                          </svg>
                        </button>
                      </div>
                    </div>

                    {card.careerHistory && card.careerHistory.length > 0 && (
                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"></path>
                            <path d="M22 10v6"></path>
                            <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"></path>
                          </svg>
                          <h4 className="text-sm font-medium text-gray-700">Career Journey</h4>
                        </div>
                        <div className="space-y-2.5">
                          {card.careerHistory.map((entry, i) => (
                            <div key={i} className="space-y-1">
                              <div className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0 opacity-60"></div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-700">{entry.title}</p>
                                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <span>{entry.company}</span>
                                    <span className="text-gray-300">•</span>
                                    <span className="text-gray-400">{entry.duration}</span>
                                  </div>
                                  {entry.highlights && entry.highlights.length > 0 && (
                                    <ul className="mt-1 space-y-0.5 list-inside">
                                      {entry.highlights.map((highlight, j) => (
                                        <li key={j} className="text-xs text-gray-600 pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-gray-400 before:text-[8px] before:top-[2px]">
                                          {highlight}
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-gray-500 mb-4">No cards found in this project</p>
                <Link href="/">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    Create Cards
                  </Button>
                </Link>
              </Card>
            )}
          </>
        )}
      </div>

      <Toaster position="top-right" />
    </main>
  )
} 