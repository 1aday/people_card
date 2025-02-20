import { useState } from 'react'
import { Card } from "./ui/card"
import { LinkedinIcon, Loader2, Trash2, ChevronLeft, ChevronRight, Check, ChevronDown, ChevronUp, Building2, Briefcase, Award, Sparkles, GraduationCap, MapPin, Clock, ExternalLink } from "lucide-react"
import Image from 'next/image'
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

interface CareerPosition {
  title: string
  company: string
  duration: string
  highlights?: string[]
}

interface NiceCardProps {
  data: {
    id?: number
    name: string
    profilePhoto: string
    linkedinURL: string
    currentRole: string
    conciseRole: string
    keyAchievements: string[]
    expertiseAreas: string[]
    profile_image_options?: string[]
    professionalBackground?: string
    careerHistory?: CareerPosition[]
    citations?: Record<string, string>
  }
  projectName: string
  onDelete?: () => void
  onImageSelect?: (imageUrl: string) => void
  onTagClick?: (tag: string) => void
}

// Gradient backgrounds for expertise tags
const TAG_GRADIENTS = [
  'from-blue-500/20 to-purple-500/20 text-blue-700',
  'from-emerald-500/20 to-teal-500/20 text-emerald-700',
  'from-orange-500/20 to-pink-500/20 text-orange-700',
  'from-violet-500/20 to-fuchsia-500/20 text-violet-700',
  'from-cyan-500/20 to-blue-500/20 text-cyan-700',
  'from-rose-500/20 to-orange-500/20 text-rose-700',
]

export function NiceCard({ data, projectName, onDelete, onImageSelect, onTagClick }: NiceCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showAllAchievements, setShowAllAchievements] = useState(false)
  const [showAllHistory, setShowAllHistory] = useState(false)

  // Ensure we have valid data
  const safeData = {
    ...data,
    name: data.name || 'Unknown Name',
    profilePhoto: data.profilePhoto || '',
    linkedinURL: data.linkedinURL || '',
    currentRole: data.currentRole || 'Unknown Role',
    conciseRole: data.conciseRole || data.currentRole || 'Unknown Role',
    keyAchievements: Array.isArray(data.keyAchievements) ? data.keyAchievements : [],
    expertiseAreas: Array.isArray(data.expertiseAreas) ? data.expertiseAreas : [],
    professionalBackground: data.professionalBackground || '',
    careerHistory: Array.isArray(data.careerHistory) ? data.careerHistory : [],
    profile_image_options: Array.isArray(data.profile_image_options) ? data.profile_image_options : [],
    citations: data.citations || {}
  }

  const images = safeData.profile_image_options?.length 
    ? safeData.profile_image_options.filter(img => img && img !== '') 
    : [safeData.profilePhoto].filter(img => img && img !== '')
  const currentImage = images[currentImageIndex] || null

  const handleDelete = async () => {
    if (!onDelete) return
    setIsDeleting(true)
    try {
      await onDelete()
      toast.success('Card deleted successfully')
    } catch (error) {
      toast.error('Failed to delete card')
    } finally {
      setIsDeleting(false)
    }
  }

  const handlePrevious = () => {
    if (images.length <= 1) return
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const handleNext = () => {
    if (images.length <= 1) return
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const handleSelectImage = () => {
    if (onImageSelect && currentImage) {
      onImageSelect(currentImage)
    }
  }

  return (
    <Card className="group relative overflow-hidden bg-white hover:shadow-lg transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Header Section */}
      <div className="relative p-6 pb-4">
        <div className="flex gap-6">
          {/* Profile Image */}
          <div className="relative w-32 h-32 rounded-xl overflow-hidden shadow-md group/image">
            {currentImage ? (
              <Image
                src={currentImage}
                alt={`${safeData.name}'s profile`}
                width={128}
                height={128}
                className="object-cover w-full h-full transition-transform duration-300 group-hover/image:scale-105"
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <span className="text-gray-400 text-sm">No Image</span>
              </div>
            )}
            
            {/* Image Navigation */}
            {images.length > 1 && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-between px-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePrevious}
                  className="p-1 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSelectImage}
                  className="p-1 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
                >
                  <Check className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNext}
                  className="p-1 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>
            )}
          </div>

          {/* Name and Role */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-xl font-semibold text-gray-900">
                  {safeData.name}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {safeData.conciseRole}
                </p>
                {safeData.linkedinURL && (
                  <a
                    href={safeData.linkedinURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 transition-colors mt-1"
                  >
                    <LinkedinIcon className="w-4 h-4" />
                    <span>View Profile</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Expertise Tags */}
            {safeData.expertiseAreas.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {safeData.expertiseAreas.map((area, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className={`px-2 py-1 text-xs font-medium bg-gradient-to-r ${
                      TAG_GRADIENTS[index % TAG_GRADIENTS.length]
                    } hover:scale-105 transition-transform cursor-pointer border-0`}
                    onClick={() => onTagClick?.(area)}
                  >
                    {area}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="px-6 pb-6 space-y-4">
        {/* Key Achievements */}
        {safeData.keyAchievements.length > 0 && (
          <section>
            <h4 className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
              <Award className="w-4 h-4 text-blue-500" />
              Key Achievements
            </h4>
            <AnimatePresence initial={false}>
              <div className="space-y-2">
                {safeData.keyAchievements
                  .slice(0, showAllAchievements ? undefined : 2)
                  .map((achievement, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2, delay: index * 0.1 }}
                      className="flex gap-3"
                    >
                      <div className="w-1 h-1 rounded-full bg-blue-500 mt-2 opacity-60" />
                      <p className="text-sm text-gray-600 leading-relaxed flex-1">
                        {achievement}
                      </p>
                    </motion.div>
                  ))}
              </div>
            </AnimatePresence>
            {safeData.keyAchievements.length > 2 && (
              <button
                onClick={() => setShowAllAchievements(!showAllAchievements)}
                className="text-sm text-blue-600 hover:text-blue-700 mt-2 flex items-center gap-0.5"
              >
                {showAllAchievements ? (
                  <>Show Less <ChevronUp className="w-4 h-4" /></>
                ) : (
                  <>Show More <ChevronDown className="w-4 h-4" /></>
                )}
              </button>
            )}
          </section>
        )}

        {/* Career History */}
        {safeData.careerHistory && safeData.careerHistory.length > 0 && (
          <section>
            <h4 className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
              <Briefcase className="w-4 h-4 text-purple-500" />
              Career History
            </h4>
            <div className="space-y-3">
              {safeData.careerHistory
                .slice(0, showAllHistory ? undefined : 1)
                .map((position, index) => (
                  <div key={index} className="relative pl-4 border-l-2 border-purple-100">
                    <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-purple-500" />
                    <h5 className="text-sm font-medium text-gray-900">{position.title}</h5>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-0.5">
                      <Building2 className="w-3.5 h-3.5" />
                      {position.company}
                      <span className="text-gray-400">•</span>
                      <Clock className="w-3.5 h-3.5" />
                      {position.duration}
                    </div>
                    {position.highlights && position.highlights.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {position.highlights.map((highlight, hIndex) => (
                          <li
                            key={hIndex}
                            className="text-sm text-gray-600 flex items-start gap-2"
                          >
                            <div className="w-1 h-1 rounded-full bg-gray-400 mt-2" />
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
            </div>
            {safeData.careerHistory.length > 1 && (
              <button
                onClick={() => setShowAllHistory(!showAllHistory)}
                className="text-sm text-blue-600 hover:text-blue-700 mt-2 flex items-center gap-0.5"
              >
                {showAllHistory ? (
                  <>Show Less <ChevronUp className="w-4 h-4" /></>
                ) : (
                  <>Show More <ChevronDown className="w-4 h-4" /></>
                )}
              </button>
            )}
          </section>
        )}
      </div>

      {/* Delete Button */}
      {onDelete && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleDelete}
          disabled={isDeleting}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm 
                   text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 
                   transition-all duration-200"
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </motion.button>
      )}
    </Card>
  )
} 