import { Suspense } from 'react'
import ProjectViewClient from './client'

type Props = {
  params: { project: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function ProjectView({ params }: Props) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAFAFA]">
        <nav className="w-full bg-white border-b border-gray-100">
          <div className="container mx-auto px-8 h-[72px] flex items-center">
            <h1 className="text-2xl text-black font-[600] tracking-[-0.02em]">
              People<span className="font-[800] text-blue-600">.</span>
            </h1>
          </div>
        </nav>
        <div className="container mx-auto px-8 py-10">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    }>
      <ProjectViewClient projectName={params.project} />
    </Suspense>
  )
} 