import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Button } from './ui/button'
import { Dialog, DialogContent } from './ui/dialog'
import { Input } from './ui/input'

interface ProjectSelectorProps {
  value: string | undefined
  onChange: (value: string) => void
  disabled?: boolean
}

export function ProjectSelector({ onChange, disabled }: ProjectSelectorProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [projectName, setProjectName] = useState("")

  return (
    <main className="h-screen grid place-items-center">
      <div className="text-center">
        <h1 className="text-7xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          People Card Creator
        </h1>
        
        <Button 
          onClick={() => setShowDialog(true)}
          className="text-2xl h-auto py-6 px-8"
        >
          <Sparkles className="mr-2 h-6 w-6" />
          Create New Project
        </Button>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <Input
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            placeholder="Project name"
            onKeyDown={e => {
              if (e.key === 'Enter' && projectName.length >= 3) {
                onChange(projectName)
                setShowDialog(false)
                setProjectName("")
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </main>
  )
}