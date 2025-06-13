"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { SearchBar } from "@/components/search-bar"
import { SearchResults } from "@/components/search-results"
import { ChatPane } from "@/components/chat-pane"
import { Button } from "@/components/ui/button"
import { Loader2, Home, Settings } from "lucide-react"
import Link from "next/link"
import { ModeToggle } from "@/components/mode-toggle"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams.get("q") || ""
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchDuration, setSearchDuration] = useState<number | null>(null)
  const [numResults, setNumResults] = useState<number | null>(null)
  const [maxRelevanceScore, setMaxRelevanceScore] = useState<number | null>(null)

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setSearchDuration(null)
      setNumResults(null)
      setMaxRelevanceScore(null)
      return
    }
    setLoading(true)
    setError(null)
    setSearchDuration(null)
    setNumResults(null)
    setMaxRelevanceScore(null)

    const startTime = Date.now()
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: searchQuery }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch search results")
      }
      setResults(data)

      const endTime = Date.now()
      setSearchDuration(endTime - startTime)
      setNumResults(data.length)
      const maxScore = data.length > 0 ? Math.max(...data.map((r: any) => r.score)) : 0
      setMaxRelevanceScore(maxScore)
    } catch (err: any) {
      setError(err.message)
      setResults([])
      setSearchDuration(null)
      setNumResults(null)
      setMaxRelevanceScore(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery)
      performSearch(initialQuery)
    }
  }, [initialQuery])

  const handleSearchSubmit = (newQuery: string) => {
    setQuery(newQuery)
    router.push(`/search?q=${encodeURIComponent(newQuery)}`)
    performSearch(newQuery)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="ghost" size="icon" aria-label="Home">
              <Home className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
            Frame<span className="text-primary dark:text-primary">Find</span>
          </h1>
        </div>
        <div className="flex-grow max-w-xl mx-auto">
          <SearchBar initialQuery={query} onSearch={handleSearchSubmit} />
        </div>
        <div className="flex items-center space-x-2">
          <ModeToggle />
          <Link href="/settings">
            <Button variant="ghost" size="icon" aria-label="Settings">
              <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        <div className="flex-1 p-6 overflow-y-auto">
          {loading && (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="sr-only">Loading...</span>
            </div>
          )}
          {error && <div className="text-red-500 text-center p-4">{error}</div>}
          {!loading && !error && results.length === 0 && query && (
            <div className="text-center text-gray-500 dark:text-gray-400 p-4">No results found for "{query}".</div>
          )}
          {!loading && !error && results.length > 0 && (
            <>
              <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                {numResults !== null && (
                  <span>
                    Found {numResults} results in {searchDuration?.toFixed(2)} ms.
                  </span>
                )}
                {maxRelevanceScore !== null && (
                  <span className="ml-4">Max Relevance: {maxRelevanceScore.toFixed(4)}</span>
                )}
              </div>
              <SearchResults results={results} />
            </>
          )}
        </div>
        <aside className="w-96 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 overflow-y-auto flex-shrink-0">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-50">Chat with AI</h2>
          <ChatPane currentQuery={query} searchResults={results} />
        </aside>
      </main>
    </div>
  )
}
