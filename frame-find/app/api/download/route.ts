import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const fileType = searchParams.get("file_type")
  console.log(`Mock download request for file type: ${fileType}`)
  await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate delay

  if (fileType === "video") {
    const dummyContent = "This is a dummy MP4 file content for mock testing."
    return new NextResponse(dummyContent, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": 'attachment; filename="mock_memory.mp4"',
      },
    })
  } else if (fileType === "index") {
    const dummyContent = '{"mock_index": "This is a dummy JSON index for mock testing."}'
    return new NextResponse(dummyContent, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="mock_memory_index.json"',
      },
    })
  } else {
    return NextResponse.json({ error: "Invalid file type. Must be 'video' or 'index'." }, { status: 400 })
  }
}
