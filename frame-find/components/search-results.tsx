import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface SearchResult {
  text: string
  score: number
  source: string
  frame: number
}

interface SearchResultsProps {
  results: SearchResult[]
}

export function SearchResults({ results }: SearchResultsProps) {
  return (
    <div className="space-y-4">
      {results.map((result, index) => (
        <Card key={index} className="bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
              Source: {result.source}
            </CardTitle>
            <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
              Relevance Score: {result.score.toFixed(4)} | Frame: {result.frame}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{result.text}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
