#!/bin/bash
# Start FastAPI backend for FrameFind
uvicorn main:app --host 0.0.0.0 --port 5000 --reload
