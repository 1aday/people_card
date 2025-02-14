import { Card } from "@/components/ui/card"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <h1 className="text-2xl font-bold text-primary">People Cards</h1>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Card className="w-full h-[400px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-gray-500 mb-2">
              Drag and drop your files here
            </p>
            <p className="text-sm text-gray-400">
              or click to select files
            </p>
          </div>
        </Card>
      </div>
    </main>
  )
} 