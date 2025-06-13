"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"

interface SearchBarProps {
  initialQuery?: string
  onSearch?: (query: string) => void
}

export function SearchBar({ initialQuery = "", onSearch }: SearchBarProps) {
  const [query, setQuery] = React.useState(initialQuery)
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(query)
    } else {
      router.push(`/search?q=${encodeURIComponent(query)}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-lg items-center space-x-2">
      <Input
        type="text"
        placeholder="Search your documents..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="flex-1 px-4 py-2 rounded-full shadow-sm focus-visible:ring-primary"
      />
      <Button type="submit" size="icon" className="rounded-full bg-primary hover:bg-primary/90">
        <Search className="h-5 w-5" />
        <span className="sr-only">Search</span>
      </Button>
    </form>
  )
}
