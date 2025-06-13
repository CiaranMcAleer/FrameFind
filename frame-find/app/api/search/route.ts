import { NextResponse } from "next/server"

const MOCK_SEARCH_RESULTS = [
  {
    text: "This is a mock search result about quantum computing from a document titled 'Mock Quantum Basics'. It provides a brief overview of qubits and their potential.",
    score: 0.9876,
    source: "Mock Quantum Basics.pdf",
    frame: 10,
  },
  {
    text: "Another mock result discussing machine learning algorithms and their applications in 'Mock AI Handbook'. This section details various neural network architectures.",
    score: 0.9543,
    source: "Mock AI Handbook.txt",
    frame: 25,
  },
  {
    text: "A third mock result about historical events, specifically the fall of the Berlin Wall in 1989, from 'Mock History Notes'. It highlights key figures and impacts.",
    score: 0.8912,
    source: "Mock History Notes.md",
    frame: 5,
  },
  {
    text: "This mock result talks about the importance of data privacy in the digital age, extracted from 'Privacy Guidelines'. It covers GDPR and other regulations.",
    score: 0.85,
    source: "Mock Privacy Guidelines.txt",
    frame: 40,
  },
  {
    text: "A final mock result on renewable energy sources, focusing on solar power technology, found in 'Energy Future Report'.",
    score: 0.82,
    source: "Mock Energy Future Report.pdf",
    frame: 55,
  },
]

export async function POST(req: Request) {
  const { query } = await req.json()
  console.log(`Mock search received for query: ${query}`)
  // Simulate a delay
  await new Promise((resolve) => setTimeout(resolve, 1000))
  return NextResponse.json(MOCK_SEARCH_RESULTS)
}
