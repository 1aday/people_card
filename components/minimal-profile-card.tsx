import { Card } from "./ui/card"
import { LinkedinIcon, Loader2, Trash2, ChevronLeft, ChevronRight, Check, ChevronDown, ChevronUp, Search, X, Building2, Briefcase, Award, Sparkles, GraduationCap } from "lucide-react"
import Image from 'next/image'
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { toast } from "sonner"
import { useState, useMemo } from "react"
import { Input } from "./ui/input"
import { QueryCustomization } from './query-customization'
import { useLocalStorage } from '../hooks/use-local-storage'

interface CareerPosition {
  title: string
  company: string
  duration: string
  highlights?: string[]
}

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
    professionalBackground?: string
    careerHistory?: CareerPosition[]
  }
  projectName: string
  onDelete?: () => void
  onImageSelect?: (imageUrl: string) => void
}

// Wes Anderson inspired pastel colors
const PASTEL_COLORS = [
  { bg: 'bg-[#f8d3d3] hover:bg-[#f4bebe]', text: 'text-[#a85d5d]' }, // Soft coral
  { bg: 'bg-[#e6f2d9] hover:bg-[#d8ebc3]', text: 'text-[#5c8c3e]' }, // Mint cream
  { bg: 'bg-[#d9e6f2] hover:bg-[#c3d8eb]', text: 'text-[#3e5c8c]' }, // Baby blue
  { bg: 'bg-[#f2e6d9] hover:bg-[#ebd3c3]', text: 'text-[#8c5c3e]' }, // Peach
  { bg: 'bg-[#e6d9f2] hover:bg-[#d3c3eb]', text: 'text-[#5c3e8c]' }, // Lavender
  { bg: 'bg-[#f2f2d9] hover:bg-[#ebebb3]', text: 'text-[#8c8c3e]' }, // Butter
  { bg: 'bg-[#f2d9e6] hover:bg-[#ebc3d8]', text: 'text-[#8c3e5c]' }, // Rose
  { bg: 'bg-[#d9f2e6] hover:bg-[#c3ebd8]', text: 'text-[#3e8c5c]' }, // Seafoam
  { bg: 'bg-[#f2d9d9] hover:bg-[#ebc3c3]', text: 'text-[#8c3e3e]' }, // Dusty rose
  { bg: 'bg-[#e6e6f2] hover:bg-[#d3d3eb]', text: 'text-[#3e3e8c]' }, // Periwinkle
];

interface SearchBarProps {
  onSearch: (query: string) => void
  selectedTags: string[]
  onTagRemove: (tag: string) => void
}

function SearchBar({ onSearch, selectedTags, onTagRemove }: SearchBarProps) {
  return (
    <div className="mb-6 space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search by name, role, or expertise..."
          className="pl-10"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100"
            >
              {tag}
              <button
                onClick={() => onTagRemove(tag)}
                className="ml-1 hover:text-blue-900"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

// Default queries
const DEFAULT_QUERIES = {
  serper: "Find information about {{name}} who works at {{company}} including their background, achievements, and expertise",
  perplexity: "Tell me about {{name}}'s professional background at {{company}}, focusing on their key achievements and areas of expertise"
}

export function MinimalProfileCardContainer({ 
  processedEntries, 
  entriesToProcess,
  projectName,
  onDelete,
  onImageSelect 
}: { 
  processedEntries: any[],
  entriesToProcess: any[],
  projectName: string,
  onDelete?: (id: string) => void,
  onImageSelect?: (id: string, imageUrl: string) => void
}) {
  const [customQueries, setCustomQueries] = useLocalStorage('custom-queries', DEFAULT_QUERIES)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleTagClick = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const handleTagRemove = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag))
  }

  const filteredCards = useMemo(() => {
    const allEntries = [...processedEntries, ...entriesToProcess]
      .filter((entry): entry is any & { combinedData: NonNullable<any> } => 
        entry.combinedData !== null && entry.combinedData !== undefined
      );

    return allEntries.filter(entry => {
      const matchesSearch = searchQuery.toLowerCase().trim() === "" ||
        entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.combinedData.currentRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.combinedData.conciseRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.combinedData.expertiseAreas.some((area: string) => 
          area.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesTags = selectedTags.length === 0 ||
        selectedTags.every(tag => 
          entry.combinedData.expertiseAreas.some((area: string) => 
            area.toLowerCase() === tag.toLowerCase()
          )
        );

      return matchesSearch && matchesTags;
    });
  }, [processedEntries, entriesToProcess, searchQuery, selectedTags]);

  return (
    <div className="relative">
      <QueryCustomization
        defaultQueries={customQueries}
        onSave={setCustomQueries}
      />
      <SearchBar
        onSearch={handleSearch}
        selectedTags={selectedTags}
        onTagRemove={handleTagRemove}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCards.map((entry) => (
          <MinimalProfileCard
            key={entry.id}
            data={{
              id: entry.databaseId ? parseInt(entry.databaseId.toString()) : undefined,
              name: entry.name,
              profilePhoto: entry.profileImage || entry.combinedData.profilePhoto || '',
              linkedinURL: entry.linkedinUrl || entry.combinedData.linkedinURL || '',
              currentRole: entry.combinedData.currentRole || '',
              conciseRole: entry.combinedData.conciseRole || entry.combinedData.currentRole || '',
              company: entry.company,
              keyAchievements: entry.combinedData.keyAchievements || [],
              expertiseAreas: entry.combinedData.expertiseAreas || [],
              profile_image_options: entry.profileImageOptions || [],
              professionalBackground: entry.combinedData.professionalBackground,
              careerHistory: entry.combinedData.careerHistory
            }}
            projectName={projectName}
            onDelete={() => onDelete?.(entry.id)}
            onImageSelect={(imageUrl) => onImageSelect?.(entry.id, imageUrl)}
            onTagClick={handleTagClick}
          />
        ))}
      </div>
      {filteredCards.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No cards match your search criteria
        </div>
      )}
    </div>
  )
}

export function MinimalProfileCard({ data, projectName, onDelete, onImageSelect, onTagClick }: MinimalProfileCardProps & { onTagClick?: (tag: string) => void }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showAllAchievements, setShowAllAchievements] = useState(false)
  const [showAllHistory, setShowAllHistory] = useState(false)
  const [showFullBackground, setShowFullBackground] = useState(false)

  // Randomize colors but keep them consistent for each card
  const tagColors = useMemo(() => {
    if (!data.expertiseAreas) return [];
    const shuffled = [...PASTEL_COLORS].sort(() => Math.random() - 0.5);
    return data.expertiseAreas.map((_, index) => shuffled[index % shuffled.length]);
  }, [data.expertiseAreas]);

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
      onImageSelect(currentImage)
    }
  }

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow duration-200 relative group min-h-[420px] flex flex-col">
      <div className="space-y-4 flex-1">
        {/* Top Section: Image and Content */}
        <div className="flex gap-4">
          {/* Profile Image Section */}
          <div 
            className="relative w-32 h-32 flex-shrink-0"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {currentImage ? (
              <Image
                src={currentImage}
                alt={`${data.name}'s profile`}
                width={128}
                height={128}
                className="rounded-lg object-cover w-full h-full shadow-sm"
                unoptimized
              />
            ) : (
              <div className="w-full h-full rounded-lg bg-gray-100 flex items-center justify-center shadow-sm">
                <span className="text-gray-400 text-sm">No Image</span>
              </div>
            )}
            {isHovered && images.length > 1 && (
              <div className="absolute inset-0 flex items-center justify-between bg-black bg-opacity-40 rounded-lg">
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="p-1.5 text-white hover:bg-black hover:bg-opacity-20 transition-colors"
                  title="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleSelectImage}
                  className="p-1.5 text-white hover:bg-black hover:bg-opacity-20 transition-colors"
                  title="Set as profile image"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="p-1.5 text-white hover:bg-black hover:bg-opacity-20 transition-colors"
                  title="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <div className="space-y-2.5 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-base capitalize truncate leading-tight">
                    {data.name}
                  </h3>
                  {data.linkedinURL && data.linkedinURL !== 'Not found' && (
                    <a
                      href={data.linkedinURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 p-1 rounded-full hover:bg-blue-50 transition-colors"
                      title="View LinkedIn Profile"
                    >
                      <LinkedinIcon className="w-4 h-4" />
                    </a>
                  )}
                </div>
                {data.careerHistory && data.careerHistory.length > 0 && (
                  <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                    <Briefcase className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-700 truncate">{data.careerHistory[0].title}</p>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span className="truncate">{data.careerHistory[0].company}</span>
                        <span className="text-gray-300 flex-shrink-0">•</span>
                        <span className="text-gray-400 flex-shrink-0">{data.careerHistory[0].duration}</span>
                      </div>
                    </div>
                  </div>
                )}
                {/* Expertise Tags */}
                {data.expertiseAreas && data.expertiseAreas.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {data.expertiseAreas.map((area, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className={`text-xs capitalize px-2 py-0.5 font-medium transition-all duration-200 ease-in-out transform hover:scale-[1.02] shadow-sm cursor-pointer ${tagColors[index % tagColors.length].bg} ${tagColors[index % tagColors.length].text} border-0`}
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
        </div>

        {/* Middle Section: Key Achievements */}
        {data.keyAchievements && data.keyAchievements.length > 0 && (
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-blue-500" />
              <h4 className="text-sm font-medium text-gray-700">Key Achievements</h4>
            </div>
            <div className="space-y-1.5">
              {data.keyAchievements.slice(0, showAllAchievements ? undefined : 3).map((achievement, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0 opacity-60" />
                  <p className="text-xs text-gray-600 leading-relaxed">{achievement}</p>
                </div>
              ))}
            </div>
            {data.keyAchievements.length > 3 && (
              <button
                onClick={() => setShowAllAchievements(!showAllAchievements)}
                className="text-xs text-blue-600 hover:text-blue-700 mt-2 flex items-center gap-0.5 group/btn"
              >
                {showAllAchievements ? (
                  <>
                    Show less
                    <ChevronUp className="w-3 h-3 group-hover/btn:-translate-y-0.5 transition-transform" />
                  </>
                ) : (
                  <>
                    Show {data.keyAchievements.length - 3} more achievements
                    <ChevronDown className="w-3 h-3 group-hover/btn:translate-y-0.5 transition-transform" />
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Career History Section */}
        {data.careerHistory && data.careerHistory.length > 0 && (
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="w-4 h-4 text-purple-500" />
              <h4 className="text-sm font-medium text-gray-700">Career Journey</h4>
            </div>
            <div className="space-y-2.5">
              {data.careerHistory.slice(0, showAllHistory ? undefined : 1).map((position, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0 opacity-60" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700">{position.title}</p>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span>{position.company}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-gray-400">{position.duration}</span>
                      </div>
                      {position.highlights && position.highlights.length > 0 && (
                        <ul className="mt-1 space-y-0.5 list-inside">
                          {position.highlights.map((highlight, hIndex) => (
                            <li key={hIndex} className="text-xs text-gray-600 pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-gray-400 before:text-[8px] before:top-[2px]">
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
            {data.careerHistory.length > 1 && (
              <button
                onClick={() => setShowAllHistory(!showAllHistory)}
                className="text-xs text-blue-600 hover:text-blue-700 mt-2 flex items-center gap-0.5 group/btn"
              >
                {showAllHistory ? (
                  <>
                    Show less
                    <ChevronUp className="w-3 h-3 group-hover/btn:-translate-y-0.5 transition-transform" />
                  </>
                ) : (
                  <>
                    Show {data.careerHistory.length - 1} more positions
                    <ChevronDown className="w-3 h-3 group-hover/btn:translate-y-0.5 transition-transform" />
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Professional Background Section */}
        {data.professionalBackground && (
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-4 h-4 text-emerald-500" />
              <h4 className="text-sm font-medium text-gray-700">Professional Background</h4>
            </div>
            <div>
              <p className={`text-xs text-gray-600 leading-relaxed ${!showFullBackground ? "line-clamp-2" : ""}`}>
                {data.professionalBackground}
              </p>
              <button
                onClick={() => setShowFullBackground(!showFullBackground)}
                className="text-xs text-blue-600 hover:text-blue-700 mt-1 flex items-center gap-0.5 group/btn"
              >
                {showFullBackground ? (
                  <>
                    Show less
                    <ChevronUp className="w-3 h-3 group-hover/btn:-translate-y-0.5 transition-transform" />
                  </>
                ) : (
                  <>
                    Read more
                    <ChevronDown className="w-3 h-3 group-hover/btn:translate-y-0.5 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-all duration-200 opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-red-50"
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