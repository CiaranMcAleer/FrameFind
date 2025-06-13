from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from memvid_service import MemvidService, MEMORY_VIDEO_PATH, MEMORY_INDEX_PATH
import os
import tempfile

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

memvid_service = MemvidService()

@app.route('/status', methods=['GET'])
def get_status():
    return jsonify({"initialized": memvid_service.is_memory_initialized()})

@app.route('/search', methods=['POST'])
def search_memory():
    data = request.json
    query = data.get('query')
    top_k = data.get('top_k', 5)
    if not query:
        return jsonify({"error": "Query is required"}), 400
    
    results = memvid_service.search(query, top_k)
    if "error" in results:
        return jsonify(results), 500
    return jsonify(results)

@app.route('/chat', methods=['POST'])
def chat_with_memory():
    data = request.json
    query = data.get('query')
    if not query:
        return jsonify({"error": "Query is required"}), 400
    
    response = memvid_service.chat(query)
    if "error" in response:
        return jsonify(response), 500
    return jsonify(response)

@app.route('/upload', methods=['POST'])
def upload_document():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if file:
        filename = file.filename
        file_ext = filename.split('.')[-1].lower()
        file_type = "text"
        if file_ext == "pdf":
            file_type = "pdf"
        elif file_ext not in ["txt", "md", "csv"]: # Add other text formats if needed
            return jsonify({"error": "Unsupported file format. Only .txt, .md, .csv, and .pdf are supported."}), 400

        # Save file to a temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file_ext}") as tmp_file:
            file.save(tmp_file.name)
            temp_file_path = tmp_file.name
        
        try:
            memvid_service.add_document(temp_file_path, file_type)
            return jsonify({"message": f"File {filename} processed and added to memory."})
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        finally:
            os.unlink(temp_file_path) # Clean up temporary file

@app.route('/download_memory/<file_type>', methods=['GET'])
def download_memory(file_type):
    if file_type == 'video':
        path = MEMORY_VIDEO_PATH
        mimetype = 'video/mp4'
    elif file_type == 'index':
        path = MEMORY_INDEX_PATH
        mimetype = 'application/json'
    else:
        return jsonify({"error": "Invalid file type. Must be 'video' or 'index'."}), 400

    if os.path.exists(path):
        return send_file(path, mimetype=mimetype, as_attachment=True, download_name=os.path.basename(path))
    else:
        return jsonify({"error": f"{file_type} file not found."}), 404

if __name__ == '__main__':
    # You can set LLM_MODEL and OPENAI_API_KEY in a .env file or directly here
    # Example: os.environ['OPENAI_API_KEY'] = 'your_openai_api_key_here'
    # Example: os.environ['LLM_MODEL'] = 'gpt-4o'
    app.run(host='0.0.0.0', port=5000, debug=True)
