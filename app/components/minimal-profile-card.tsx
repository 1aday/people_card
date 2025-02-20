"use client"

import { Card } from "@/components/ui/card"
import { PersonCard } from "@/types/project"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

interface MinimalProfileCardProps {
  data: PersonCard
  projectName: string
  onDelete?: () => void
}

export function MinimalProfileCard({ data, projectName, onDelete }: MinimalProfileCardProps) {
  const handleDelete = async () => {
    try {
      const response = await fetch('/api/delete-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_name: projectName,
          card_id: data.id,
        }),
      })

      if (!response.ok) throw new Error('Failed to delete card')
      
      toast.success('Card deleted successfully')
      onDelete?.()
    } catch (error) {
      console.error('Error deleting card:', error)
      toast.error('Failed to delete card')
    }
  }

  return (
    <Card className="group relative overflow-hidden">
      <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="destructive" 
              size="icon"
              className="h-8 w-8"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete {data.name}'s card
                from the {projectName} project.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="relative aspect-square">
        {data.profilePhoto ? (
          <Image
            src={data.profilePhoto}
            alt={data.name}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <p className="text-gray-400">No image</p>
          </div>
        )}
      </div>
      
      <div className="p-6">
        <h3 className="font-semibold text-lg mb-1">{data.name}</h3>
        <p className="text-sm text-gray-500 line-clamp-2">{data.conciseRole}</p>
      </div>
    </Card>
  )
} 