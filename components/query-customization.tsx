import { useState } from 'react'
import { Settings } from 'lucide-react'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

interface QueryCustomizationProps {
  onSave: (queries: { serper: string; perplexity: string }) => void
  defaultQueries: {
    serper: string
    perplexity: string
  }
}

export function QueryCustomization({ onSave, defaultQueries }: QueryCustomizationProps) {
  const [queries, setQueries] = useState(defaultQueries)
  const [isOpen, setIsOpen] = useState(false)

  const handleSave = () => {
    onSave(queries)
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 hover:bg-gray-100 rounded-full"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Customize Search Queries</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <Tabs defaultValue="serper">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="serper">Serper Query</TabsTrigger>
              <TabsTrigger value="perplexity">Perplexity Query</TabsTrigger>
            </TabsList>
            <TabsContent value="serper" className="space-y-4">
              <div className="space-y-2">
                <Label>
                  Serper Search Query Template
                  <span className="text-sm text-gray-500 ml-2">
                    (Use {'{{'} name {'}}'}, {'{{'} company {'}}'}, etc. for dynamic variables)
                  </span>
                </Label>
                <Textarea
                  value={queries.serper}
                  onChange={(e) => setQueries({ ...queries, serper: e.target.value })}
                  className="min-h-[150px]"
                  placeholder="Enter your custom Serper search query..."
                />
              </div>
            </TabsContent>
            <TabsContent value="perplexity" className="space-y-4">
              <div className="space-y-2">
                <Label>
                  Perplexity Query Template
                  <span className="text-sm text-gray-500 ml-2">
                    (Use {'{{'} name {'}}'}, {'{{'} company {'}}'}, etc. for dynamic variables)
                  </span>
                </Label>
                <Textarea
                  value={queries.perplexity}
                  onChange={(e) => setQueries({ ...queries, perplexity: e.target.value })}
                  className="min-h-[150px]"
                  placeholder="Enter your custom Perplexity query..."
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 