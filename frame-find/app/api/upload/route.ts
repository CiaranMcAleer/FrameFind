import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const useMockServer = process.env.NEXT_PUBLIC_USE_MOCK_SERVER === "true"

  if (useMockServer) {
    const formData = await req.formData()
    const file = formData.get("file") as File
    console.log(`Mock upload received for file: ${file?.name}`)
    // Simulate a delay
    await new Promise((resolve) => setTimeout(resolve, 2000))
    return NextResponse.json({ message: `Mock: File ${file?.name || "unknown"} processed and added to memory.` })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file")

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"

    const backendResponse = await fetch(`${backendUrl}/upload`, {
      method: "POST",
      body: formData, // Forward the FormData directly
    })

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json()
      return NextResponse.json(
        { error: errorData.error || "Backend upload failed" },
        { status: backendResponse.status },
      )
    }

    const data = await backendResponse.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error in /api/upload:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
