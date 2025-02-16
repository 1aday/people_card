"use client"

import { useState } from 'react'
import { Card } from "@/components/ui/card"
import DragDropArea from "@/components/drag-drop-area"
import { Button } from '@/components/ui/button'
import { SaveProjectModal } from '@/components/save-project-modal'
import { Toaster, toast } from 'sonner'
import Link from 'next/link'
import { PersonCard } from '@/types/project'

export default function Home() {
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [cards, setCards] = useState<PersonCard[]>([])
  const [currentProject, setCurrentProject] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleCardsUpdate = (newCards: PersonCard[]) => {
    setCards(newCards)
  }

  const handleProjectChange = (projectName: string) => {
    setCurrentProject(projectName)
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
