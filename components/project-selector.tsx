import { useState, useEffect, useCallback, useMemo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Loader2, Plus, FolderPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Input } from './ui/input'

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

  // Memoize the fetch function
  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch('/api/list-projects')
      if (!response.ok) throw new Error('Failed to fetch projects')
      const data = await response.json()
      return data.projects || []
    } catch (error) {
      console.error('Error loading projects:', error)
      toast.error('Failed to load projects')
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
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-4">
        <Select 
          value={value || ""}
          onValueChange={onChange}
          disabled={disabled || isLoading}
        >
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select a project">
              {value || "Select a project"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem key={project.name} value={project.name}>
                <div className="flex items-center justify-between w-full">
                  <span>{project.name}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowNewProjectDialog(true)}
          disabled={disabled || isLoading}
          className="relative group"
          title="Create New Project"
        >
          <FolderPlus className="w-4 h-4" />
          <span className="sr-only">Create New Project</span>
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Create New Project
          </div>
        </Button>
      </div>
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}

      <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Enter a name for your new project. Use alphanumeric characters, spaces, hyphens, and underscores only.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Input
                placeholder="Enter project name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="w-full"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isValidProjectName(newProjectName)) {
                    handleCreateProject();
                  }
                }}
              />
              {newProjectName && !isValidProjectName(newProjectName) && (
                <p className="text-xs text-red-500">
                  Project name must be at least 3 characters and contain only letters, numbers, spaces, hyphens, and underscores.
                </p>
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
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
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