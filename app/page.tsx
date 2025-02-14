import { Card } from "@/components/ui/card"
import DragDropArea from "@/components/drag-drop-area"

export default function Home() {
  return (
    <main className="min-h-screen p-4">
      <nav className="w-full bg-background border-b mb-8">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">People Card</h1>
        </div>
      </nav>
      
      <div className="container mx-auto">
        <Card className="w-full p-8">
          <DragDropArea />
        </Card>
      </div>
    </main>
  )
}
