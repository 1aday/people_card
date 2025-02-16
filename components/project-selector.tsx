import { useState, useEffect, useCallback, useMemo } from 'react'
import { Loader2, Sparkles, FolderPlus, ChevronDown, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Input } from './ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"

interface Project {
  name: string
  created_at: string
}

interface ProjectSelectorProps {
  value: string | undefined
  onChange: (value: string) => void
  disabled?: boolean
}

export function ProjectSelector({ value, onChange, disabled }: ProjectSelectorProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  // Enhanced error handling for project loading
  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch('/api/list-projects')
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch projects')
      }
      const data = await response.json()
      if (!data || !Array.isArray(data.projects)) {
        throw new Error('Invalid response format from server')
      }
      return data.projects || []
    } catch (error) {
      console.error('Error loading projects:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to load projects. Please try again.')
      return []
    }
  }, [])

  // Load projects only once on mount
  useEffect(() => {
    let isMounted = true

    const loadProjects = async () => {
      setIsLoading(true)
      const data = await fetchProjects()
      if (isMounted) {
        setProjects(data)
        setIsLoading(false)
      }
    }

    loadProjects()

    return () => {
      isMounted = false
    }
  }, [fetchProjects])

  // Validate project name
  const isValidProjectName = (name: string) => {
    return name.length >= 3 && /^[a-zA-Z0-9-_ ]+$/.test(name);
  };

  // Handle new project creation
  const handleCreateProject = async () => {
    if (!isValidProjectName(newProjectName)) {
      toast.error('Please enter a valid project name (at least 3 characters, alphanumeric with spaces, hyphens, and underscores only)');
      return;
    }

    setIsCreating(true);
    try {
      // Check if project already exists
      if (projects.some(p => p.name.toLowerCase() === newProjectName.toLowerCase())) {
        toast.error('A project with this name already exists');
        return;
      }

      // Create new project
      onChange(newProjectName);
      setShowNewProjectDialog(false);
      toast.success('New project created successfully');

      // Refresh projects list
      const updatedProjects = await fetchProjects();
      setProjects(updatedProjects);
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    } finally {
      setIsCreating(false);
      setNewProjectName("");
    }
  };

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-blue-50/80 via-purple-50/80 to-white">
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 25px 25px, rgba(0, 0, 0, 0.2) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(0, 0, 0, 0.2) 2%, transparent 0%)`,
            backgroundSize: '100px 100px',
          }}
        />
      </div>

      {/* Decorative Blobs */}
      <div className="fixed top-0 left-[-20%] w-[800px] h-[800px] bg-blue-400/10 rounded-full blur-3xl" />
      <div className="fixed bottom-0 right-[-20%] w-[800px] h-[800px] bg-purple-400/10 rounded-full blur-3xl" />
      <div className="fixed top-1/3 right-[-10%] w-[600px] h-[600px] bg-pink-400/10 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20">
        {/* Hero Text */}
        <div className="text-center space-y-8 mb-16">
          <h1 className="text-6xl sm:text-7xl lg:text-8xl xl:text-9xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent bg-[size:400%] animate-gradient">
              People Card Creator
            </span>
          </h1>
          <p className="text-xl sm:text-2xl lg:text-3xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Create beautiful, professional profile cards for your team members and colleagues in seconds.
          </p>
        </div>

        {/* Project Selection */}
        <div className="w-full max-w-lg space-y-8">
          {projects.length > 0 && !isLoading && (
            <div className="space-y-4">
              <h2 className="text-xl font-medium text-gray-700 text-center">Recent Projects</h2>
              <div className="grid gap-3">
                {projects.slice(0, 3).map((project) => (
                  <Button
                    key={project.name}
                    variant="outline"
                    className="w-full flex items-center justify-between py-6 px-6 bg-white/50 hover:bg-white/80 border-2 border-gray-200/50 hover:border-blue-300 transition-all duration-200 group"
                    onClick={() => onChange(project.name)}
                  >
                    <span className="font-medium text-lg">{project.name}</span>
                    <div className="flex items-center gap-3 text-gray-400 group-hover:text-blue-500">
                      <span className="text-sm">
                        {new Date(project.created_at).toLocaleDateString()}
                      </span>
                      <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Create Project Button */}
          <Button
            onClick={() => setShowNewProjectDialog(true)}
            disabled={disabled || isLoading}
            className="relative group w-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 hover:from-blue-700 hover:via-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-3 py-8 text-xl font-medium rounded-2xl bg-[size:400%] animate-gradient"
          >
            <Sparkles className="w-6 h-6 animate-pulse" />
            Create New Project
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/90 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none">
              Start something amazing!
            </div>
          </Button>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center gap-3 text-gray-500 py-4">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-lg">Loading your projects...</span>
            </div>
          )}
        </div>
      </div>

      {/* Project Creation Dialog */}
      <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Create New Project
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Give your project a memorable name. Use letters, numbers, spaces, hyphens, and underscores.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Input
                placeholder="Enter project name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="w-full text-lg"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isValidProjectName(newProjectName)) {
                    handleCreateProject();
                  }
                }}
              />
              {newProjectName && !isValidProjectName(newProjectName) && (
                <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md border border-red-200">
                  <p className="font-medium">Project name requirements:</p>
                  <ul className="list-disc pl-5 mt-1 text-xs space-y-1">
                    <li>At least 3 characters long</li>
                    <li>Can contain letters, numbers, spaces, hyphens, and underscores</li>
                    <li>No special characters or symbols</li>
                  </ul>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewProjectDialog(false);
                  setNewProjectName("");
                }}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateProject}
                disabled={!isValidProjectName(newProjectName) || isCreating}
                className={`${isValidProjectName(newProjectName) ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' : ''}`}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create Project
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 