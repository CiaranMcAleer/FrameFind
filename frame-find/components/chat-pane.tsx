"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, Loader2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface ChatMessage {
  role: "user" | "assistant"
  content: string | React.ReactNode // Allow ReactNode for tool buttons
  toolCall?: { toolName: string; args: any } // Optional: store tool call info
}

interface SearchResult {
  text: string
  score: number
  source: string
  frame: number
}

interface ChatPaneProps {
  currentQuery: string
  searchResults: SearchResult[]
}

export function ChatPane({ currentQuery, searchResults }: ChatPaneProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const [currentProvider, setCurrentProvider] = useState<string>("")
  const [currentModel, setCurrentModel] = useState<string>("")

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    // Load selected provider and model from local storage
    const storedProvider = localStorage.getItem("selectedAIProvider") || "mock"
    const storedModel = localStorage.getItem("selectedAIModel") || "mock-model-1"
    setCurrentProvider(storedProvider)
    setCurrentModel(storedModel)
  }, [])

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return

    const newUserMessage: ChatMessage = { role: "user", content: message }
    const updatedMessages = [...messages, newUserMessage]
    setMessages(updatedMessages)
    setInput("")
    setLoading(true)

    // Prepare history for the API call
    const historyForAPI = updatedMessages.map((msg) => {
      let contentString: string
      if (msg.role === "assistant" && msg.toolCall) {
        // If it's an assistant message with a tool call, describe the tool action
        if (msg.toolCall.toolName === "search_query") {
          contentString = `AI suggested a search query: "${msg.toolCall.args.query}"`
        } else {
          contentString = `[AI used tool: ${msg.toolCall.toolName}]`
        }
      } else if (typeof msg.content === "string") {
        contentString = msg.content
      } else {
        // Fallback for other ReactNodes if any, though for now it's just the tool button
        contentString = `[${msg.role} message with non-text content]`
      }
      return { role: msg.role, content: contentString }
    })

    try {
      // Retrieve selected AI provider and model from local storage
      const selectedAIProvider = localStorage.getItem("selectedAIProvider") || "mock"
      const selectedAIModel = localStorage.getItem("selectedAIModel") || "mock-model-1"

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: message, // The latest user query
          providerId: selectedAIProvider,
          modelId: selectedAIModel,
          currentQuery: currentQuery,
          searchResults: searchResults,
          history: historyForAPI.slice(0, -1), // All messages except the very last user message (which is 'query')
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to get AI response")
      }

      let assistantContent: string | React.ReactNode = data.response
      let toolCallInfo: { toolName: string; args: any } | undefined = undefined

      // Check for tool calls
      if (data.response && typeof data.response === "object" && data.response.tool_calls) {
        const toolCalls = data.response.tool_calls
        const searchQueryTool = toolCalls.find((tool: any) => tool.toolName === "search_query")

        if (searchQueryTool) {
          const newSearchQuery = searchQueryTool.args.query
          assistantContent = (
            <div className="flex flex-col gap-2">
              <p>I've generated a refined search query for you:</p>
              <Button
                onClick={() => router.push(`/search?q=${encodeURIComponent(newSearchQuery)}`)}
                className="w-full justify-center"
              >
                Search for: "{newSearchQuery}"
              </Button>
            </div>
          )
          toolCallInfo = { toolName: searchQueryTool.toolName, args: searchQueryTool.args }
        }
      }

      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "assistant", content: assistantContent, toolCall: toolCallInfo },
      ])
    } catch (error: any) {
      console.error("Error sending message to AI:", error)
      setMessages((prevMessages) => [...prevMessages, { role: "assistant", content: `Error: ${error.message}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-120px)]">
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        AI Model: {currentProvider} / {currentModel}
      </div>
      <ScrollArea className="flex-1 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 mb-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400">
              Start a conversation to refine your search or ask questions about the documents.
              <br />
              Try asking: "Refine search for quantum computing"
            </div>
          )}
          {messages.map((msg, index) => (
            <div
              key={index}
              className={cn("flex items-start gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
            >
              {msg.role === "assistant" && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" alt="AI" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "rounded-lg p-3 max-w-[80%]",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-50",
                )}
              >
                {/* Removed the inner <p> tag to fix the hydration error */}
                {typeof msg.content === "string" ? <p className="text-sm">{msg.content}</p> : msg.content}
              </div>
              {msg.role === "user" && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                  <AvatarFallback>You</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-3 justify-start">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg?height=32&width=32" alt="AI" />
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
              <div className="rounded-lg p-3 bg-gray-200 dark:bg-gray-700">
                <Loader2 className="h-4 w-4 animate-spin text-gray-600 dark:text-gray-400" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <div className="flex items-center gap-2">
        <Input
          placeholder="Ask a follow-up question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !loading) {
              handleSendMessage(input)
            }
          }}
          className="flex-1"
          disabled={loading}
        />
        <Button onClick={() => handleSendMessage(input)} disabled={loading || !input.trim()}>
          <Send className="h-4 w-4" />
          <span className="sr-only">Send message</span>
        </Button>
      </div>
    </div>
  )
}
