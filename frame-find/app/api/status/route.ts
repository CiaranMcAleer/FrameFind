import { NextResponse } from "next/server"

export async function GET(req: Request) {
  // For v0 preview, we always use the mock server
  return NextResponse.json({ initialized: true })
}
