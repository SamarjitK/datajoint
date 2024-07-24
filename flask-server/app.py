import os
from flask import Flask, session, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# globals
db_dir = ""

### 1.1: Set database storage directory, initialize and connect to database

@app.route('/init/set-database-directory', methods=['POST'])
def set_db_dir():
    global db_dir
    db_dir = request.json.get('dir')
    if db_dir and os.path.isdir(db_dir):
        return jsonify({"message": "Database directory set successfully!"}), 200
    else:
        return jsonify({"message": "Invalid directory path!"}), 400
    
@app.route('/init/get-database-directory', methods=['GET'])
def get_db_dir():
    global db_dir
    return jsonify({"dir": f"{db_dir}"})