from fastapi import FastAPI, File, UploadFile, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from typing import List, Optional
import os
import shutil
from memvid import MemvidEncoder, MemvidRetriever, MemvidChat

app = FastAPI()

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directory to store uploaded and processed files
DATA_DIR = "data"
MEMORY_VIDEO = os.path.join(DATA_DIR, "memory.mp4")
MEMORY_INDEX = os.path.join(DATA_DIR, "memory_index.json")
os.makedirs(DATA_DIR, exist_ok=True)

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    # Save uploaded file
    file_path = os.path.join(DATA_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    # Process file with MemvidEncoder
    encoder = MemvidEncoder()
    if file.filename.lower().endswith(".pdf"):
        encoder.add_pdf(file_path)
    else:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            encoder.add_text(f.read(), metadata={"source": file.filename})
    encoder.build_video(MEMORY_VIDEO, MEMORY_INDEX)
    return {"message": f"File {file.filename} processed and added to memory."}

@app.post("/search")
async def search(query: str = Form(...), top_k: int = Form(5)):
    retriever = MemvidRetriever(MEMORY_VIDEO, MEMORY_INDEX)
    results = retriever.search(query, top_k=top_k)
    # Format results for frontend
    formatted = []
    for r in results:
        if isinstance(r, tuple):
            chunk, score = r
            formatted.append({"text": chunk["text"] if isinstance(chunk, dict) and "text" in chunk else str(chunk),
                              "score": float(score),
                              "source": chunk.get("source") if isinstance(chunk, dict) else None,
                              "frame": chunk.get("frame") if isinstance(chunk, dict) else None})
        else:
            formatted.append({"text": str(r), "score": None, "source": None, "frame": None})
    return formatted

@app.post("/chat")
async def chat(
    query: str = Form(...),
    currentQuery: Optional[str] = Form(None),
    searchResults: Optional[str] = Form(None),
    history: Optional[str] = Form(None),
):
    chat = MemvidChat(MEMORY_VIDEO, MEMORY_INDEX)
    chat.start_session()
    response = chat.chat(query)
    return {"response": response}

# Optionally serve static files (e.g., processed videos/indexes)
app.mount("/data", StaticFiles(directory=DATA_DIR), name="data")
