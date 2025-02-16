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
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
      <h1 className="text-[80px] font-normal bg-gradient-to-r from-[#4169E1] to-[#9400D3] bg-clip-text text-transparent mb-8">
        People Card Creator
      </h1>
      
      <Button 
        onClick={() => setShowDialog(true)}
        className="bg-[#0F172A] hover:bg-[#1E293B] text-white text-xl rounded-lg px-6 py-3 flex items-center gap-2"
      >
        <Sparkles className="h-5 w-5" />
        Create New Project
      </Button>

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
    </div>
  )
}