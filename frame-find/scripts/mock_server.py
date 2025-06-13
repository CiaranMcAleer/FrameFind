from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import time

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# Mock data for demonstration
MOCK_SEARCH_RESULTS = [
    {
        "text": "This is a mock search result about quantum computing from a document titled 'Quantum Basics'.",
        "score": 0.9876,
        "source": "Quantum Basics.pdf",
        "frame": 10
    },
    {
        "text": "Another mock result discussing machine learning algorithms and their applications in 'AI Handbook'.",
        "score": 0.9543,
        "source": "AI Handbook.txt",
        "frame": 25
    },
    {
        "text": "A third mock result about historical events, specifically the fall of the Berlin Wall, from 'History Notes'.",
        "score": 0.8912,
        "source": "History Notes.md",
        "frame": 5
    }
]

MOCK_CHAT_RESPONSES = [
    "Hello! I am a mock AI assistant. How can I help you with your documents today?",
    "That's an interesting query. In a real scenario, I would provide a detailed answer based on your documents.",
    "My purpose is to help you refine your search. What specific information are you looking for?",
    "I can tell you that the documents contain information on various topics, including technology, history, and science."
]
chat_response_index = 0

@app.route('/status', methods=['GET'])
def get_mock_status():
    # Always return true for mock server
    return jsonify({"initialized": True})

@app.route('/search', methods=['POST'])
def mock_search_memory():
    data = request.json
    query = data.get('query')
    print(f"Mock search received for query: {query}")
    time.sleep(1) # Simulate network delay
    return jsonify(MOCK_SEARCH_RESULTS)

@app.route('/chat', methods=['POST'])
def mock_chat_with_memory():
    global chat_response_index
    data = request.json
    query = data.get('query')
    print(f"Mock chat received for query: {query}")
    time.sleep(1.5) # Simulate AI processing delay
    
    response = MOCK_CHAT_RESPONSES[chat_response_index % len(MOCK_CHAT_RESPONSES)]
    chat_response_index += 1
    return jsonify({"response": response})

@app.route('/upload', methods=['POST'])
def mock_upload_document():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    print(f"Mock upload received for file: {file.filename}")
    time.sleep(2) # Simulate processing time
    return jsonify({"message": f"Mock: File {file.filename} processed and added to memory."})

@app.route('/download_memory/<file_type>', methods=['GET'])
def mock_download_memory(file_type):
    print(f"Mock download request for file type: {file_type}")
    time.sleep(0.5) # Simulate download preparation
    
    if file_type == 'video':
        # For a mock, we can send a dummy file or just a success message
        # Sending a dummy text file as a placeholder for a video file
        dummy_content = b"This is a dummy MP4 file content for mock testing."
        return app.response_class(
            response=dummy_content,
            status=200,
            mimetype='video/mp4',
            headers={'Content-Disposition': 'attachment; filename="mock_memory.mp4"'}
        )
    elif file_type == 'index':
        dummy_content = b'{"mock_index": "This is a dummy JSON index for mock testing."}'
        return app.response_class(
            response=dummy_content,
            status=200,
            mimetype='application/json',
            headers={'Content-Disposition': 'attachment; filename="mock_memory_index.json"'}
        )
    else:
        return jsonify({"error": "Invalid file type. Must be 'video' or 'index'."}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
