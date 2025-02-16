import { Card } from "./ui/card"
import { LinkedinIcon, Loader2, Minus, ChevronLeft, ChevronRight, Check } from "lucide-react"
import Image from 'next/image'
import { Button } from "./ui/button"
import { toast } from "sonner"
import { useState } from "react"

interface MinimalProfileCardProps {
  data: {
    id?: number
    name: string
    profilePhoto: string
    linkedinURL: string
    currentRole: string
    conciseRole: string
    company?: string
  }
  projectName: string
  onDelete?: () => void
  onImageSelect?: (imageUrl: string) => void
}

export function MinimalProfileCard({ data, projectName, onDelete, onImageSelect }: MinimalProfileCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  // Parse images from CSV
  const images = data.profilePhoto.includes(',') 
    ? data.profilePhoto.split(',')
    : [data.profilePhoto];

  const currentImage = images[currentImageIndex];

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

      onDelete?.()
      toast.success('Card deleted successfully')
    } catch (error) {
      console.error('Error deleting card:', error)
      toast.error('Failed to delete card')
    } finally {
      setIsDeleting(false)
    }
  }

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (images.length <= 1) return
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (images.length <= 1) return
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const handleSelectImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onImageSelect && currentImage) {
      // Create new CSV with selected image as first
      const newImages = [currentImage, ...images.filter(img => img !== currentImage)];
      onImageSelect(newImages.join(','))
    }
  }

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow duration-200 relative group">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
      <div className="flex items-start space-x-4">
        <div 
          className="relative w-16 h-16 flex-shrink-0"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Image
            src={currentImage}
            alt={`${data.name}'s profile`}
            width={64}
            height={64}
            className="rounded-full object-cover"
            unoptimized
          />
          {isHovered && images.length > 1 && (
            <div className="absolute inset-0 flex items-center justify-between bg-black bg-opacity-40 rounded-full">
              <button
                type="button"
                onClick={handlePrevious}
                className="p-1 text-white hover:bg-black hover:bg-opacity-20"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleSelectImage}
                className="p-1 text-white hover:bg-black hover:bg-opacity-20"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="p-1 text-white hover:bg-black hover:bg-opacity-20"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5 flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{data.name}</h3>
              <p className="text-sm text-gray-600 truncate">{data.conciseRole}</p>
              <p className="text-sm text-gray-500 truncate">{data.company}</p>
            </div>
            {data.linkedinURL && data.linkedinURL !== 'Not found' && (
              <a
                href={data.linkedinURL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 flex-shrink-0 p-2 hover:bg-blue-50 rounded-full transition-colors duration-200 ml-2"
              >
                <LinkedinIcon className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
} 