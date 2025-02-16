"use client"

import { useState, useEffect, Suspense } from 'react'
import { Card } from "@/components/ui/card"
import DragDropArea from "@/components/drag-drop-area"
import { Button } from '@/components/ui/button'
import { SaveProjectModal } from '@/components/save-project-modal'
import { Toaster, toast } from 'sonner'
import Link from 'next/link'
import { PersonCard } from '@/types/project'
import { useSearchParams, useRouter } from 'next/navigation'

function MainContent() {
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [cards, setCards] = useState<PersonCard[]>([])
  const [currentProject, setCurrentProject] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  // Handle URL parameters on mount
  useEffect(() => {
    const projectParam = searchParams.get('project')
    if (projectParam) {
      setCurrentProject(decodeURIComponent(projectParam))
    }
  }, [searchParams])

  const handleCardsUpdate = (newCards: PersonCard[]) => {
    setCards(newCards)
  }

  const handleProjectChange = (projectName: string) => {
    setCurrentProject(projectName)
    // Update URL when project changes
    if (projectName) {
      router.push(`/?project=${encodeURIComponent(projectName)}`, { scroll: false })
    } else {
      router.push('/', { scroll: false })
    }
  }

  const handleSave = () => {
    if (cards.length === 0) {
      toast.error('No cards to save. Please process some cards first.')
      return
    }

    if (!currentProject) {
      toast.error('Please select a project first')
      return
    }

    setShowSaveModal(true)
  }

  return (
    <main className="min-h-screen p-4">
      <nav className="w-full bg-background border-b mb-8">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">People Card</h1>
          <div className="flex items-center gap-4">
            <Link href="/view">
              <Button variant="outline">View Saved Projects</Button>
            </Link>
            <Button 
              size="lg"
              onClick={handleSave}
              className="shadow-lg bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Project ({cards.length})
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto">
        <Card className="p-4">
          <DragDropArea 
            onCardsUpdate={handleCardsUpdate}
            projectName={currentProject}
            onProjectChange={handleProjectChange}
            disabled={isProcessing}
          />
        </Card>
      </div>

      <SaveProjectModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        cards={cards}
        onSave={() => {
          setShowSaveModal(false)
        }}
        initialProjectName={currentProject}
      />

      <Toaster position="top-right" />
    </main>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen p-4">
        <nav className="w-full bg-background border-b mb-8">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold">People Card</h1>
          </div>
        </nav>
        <div className="container mx-auto">
          <Card className="p-4">
            <div className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    }>
      <MainContent />
    </Suspense>
  )
}
