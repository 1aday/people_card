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
    name?: string
    profilePhoto?: string
    linkedinURL?: string
    currentRole?: string
    keyAchievements?: string[]
    professionalBackground?: string
    careerHistory?: {
      title: string
      company: string
      duration: string
      highlights: string[]
    }[]
    expertiseAreas?: string[]
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

  // Filter out empty strings and invalid URLs from allImages
  const validImages = allImages.filter(img => img && img !== '' && img !== 'Not found') || [];
  
  // Don't render if no valid image
  if (!currentImage || currentImage === 'Not found' || currentImage === '') {
    return (
      <div className="w-[200px] h-[200px] bg-gray-100 rounded-lg flex items-center justify-center">
        <span className="text-gray-400">No Image</span>
      </div>
    );
  }

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!validImages || validImages.length <= 1) return
    const newIndex = (currentIndex - 1 + validImages.length) % validImages.length
    setCurrentIndex(newIndex)
  }

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!validImages || validImages.length <= 1) return
    const newIndex = (currentIndex + 1) % validImages.length
    setCurrentIndex(newIndex)
  }

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onImageSelect && validImages && validImages[currentIndex]) {
      const selectedImage = validImages[currentIndex]
      if (selectedImage && selectedImage !== '') {
        onImageSelect(selectedImage)
      }
    }
  }

  // Ensure we never use an empty string for the image source
  const displayImage = (validImages && validImages[currentIndex] && validImages[currentIndex] !== '') 
    ? validImages[currentIndex] 
    : (currentImage !== '' ? currentImage : null);

  if (!displayImage) {
    return (
      <div className="w-[200px] h-[200px] bg-gray-100 rounded-lg flex items-center justify-center">
        <span className="text-gray-400">No Image</span>
      </div>
    );
  }

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Image
        src={displayImage}
        alt={`${name}'s profile`}
        width={200}
        height={200}
        className="rounded-lg object-cover"
        unoptimized
      />
      {isHovered && validImages.length > 1 && (
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

  // Ensure arrays are defined and handle missing data safely
  const keyAchievements = data?.keyAchievements?.filter(achievement => achievement && typeof achievement === 'string') || [];
  const careerHistory = data?.careerHistory?.filter(entry => 
    entry && 
    typeof entry === 'object' && 
    entry.title && 
    entry.company && 
    Array.isArray(entry.highlights)
  ) || [];
  const expertiseAreas = data?.expertiseAreas?.filter(area => area && typeof area === 'string') || [];
  const education = data?.education?.filter(edu => 
    edu && 
    typeof edu === 'object' && 
    edu.degree && 
    edu.institution
  ) || [];
  const languages = data?.languages?.filter(lang => 
    lang && 
    typeof lang === 'object' && 
    lang.language && 
    lang.proficiency
  ) || [];

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-start space-x-6">
        <HoverableProfileImage
          currentImage={data?.profilePhoto || ''}
          allImages={imageOptions}
          onImageSelect={onImageSelect}
          name={data?.name || ''}
        />
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold capitalize">{data?.name || 'Unknown'}</h2>
              <p className="text-gray-600">{data?.currentRole || 'No role specified'}</p>
            </div>
            {data?.linkedinURL && data.linkedinURL !== 'Not found' && (
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
        {keyAchievements.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-semibold">Key Achievements</h3>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              {keyAchievements.map((achievement, index) => (
                <li key={index} className="text-gray-600 first-letter:capitalize">{achievement}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Professional Background */}
        {data?.professionalBackground && data.professionalBackground !== 'Not specified' && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold">Professional Background</h3>
            </div>
            <p className="text-gray-700 first-letter:capitalize">{data.professionalBackground}</p>
          </div>
        )}

        {/* Career History */}
        {careerHistory.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <History className="w-5 h-5 text-purple-500" />
              <h3 className="text-lg font-semibold">Career History</h3>
            </div>
            
            {/* Latest Career Entry */}
            <div className="border-l-2 border-purple-200 pl-4">
              <h4 className="font-semibold capitalize">{careerHistory[0].title} at {careerHistory[0].company}</h4>
              <p className="text-sm text-gray-600">{careerHistory[0].duration}</p>
              {careerHistory[0].highlights && careerHistory[0].highlights.length > 0 && (
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  {careerHistory[0].highlights.map((highlight, hIndex) => (
                    <li key={hIndex} className="text-sm text-gray-700 capitalize">{highlight}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* Toggle for Previous Positions */}
            {careerHistory.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  className="w-full flex justify-between items-center py-3 mt-4 hover:bg-gray-50"
                  onClick={() => setIsCareerHistoryExpanded(!isCareerHistoryExpanded)}
                >
                  <span className="text-sm text-gray-600">
                    {isCareerHistoryExpanded ? "Hide" : "Show"} Previous Positions ({careerHistory.length - 1})
                  </span>
                  {isCareerHistoryExpanded ? (
                    <Minus className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
                
                {isCareerHistoryExpanded && (
                  <div className="space-y-4 mt-4">
                    {careerHistory.slice(1).map((role, index) => (
                      <div key={index} className="border-l-2 border-purple-200 pl-4">
                        <h4 className="font-semibold capitalize">{role.title} at {role.company}</h4>
                        <p className="text-sm text-gray-600">{role.duration}</p>
                        {role.highlights && role.highlights.length > 0 && (
                          <ul className="mt-2 list-disc pl-5 space-y-1">
                            {role.highlights.map((highlight, hIndex) => (
                              <li key={hIndex} className="text-sm text-gray-700 capitalize">{highlight}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Education - Optional Section */}
        {education && education.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="w-5 h-5 text-green-500" />
              <h3 className="text-lg font-semibold">Education</h3>
            </div>
            <div className="space-y-3">
              {education.map((edu, index) => (
                <div key={index} className="border-l-2 border-green-200 pl-4">
                  <h4 className="font-semibold capitalize">{edu.degree}</h4>
                  <p className="text-sm text-gray-600">{edu.institution} • {edu.year || 'Year not specified'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages - Optional Section */}
        {languages && languages.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Languages className="w-5 h-5 text-indigo-500" />
              <h3 className="text-lg font-semibold">Languages</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {languages.map((lang, index) => (
                <Badge key={index} variant="secondary" className="bg-indigo-50">
                  {lang.language} - {lang.proficiency}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Expertise Areas */}
        {expertiseAreas.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-semibold">Areas of Expertise</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {expertiseAreas.map((area, index) => (
                <Badge key={index} variant="secondary" className="bg-amber-50 capitalize">{area}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
} 