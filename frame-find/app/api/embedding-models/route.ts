import { NextResponse } from "next/server"

export async function GET() {
  const embeddingModels = []

  // Add default/mock models
  embeddingModels.push({ id: "all-MiniLM-L6-v2", name: "all-MiniLM-L6-v2 (Default)" })

  // Try to fetch from Hugging Face Hub API for sentence-transformers models
  try {
    const hfResponse = await fetch(
      "https://huggingface.co/api/models?library=sentence-transformers&sort=downloads&direction=-1&limit=10",
    )
    if (hfResponse.ok) {
      const data = await hfResponse.json()
      const fetchedModels = data.map((model: any) => ({
        id: model.id,
        name: model.id, // Use ID as name for simplicity
      }))
      // Filter out duplicates and add fetched models
      const uniqueFetchedModels = fetchedModels.filter((fm: any) => !embeddingModels.some((em) => em.id === fm.id))
      embeddingModels.push(...uniqueFetchedModels)
    } else {
      console.error("Failed to fetch Hugging Face embedding models:", hfResponse.status, await hfResponse.text())
      embeddingModels.push({ id: "hf-error", name: "Hugging Face (API Error)" })
    }
  } catch (error) {
    console.error("Error fetching Hugging Face embedding models:", error)
    embeddingModels.push({ id: "hf-network-error", name: "Hugging Face (Network Error)" })
  }

  // Simulate a small delay
  await new Promise((resolve) => setTimeout(resolve, 200))

  return NextResponse.json({ models: embeddingModels })
}
