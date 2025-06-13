"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Home } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { SearchableSelect } from "@/components/searchable-select"

interface AIProvider {
  id: string
  name: string
  models: string[]
}

interface EmbeddingModel {
  id: string
  name: string
}

export default function SettingsPage() {
  const [selectedFile, setSelectedFile] = null
  const [uploading, setUploading] = useState(false)
  const [memoryInitialized, setMemoryInitialized] = useState(false)
  const { toast } = useToast()

  const [aiProviders, setAiProviders] = useState<AIProvider[]>([])
  const [selectedAIProvider, setSelectedAIProvider] = useState<string>("mock")
  const [selectedAIModel, setSelectedAIModel] = useState<string>("")

  const [embeddingModels, setEmbeddingModels] = useState<EmbeddingModel[]>([])
  const [selectedEmbeddingModel, setSelectedEmbeddingModel] = useState<string>("")

  const checkMemoryStatus = async () => {
    try {
      const response = await fetch("/api/status")
      const data = await response.json()
      setMemoryInitialized(data.initialized)
    } catch (error) {
      console.error("Failed to check memory status:", error)
      setMemoryInitialized(false)
    }
  }

  const fetchAIModels = async () => {
    try {
      const response = await fetch("/api/ai-models")
      const data = await response.json()
      setAiProviders(data.providers)
      // Set initial selections if not already set
      if (data.providers.length > 0) {
        const defaultProvider = data.providers.find((p: AIProvider) => p.id === "mock") || data.providers[0]
        setSelectedAIProvider(defaultProvider.id)
        if (defaultProvider.models.length > 0) {
          setSelectedAIModel(defaultProvider.models[0])
        }
      }
    } catch (error) {
      console.error("Failed to fetch AI models:", error)
      toast({
        title: "Error",
        description: "Failed to load AI models.",
        variant: "destructive",
      })
    }
  }

  const fetchEmbeddingModels = async () => {
    try {
      const response = await fetch("/api/embedding-models")
      const data = await response.json()
      setEmbeddingModels(data.models)
      if (data.models.length > 0) {
        setSelectedEmbeddingModel(data.models[0].id)
      }
    } catch (error) {
      console.error("Failed to fetch embedding models:", error)
      toast({
        title: "Error",
        description: "Failed to load embedding models.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    checkMemoryStatus()
    fetchAIModels()
    fetchEmbeddingModels()
  }, [])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0])
    } else {
      setSelectedFile(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please choose a file to upload.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append("file", selectedFile)

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to upload file")
      }

      toast({
        title: "Upload Successful",
        description: data.message,
      })
      setSelectedFile(null)
      checkMemoryStatus()
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (fileType: "video" | "index") => {
    try {
      const response = await fetch(`/api/download?file_type=${fileType}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to download ${fileType} file`)
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileType === "video" ? "memory.mp4" : "memory_index.json"
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast({
        title: "Download Started",
        description: `Downloading ${fileType} file.`,
      })
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleSaveSettings = () => {
    // In a real app, you'd send these settings to your backend
    // For v0, we'll just use local storage and a toast
    localStorage.setItem("selectedAIProvider", selectedAIProvider)
    localStorage.setItem("selectedAIModel", selectedAIModel)
    localStorage.setItem("selectedEmbeddingModel", selectedEmbeddingModel)
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated.",
      variant: "success", // Added variant for better visual feedback
    })
  }

  const currentAIModels = aiProviders.find((p) => p.id === selectedAIProvider)?.models || []

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <header className="w-full max-w-4xl flex items-center justify-between mb-8">
        <Link href="/">
          <Button variant="ghost" size="icon" aria-label="Home">
            <Home className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Settings</h1>
        <div></div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Add New Documents</CardTitle>
            <CardDescription>Upload single text or PDF files to expand your memory.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="document-upload">Document File</Label>
              <Input id="document-upload" type="file" onChange={handleFileChange} accept=".txt,.pdf,.md,.csv" />
              {selectedFile && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Selected: {selectedFile.name}</p>
              )}
            </div>
            <Button onClick={handleUpload} disabled={uploading || !selectedFile}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Upload and Process"
              )}
            </Button>
            {!memoryInitialized && (
              <p className="text-sm text-orange-500 dark:text-orange-400">
                Memory not initialized. Uploading the first document will create it.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Memory Files</CardTitle>
            <CardDescription>Download your `memory.mp4` and `memory_index.json` files.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => handleDownload("video")} disabled={!memoryInitialized}>
              Download memory.mp4
            </Button>
            <Button onClick={() => handleDownload("index")} disabled={!memoryInitialized}>
              Download memory_index.json
            </Button>
            {!memoryInitialized && (
              <p className="text-sm text-orange-500 dark:text-orange-400">
                Memory files are not yet available. Upload documents first.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>AI Chat Configuration</CardTitle>
            <CardDescription>Select your preferred AI provider and model for chat interactions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="ai-provider">AI Provider</Label>
              <SearchableSelect
                options={aiProviders.map((p) => ({ value: p.id, label: p.name }))}
                value={selectedAIProvider}
                onValueChange={setSelectedAIProvider}
                placeholder="Select AI Provider"
                emptyMessage="No AI providers found."
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="ai-model">AI Model</Label>
              <SearchableSelect
                options={currentAIModels.map((model) => ({ value: model, label: model }))}
                value={selectedAIModel}
                onValueChange={setSelectedAIModel}
                placeholder="Select AI Model"
                emptyMessage="No AI models found for this provider."
                disabled={currentAIModels.length === 0}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Embedding Model Configuration</CardTitle>
            <CardDescription>Select the embedding model used for document indexing and search.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="embedding-model">Embedding Model</Label>
              <SearchableSelect
                options={embeddingModels.map((model) => ({ value: model.id, label: model.name }))}
                value={selectedEmbeddingModel}
                onValueChange={setSelectedEmbeddingModel}
                placeholder="Select Embedding Model"
                emptyMessage="No embedding models found."
                disabled={embeddingModels.length === 0}
              />
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 flex justify-end">
          <Button onClick={handleSaveSettings}>Save Settings</Button>
        </div>
      </div>
    </div>
  )
}
