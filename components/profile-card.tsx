import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { 
  LinkedinIcon, 
  ChevronLeft,
  ChevronRight,
  Check,
  Trophy,
  BookOpen,
  History,
  Star,
  Plus,
  Minus,
  GraduationCap,
  Languages
} from "lucide-react"
import { useState } from "react"
import Image from 'next/image'

interface ProfileCardProps {
  data: {
    name: string
    profilePhoto: string
    linkedinURL: string
    currentRole: string
    keyAchievements: string[]
    professionalBackground: string
    careerHistory: {
      title: string
      company: string
      duration: string
      highlights: string[]
    }[]
    expertiseAreas: string[]
    education?: {
      degree: string
      institution: string
      year: string
    }[]
    languages?: {
      language: string
      proficiency: string
    }[]
  }
  imageOptions?: string[]
  onImageSelect?: (imageUrl: string) => void
}

interface HoverableProfileImageProps {
  currentImage: string
  allImages?: string[]
  onImageSelect?: (imageUrl: string) => void
  name: string
}

const HoverableProfileImage = ({ currentImage, allImages = [], onImageSelect, name }: HoverableProfileImageProps) => {
  const [isHovered, setIsHovered] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (allImages.length <= 1) return
    const newIndex = (currentIndex - 1 + allImages.length) % allImages.length
    setCurrentIndex(newIndex)
  }

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (allImages.length <= 1) return
    const newIndex = (currentIndex + 1) % allImages.length
    setCurrentIndex(newIndex)
  }

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onImageSelect) {
      onImageSelect(allImages[currentIndex])
    }
  }

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Image
        src={allImages[currentIndex] || currentImage}
        alt={`${name}'s profile`}
        width={200}
        height={200}
        className="rounded-lg object-cover"
        unoptimized
      />
      {isHovered && allImages && allImages.length > 1 && (
        <div className="absolute inset-0 flex items-center justify-between bg-black bg-opacity-40 rounded-lg">
          <button
            type="button"
            onClick={handlePrevious}
            className="p-2 text-white hover:bg-black hover:bg-opacity-20 rounded-l-lg"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={handleSelect}
            className="p-2 text-white hover:bg-black hover:bg-opacity-20"
          >
            <Check className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="p-2 text-white hover:bg-black hover:bg-opacity-20 rounded-r-lg"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  )
}

export function ProfileCard({ data, imageOptions, onImageSelect }: ProfileCardProps) {
  const [isCareerHistoryExpanded, setIsCareerHistoryExpanded] = useState(false)

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-start space-x-6">
        <HoverableProfileImage
          currentImage={data.profilePhoto}
          allImages={imageOptions}
          onImageSelect={onImageSelect}
          name={data.name}
        />
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{data.name}</h2>
              <p className="text-gray-600">{data.currentRole}</p>
            </div>
            {data.linkedinURL && (
              <a
                href={data.linkedinURL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 flex items-center gap-2"
              >
                <LinkedinIcon className="w-5 h-5" />
                <span>LinkedIn Profile</span>
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Key Achievements */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-semibold">Key Achievements</h3>
          </div>
          <ul className="list-disc pl-5 space-y-1">
            {data.keyAchievements.map((achievement, index) => (
              <li key={index}>{achievement}</li>
            ))}
          </ul>
        </div>

        {/* Professional Background */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold">Professional Background</h3>
          </div>
          <p className="text-gray-700">{data.professionalBackground}</p>
        </div>

        {/* Career History */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <History className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold">Career History</h3>
          </div>
          
          {/* Latest Career Entry */}
          {data.careerHistory.length > 0 && (
            <div className="border-l-2 border-purple-200 pl-4">
              <h4 className="font-semibold">{data.careerHistory[0].title}</h4>
              <p className="text-sm text-gray-600">{data.careerHistory[0].company} • {data.careerHistory[0].duration}</p>
              <ul className="mt-2 list-disc pl-5 space-y-1">
                {data.careerHistory[0].highlights.map((highlight, hIndex) => (
                  <li key={hIndex} className="text-sm text-gray-700">{highlight}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Toggle for Previous Positions */}
          {data.careerHistory.length > 1 && (
            <>
              <Button
                variant="ghost"
                className="w-full flex justify-between items-center py-3 mt-4 hover:bg-gray-50"
                onClick={() => setIsCareerHistoryExpanded(!isCareerHistoryExpanded)}
              >
                <span className="text-sm text-gray-600">
                  {isCareerHistoryExpanded ? "Hide" : "Show"} Previous Positions ({data.careerHistory.length - 1})
                </span>
                {isCareerHistoryExpanded ? (
                  <Minus className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
              
              {isCareerHistoryExpanded && (
                <div className="space-y-4 mt-4">
                  {data.careerHistory.slice(1).map((role, index) => (
                    <div key={index} className="border-l-2 border-purple-200 pl-4">
                      <h4 className="font-semibold">{role.title}</h4>
                      <p className="text-sm text-gray-600">{role.company} • {role.duration}</p>
                      <ul className="mt-2 list-disc pl-5 space-y-1">
                        {role.highlights.map((highlight, hIndex) => (
                          <li key={hIndex} className="text-sm text-gray-700">{highlight}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Education - Optional Section */}
        {data.education && data.education.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="w-5 h-5 text-green-500" />
              <h3 className="text-lg font-semibold">Education</h3>
            </div>
            <div className="space-y-3">
              {data.education.map((edu, index) => (
                <div key={index} className="border-l-2 border-green-200 pl-4">
                  <h4 className="font-semibold">{edu.degree}</h4>
                  <p className="text-sm text-gray-600">{edu.institution} • {edu.year}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages - Optional Section */}
        {data.languages && data.languages.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Languages className="w-5 h-5 text-indigo-500" />
              <h3 className="text-lg font-semibold">Languages</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.languages.map((lang, index) => (
                <Badge key={index} variant="secondary" className="bg-indigo-50">
                  {lang.language} - {lang.proficiency}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Expertise Areas */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-semibold">Areas of Expertise</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.expertiseAreas.map((area, index) => (
              <Badge key={index} variant="secondary" className="bg-amber-50">{area}</Badge>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
} 