import { useState, useEffect, useCallback, useMemo } from 'react'
import { Loader2, Sparkles, FolderPlus, ChevronDown } from 'lucide-react'
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
    <div className="min-h-[400px] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          opacity: 0.5
        }}/>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto pt-16 px-4">
        <div className="text-center space-y-6 mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            People Card Creator
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create beautiful, professional profile cards for your team members and colleagues. Start by selecting a project or creating a new one.
          </p>
        </div>

        <div className="flex flex-col items-center gap-6">
          {/* Project Selection */}
          {projects.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-72 justify-between items-center font-medium border-2"
                  disabled={disabled || isLoading}
                >
                  {value || "Choose a project"}
                  <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72">
                {projects.map((project) => (
                  <DropdownMenuItem
                    key={project.name}
                    onClick={() => onChange(project.name)}
                    className="flex items-center justify-between py-2"
                  >
                    <span>{project.name}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(project.created_at).toLocaleDateString()}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Create Project Button */}
          <Button
            onClick={() => setShowNewProjectDialog(true)}
            disabled={disabled || isLoading}
            className="relative group bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2 px-8 py-6 text-lg rounded-xl"
          >
            <Sparkles className="w-5 h-5 animate-pulse" />
            Create New Project
            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Start something amazing!
            </div>
          </Button>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading your projects...</span>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && projects.length === 0 && (
            <p className="text-gray-500 text-center mt-4">
              No projects yet. Create your first one to get started!
            </p>
          )}
        </div>
      </div>

      {/* Project Creation Dialog */}
      <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
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
                className={`${isValidProjectName(newProjectName) ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600' : ''}`}
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