import { NextResponse } from "next/server"

export async function GET() {
  const providers = []

  // Add Mock Provider
  providers.push({
    id: "mock",
    name: "Mock AI Provider",
    models: ["mock-model-1", "mock-model-2", "mock-model-3"],
  })

  // Try to fetch from OpenAI
  if (process.env.OPENAI_API_KEY) {
    try {
      const openaiResponse = await fetch("https://api.openai.com/v1/models", {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      })
      if (openaiResponse.ok) {
        const data = await openaiResponse.json()
        const models = data.data
          .filter(
            (model: any) =>
              (model.id.startsWith("gpt") && model.id.includes("turbo")) ||
              model.id.includes("4o") ||
              model.id.includes("3.5"),
          )
          .map((model: any) => model.id)
        providers.push({ id: "openai", name: "OpenAI", models })
      } else {
        console.error("Failed to fetch OpenAI models:", openaiResponse.status, await openaiResponse.text())
        providers.push({ id: "openai", name: "OpenAI (API Error)", models: ["Error fetching models"] })
      }
    } catch (error) {
      console.error("Error fetching OpenAI models:", error)
      providers.push({ id: "openai", name: "OpenAI (Network Error)", models: ["Error fetching models"] })
    }
  } else {
    providers.push({ id: "openai", name: "OpenAI (API Key Missing)", models: ["Set OPENAI_API_KEY"] })
  }

  // Fetch from OpenRouter (no API key needed for model list)
  try {
    const openrouterResponse = await fetch("https://openrouter.ai/api/v1/models")
    if (openrouterResponse.ok) {
      const data = await openrouterResponse.json()
      const models = data.data.map((model: any) => model.id)
      providers.push({ id: "openrouter", name: "OpenRouter", models })
    } else {
      console.error("Failed to fetch OpenRouter models:", openrouterResponse.status, await openrouterResponse.text())
      providers.push({ id: "openrouter", name: "OpenRouter (API Error)", models: ["Error fetching models"] })
    }
  } catch (error) {
    console.error("Error fetching OpenRouter models:", error)
    providers.push({ id: "openrouter", name: "OpenRouter (Network Error)", models: ["Error fetching models"] })
  }

  // Simulate a small delay for API fetching
  await new Promise((resolve) => setTimeout(resolve, 300))

  return NextResponse.json({ providers })
}
