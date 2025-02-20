import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PersonCard } from '@/types/project'
import { toast } from 'sonner'

interface SaveProjectModalProps {
  isOpen: boolean
  onClose: () => void
  cards: PersonCard[]
  onSave: () => void
  initialProjectName?: string
}

export function SaveProjectModal({ isOpen, onClose, cards, onSave, initialProjectName }: SaveProjectModalProps) {
  const [projectName, setProjectName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isOpen && initialProjectName) {
      setProjectName(initialProjectName)
    }
  }, [isOpen, initialProjectName])

  const handleSave = async () => {
    if (!cards || cards.length === 0) {
      toast.error('No cards to save')
      return
    }

    setIsSaving(true)
    try {
      // Try to save cards (this will create project if needed)
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
        // If project doesn't exist, create it first
        if (response.status === 404) {
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

      toast.success('Project saved successfully')
      onSave()
      onClose()
    } catch (error) {
      console.error('Error saving project:', error)
      toast.error('Failed to save project')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Project Name</label>
            <Input
              value={initialProjectName || ''}
              disabled={true}
              className="bg-gray-100"
            />
          </div>
          <div className="text-sm text-gray-500">
            {cards.length} cards will be saved to this project
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !initialProjectName}
            >
              {isSaving ? 'Saving...' : 'Save Project'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 