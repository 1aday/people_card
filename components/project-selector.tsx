import { useState, useEffect, useCallback, useMemo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface Project {
  name: string
  created_at: string
}

interface ProjectSelectorProps {
  value: string | undefined
  onChange: (value: string) => void
  disabled?: boolean
}

const NEW_PROJECT_VALUE = '_new_'

export function ProjectSelector({ value, onChange, disabled }: ProjectSelectorProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)

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

  // Memoize the value change handler
  const handleValueChange = useCallback((newValue: string) => {
    if (newValue === NEW_PROJECT_VALUE) {
      onChange('')
    } else {
      onChange(newValue)
    }
  }, [onChange])

  // Memoize the current value to prevent unnecessary re-renders
  const currentValue = useMemo(() => {
    return value || NEW_PROJECT_VALUE
  }, [value])

  // Memoize the project items to prevent unnecessary re-renders
  const projectItems = useMemo(() => {
    return projects.map((project) => (
      <SelectItem key={project.name} value={project.name}>
        {project.name}
        <span className="ml-2 text-xs text-gray-500">
          {new Date(project.created_at).toLocaleDateString()}
        </span>
      </SelectItem>
    ))
  }, [projects])

  // Memoize the create new project item
  const createNewProjectItem = useMemo(() => (
    <SelectItem value={NEW_PROJECT_VALUE} className="text-blue-600">
      <span className="flex items-center gap-2">
        <Plus className="w-4 h-4" />
        Create New Project
      </span>
    </SelectItem>
  ), [])

  return (
    <div className="flex items-center gap-2">
      <Select 
        defaultValue={NEW_PROJECT_VALUE}
        value={currentValue}
        onValueChange={handleValueChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className="w-[250px]">
          <SelectValue placeholder="Select a project">
            {currentValue === NEW_PROJECT_VALUE ? (
              <span className="flex items-center gap-2 text-blue-600">
                <Plus className="w-4 h-4" />
                Create New Project
              </span>
            ) : currentValue}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {createNewProjectItem}
          {projectItems}
        </SelectContent>
      </Select>
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
    </div>
  )
} 