import { NextResponse } from "next/server"
import { tool } from "ai"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { CoreMessage } from "ai" // Import CoreMessage type

// Define the tool for generating a new search query
const searchTool = tool({
  description: "Generates a new search query based on user's request to refine search.",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The refined search query.",
      },
    },
    required: ["query"],
  },
})

const MOCK_CHAT_RESPONSES = [
  "Hello! I am a mock AI assistant. How can I help you with your documents today?",
  "That's an interesting query. In a real scenario, I would provide a detailed answer based on your documents.",
  "My purpose is to help you refine your search. What specific information are you looking for?",
  "I can tell you that the documents contain information on various topics, including technology, history, and science.",
  "Please feel free to ask me anything about the documents you've uploaded.",
]
let chatResponseIndex = 0 // This will reset on server restart, which is fine for mock

export async function POST(req: Request) {
  const { query, providerId, modelId, currentQuery, searchResults, history } = await req.json()
  console.log(`Chat received for query: "${query}", Provider: ${providerId}, Model: ${modelId}`)
  console.log(`Current Search Query: "${currentQuery}"`)
  console.log(`Search Results Context: ${JSON.stringify(searchResults)}`)
  console.log(`Conversation History: ${JSON.stringify(history)}`)

  // Simulate a delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  let assistantContent: string | { tool_calls: any[] } = ""

  // Construct system prompt with search context
  let systemPrompt = `You are an AI assistant for a document search engine. The user has performed a search with the query: "${currentQuery}".`
  if (searchResults && searchResults.length > 0) {
    const resultsSummary = searchResults
      .slice(0, 3) // Limit to top 3 results for brevity
      .map((r: any) => `Source: ${r.source}, Text: "${r.text.substring(0, Math.min(r.text.length, 100))}..."`) // Truncate text
      .join("\n")
    systemPrompt += ` Here are the top search results relevant to their query:\n${resultsSummary}.`
  }
  systemPrompt += ` Use this information to answer their questions or refine their search. If the user asks to refine their search or asks for a new query, use the 'search_query' tool.`

  try {
    if (providerId === "mock") {
      if (modelId === "mock-model-3") {
        // Specific behavior for mock-model-3: use tool if "query" is in message
        if (query.toLowerCase().includes("query")) {
          const refinedQuery = query.replace(/query/i, "").trim() || "refined search"
          assistantContent = {
            tool_calls: [
              {
                toolName: "search_query",
                args: { query: refinedQuery },
              },
            ],
          }
        } else {
          // Detailed context for mock-model-3
          const detailedResults = searchResults
            .map(
              (r: any) =>
                `Source: ${r.source}, Score: ${r.score.toFixed(2)}, Text: "${r.text.substring(0, Math.min(r.text.length, 80))}..."`,
            )
            .join("\n- ")
          assistantContent = `You asked: "${query}".\n\nCurrent search query: "${currentQuery}".\n\nFound ${searchResults.length} results:\n- ${detailedResults || "No results."}`
        }
      } else {
        // Original mock behavior for other mock models
        assistantContent = MOCK_CHAT_RESPONSES[chatResponseIndex % MOCK_CHAT_RESPONSES.length]
        chatResponseIndex++
      }
    } else if (providerId === "openai" && process.env.OPENAI_API_KEY) {
      const model = openai(modelId)
      const { text, toolCalls } = await generateText({
        model,
        system: systemPrompt,
        messages: history as CoreMessage[], // Pass the conversation history
        prompt: query,
        tools: { search_query: searchTool },
      })

      if (toolCalls && toolCalls.length > 0) {
        assistantContent = { tool_calls: toolCalls }
      } else {
        assistantContent = text
      }
    } else if (providerId === "openrouter" && process.env.OPENROUTER_API_KEY) {
      // OpenRouter uses the same AI SDK interface as OpenAI
      const model = openai(modelId, {
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_API_KEY,
      })
      const { text, toolCalls } = await generateText({
        model,
        system: systemPrompt,
        messages: history as CoreMessage[], // Pass the conversation history
        prompt: query,
        tools: { search_query: searchTool },
      })

      if (toolCalls && toolCalls.length > 0) {
        assistantContent = { tool_calls: toolCalls }
      } else {
        assistantContent = text
      }
    } else {
      assistantContent = `Error: API key missing or provider not configured for ${providerId}.`
    }
  } catch (error: any) {
    console.error(`Error with AI provider ${providerId}:`, error)
    assistantContent = `Error communicating with AI provider: ${error.message}`
  }

  return NextResponse.json({ response: assistantContent })
}
