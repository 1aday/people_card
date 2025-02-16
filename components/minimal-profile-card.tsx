import { Card } from "./ui/card"
import { LinkedinIcon, Loader2, Trash2, ChevronLeft, ChevronRight, Check } from "lucide-react"
import Image from 'next/image'
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
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
    keyAchievements: string[]
    expertiseAreas: string[]
    profile_image_options?: string[]
  }
  projectName: string
  onDelete?: () => void
  onImageSelect?: (imageUrl: string) => void
}

export function MinimalProfileCard({ data, projectName, onDelete, onImageSelect }: MinimalProfileCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  // Use profile_image_options if available, otherwise use single profilePhoto
  const images = data.profile_image_options?.filter(img => img && img !== '') || [data.profilePhoto].filter(img => img && img !== '');
  const currentImage = images[currentImageIndex] || null;

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
      onImageSelect(currentImage)  // Just pass the selected image URL
    }
  }

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-200 relative group">
      <div className="flex flex-col space-y-4">
        {/* Profile Image Section */}
        <div 
          className="relative w-32 h-32 mx-auto"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {currentImage ? (
            <Image
              src={currentImage}
              alt={`${data.name}'s profile`}
              width={128}
              height={128}
              className="rounded-full object-cover w-full h-full"
              unoptimized
            />
          ) : (
            <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-gray-400">No Image</span>
            </div>
          )}
          {isHovered && images.length > 1 && (
            <div className="absolute inset-0 flex items-center justify-between bg-black bg-opacity-40 rounded-full">
              <button
                type="button"
                onClick={handlePrevious}
                className="p-2 text-white hover:bg-black hover:bg-opacity-20"
                title="Previous image"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleSelectImage}
                className="p-2 text-white hover:bg-black hover:bg-opacity-20"
                title="Set as profile image"
              >
                <Check className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="p-2 text-white hover:bg-black hover:bg-opacity-20"
                title="Next image"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="text-center space-y-2">
          <h3 className="font-semibold text-lg capitalize">{data.name}</h3>
          <p className="text-gray-600 capitalize">{data.conciseRole}</p>
          <p className="text-gray-500 capitalize">{data.company}</p>
          
          {data.linkedinURL && data.linkedinURL !== 'Not found' && (
            <a
              href={data.linkedinURL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm flex items-center gap-1 justify-center"
            >
              <LinkedinIcon className="w-4 h-4" />
              LinkedIn
            </a>
          )}
        </div>

        {/* Expertise Tags */}
        {data.expertiseAreas && data.expertiseAreas.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-center mt-2">
            {data.expertiseAreas.slice(0, 3).map((area, index) => (
              <Badge key={index} variant="secondary" className="text-xs capitalize">
                {area}
              </Badge>
            ))}
            {data.expertiseAreas.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{data.expertiseAreas.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="absolute bottom-3 right-3 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
          title="Delete card"
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </Card>
  )
} 