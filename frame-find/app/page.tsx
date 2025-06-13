import { SearchBar } from "@/components/search-bar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Settings } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4">
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        <ModeToggle />
        <Link href="/settings">
          <Button variant="ghost" size="icon" aria-label="Settings">
            <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </Button>
        </Link>
      </div>
      <div className="flex flex-col items-center space-y-6">
        <h1 className="text-6xl font-extrabold text-primary dark:text-primary tracking-tight">
          Frame<span className="text-primary dark:text-primary">Find</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-md text-center">
          Your AI-powered search engine for document archives.
        </p>
        <SearchBar />
      </div>
    </div>
  )
}
