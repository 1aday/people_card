import { Card } from "./ui/card"
import { LinkedinIcon } from "lucide-react"
import Image from 'next/image'

interface MinimalProfileCardProps {
  data: {
    name: string
    profilePhoto: string
    linkedinURL: string
    currentRole: string
    conciseRole: string
    company?: string
  }
}

export function MinimalProfileCard({ data }: MinimalProfileCardProps) {
  return (
    <Card className="p-4 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start space-x-4">
        <div className="relative w-16 h-16 flex-shrink-0">
          <Image
            src={data.profilePhoto}
            alt={`${data.name}'s profile`}
            width={64}
            height={64}
            className="rounded-full object-cover"
            unoptimized
          />
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