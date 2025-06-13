import os
from memvid import MemvidEncoder, MemvidRetriever, MemvidChat
from dotenv import load_dotenv

load_dotenv() # Load environment variables from .env file

MEMORY_DIR = "data"
MEMORY_VIDEO_PATH = os.path.join(MEMORY_DIR, "memory.mp4")
MEMORY_INDEX_PATH = os.path.join(MEMORY_DIR, "memory_index.json")

class MemvidService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MemvidService, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        os.makedirs(MEMORY_DIR, exist_ok=True)
        self.encoder = MemvidEncoder()
        self.retriever = None
        self.chat_instance = None
        self._load_memory()

    def _load_memory(self):
        if os.path.exists(MEMORY_VIDEO_PATH) and os.path.exists(MEMORY_INDEX_PATH):
            print("Loading existing Memvid memory...")
            self.retriever = MemvidRetriever(MEMORY_VIDEO_PATH, MEMORY_INDEX_PATH)
            self.chat_instance = MemvidChat(
                MEMORY_VIDEO_PATH,
                MEMORY_INDEX_PATH,
                llm_model=os.getenv("LLM_MODEL", "gpt-4o"), # Default to gpt-4o
                api_key=os.getenv("OPENAI_API_KEY") # Use OPENAI_API_KEY for OpenAI models
            )
            self.chat_instance.start_session()
        else:
            print("No existing Memvid memory found. Please upload documents to create one.")
            self.retriever = None
            self.chat_instance = None

    def add_document(self, file_path: str, file_type: str):
        print(f"Adding document: {file_path} (type: {file_type})")
        if file_type == "text":
            with open(file_path, "r", encoding="utf-8") as f:
                self.encoder.add_text(f.read(), metadata={"source": os.path.basename(file_path)})
        elif file_type == "pdf":
            self.encoder.add_pdf(file_path, metadata={"source": os.path.basename(file_path)})
        else:
            raise ValueError("Unsupported file type. Only 'text' and 'pdf' are supported.")

        print("Building video memory...")
        self.encoder.build_video(MEMORY_VIDEO_PATH, MEMORY_INDEX_PATH)
        self._load_memory() # Reload memory after building

    def search(self, query: str, top_k: int = 5):
        if not self.retriever:
            return {"error": "Memory not initialized. Please upload documents first."}
        print(f"Searching for: {query}")
        results = self.retriever.search_with_metadata(query, top_k=top_k)
        return [
            {
                "text": r["text"],
                "score": r["score"],
                "source": r["metadata"].get("source", "unknown"),
                "frame": r["frame"]
            }
            for r in results
        ]

    def chat(self, query: str):
        if not self.chat_instance:
            return {"error": "Chat not initialized. Please upload documents and set LLM API key."}
        print(f"Chat query: {query}")
        response = self.chat_instance.chat(query)
        return {"response": response}

    def get_memory_paths(self):
        return {
            "video_path": MEMORY_VIDEO_PATH if os.path.exists(MEMORY_VIDEO_PATH) else None,
            "index_path": MEMORY_INDEX_PATH if os.path.exists(MEMORY_INDEX_PATH) else None
        }

    def is_memory_initialized(self):
        return os.path.exists(MEMORY_VIDEO_PATH) and os.path.exists(MEMORY_INDEX_PATH)
