import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { 
  LinkedinIcon, 
  ChevronDown, 
  ChevronUp, 
  Trophy,
  Briefcase
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
  }
}

export function ProfileCard({ data }: ProfileCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="p-6 h-full flex flex-col">
      {/* Header Section */}
      <div className="flex items-start space-x-4 mb-6">
        <Image 
          src={data.profilePhoto} 
          alt="Profile" 
          className="w-24 h-24 rounded-full object-cover"
          width={96}
          height={96}
        />
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-1">{data.name}</h2>
              <h3 className="text-lg text-gray-600">{data.currentRole}</h3>
            </div>
            <a 
              href={data.linkedinURL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600"
            >
              <LinkedinIcon className="w-6 h-6" />
            </a>
          </div>
        </div>
      </div>

      {/* Key Achievements */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-500 mb-2 flex items-center">
          <Trophy className="w-4 h-4 mr-2" />
          Key Achievements
        </h4>
        <ul className="space-y-2">
          {data.keyAchievements.slice(0, 3).map((achievement, index) => (
            <li key={index} className="flex items-start">
              <span className="text-sm text-gray-600 flex-1">
                • {achievement}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Professional Background */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-500 mb-2">Background</h4>
        <p className="text-sm text-gray-600 line-clamp-3">
          {data.professionalBackground}
        </p>
      </div>

      {/* Career History */}
      <div className="mb-6 flex-1">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-500 flex items-center">
            <Briefcase className="w-4 h-4 mr-2" />
            Career History
          </h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        {isExpanded ? (
          <div className="space-y-4">
            {data.careerHistory.map((role, index) => (
              <div key={index} className="border-l-2 border-gray-200 pl-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="text-sm font-semibold">{role.title}</h5>
                    <p className="text-sm text-gray-600">{role.company}</p>
                  </div>
                  <span className="text-xs text-gray-500">{role.duration}</span>
                </div>
                <ul className="mt-2">
                  {role.highlights.slice(0, 2).map((highlight, i) => (
                    <li key={i} className="text-xs text-gray-600">
                      • {highlight}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            {data.careerHistory.length} previous roles
          </p>
        )}
      </div>

      {/* Expertise Areas */}
      <div className="mt-auto">
        <div className="flex flex-wrap gap-2">
          {data.expertiseAreas.slice(0, 5).map((area, index) => (
            <Badge 
              key={index}
              variant="secondary"
              className="text-xs"
            >
              {area}
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  )
} 