import os
from memvid import MemvidEncoder

# Ensure the data directory exists
MEMORY_DIR = "data"
os.makedirs(MEMORY_DIR, exist_ok=True)

MEMORY_VIDEO_PATH = os.path.join(MEMORY_DIR, "memory.mp4")
MEMORY_INDEX_PATH = os.path.join(MEMORY_DIR, "memory_index.json")

def initialize_empty_memory():
    """Initializes an empty memvid memory."""
    print("Initializing an empty Memvid memory...")
    encoder = MemvidEncoder()
    # Add a dummy chunk to ensure files are created, then rebuild
    encoder.add_chunks(["This is an initial empty memory for FrameFind."])
    encoder.build_video(MEMORY_VIDEO_PATH, MEMORY_INDEX_PATH)
    print(f"Empty memory created at {MEMORY_VIDEO_PATH} and {MEMORY_INDEX_PATH}")

if __name__ == "__main__":
    if os.path.exists(MEMORY_VIDEO_PATH) and os.path.exists(MEMORY_INDEX_PATH):
        print("Memvid memory already exists. Skipping initialization.")
    else:
        initialize_empty_memory()
