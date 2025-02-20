import { useState, useEffect, useCallback, useMemo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Loader2, Plus, FolderPlus, Sparkles } from 'lucide-react'
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

  // Load projects with error handling
  const fetchProjects = useCallback(async () => {
    try {
      console.log('Fetching projects...');
      const response = await fetch('/api/list-projects');
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        return []; // Return empty array instead of throwing
      }

      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.error('JSON Parse Error:', e);
        return []; // Return empty array on parse error
      }

      if (!data || !Array.isArray(data.projects)) {
        console.warn('Unexpected API response format:', data);
        return [];
      }

      return data.projects;
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Unable to load existing projects');
      return []; // Return empty array on any error
    }
  }, []);

  // Load projects and handle initial value
  useEffect(() => {
    let isMounted = true

    const loadProjects = async () => {
      setIsLoading(true)
      try {
        const data = await fetchProjects()
        if (isMounted) {
          setProjects(data)
          
          // Only clear the value if we have projects loaded AND the value doesn't exist
          if (value && data.length > 0 && !data.some((p: Project) => p.name === value)) {
            console.log('Selected project not found in projects list:', value);
            onChange('');
          }
        }
      } catch (error) {
        console.error('Error in loadProjects:', error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadProjects()

    return () => {
      isMounted = false
    }
  }, [fetchProjects])  // Remove value and onChange from dependencies to prevent clearing

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
      // Check if project already exists locally
      if (projects.some(p => p.name.toLowerCase() === newProjectName.toLowerCase())) {
        toast.error('A project with this name already exists');
        setIsCreating(false);
        return;
      }

      // Instead of creating in DB immediately, just update local state
      const newProject = {
        name: newProjectName,
        created_at: new Date().toISOString()
      };

      // Update local projects list
      setProjects([...projects, newProject]);
      
      // Set as selected project
      onChange(newProjectName);
      setShowNewProjectDialog(false);
      toast.success('New project created successfully');

    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    } finally {
      setIsCreating(false);
      setNewProjectName("");
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-4">
        <Select 
          value={value || ""}
          onValueChange={onChange}
          disabled={disabled || isLoading}
        >
          <SelectTrigger className="w-[250px]">
            <SelectValue>
              {value || (
                <span className="text-gray-400">Choose your project</span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {projects.length > 0 ? (
              projects.map((project) => (
                <SelectItem key={project.name} value={project.name}>
                  <div className="flex items-center justify-between w-full">
                    <span>{project.name}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(project.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </SelectItem>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading projects...</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p>No projects found</p>
                    <p className="text-sm text-blue-500">Create your first one!</p>
                  </div>
                )}
              </div>
            )}
          </SelectContent>
        </Select>

        <Button
          onClick={() => setShowNewProjectDialog(true)}
          disabled={disabled || isLoading}
          className="relative group bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2 pl-4 pr-5"
        >
          <Sparkles className="w-4 h-4 animate-pulse" />
          Create Project
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Start something amazing!
          </div>
        </Button>
      </div>

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