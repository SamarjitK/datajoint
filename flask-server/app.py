import os
from flask import Flask, session, request, jsonify
from flask_cors import CORS
import datajoint as dj
import pymysql
import time

# fix for wget
# import ssl
# ssl._create_default_https_context = ssl._create_unverified_context

# import custom functions
from db_init import create_database, delete_database, start_database, stop_database
from pop import append_data

app = Flask(__name__)
CORS(app)

# immutable globals
home_dir: str = os.getcwd()
schema_path: str = 'schema.py'

# mutable globals (should be saved to a session)
db_dir: str = None
db: dj.VirtualModule = None
username: str = None

# dj config
host_address, user, password = '127.0.0.1', 'root', 'simple'
dj.config["database.host"] = f"{host_address}"
dj.config["database.user"] = f"{user}"
dj.config["database.password"] = f"{password}"

print("Globals populated")

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
    return jsonify({"dir": f"{db_dir}"})

@app.route('/init/list-databases', methods=['GET'])
def list_dbs():
    if db_dir:
        dbs = [f for f in os.listdir(db_dir) if os.path.isdir(os.path.join(db_dir, f))]
        return jsonify({"databases": dbs}), 200
    else:
        return jsonify({"message": "Database directory not set!"}), 400

@app.route('/init/create-database', methods=['POST'])
def create_db():
    db_name = request.json.get('name')
    if db_name and db_dir:
        try:
            create_database(home_dir, db_dir, db_name)
            return jsonify({"message": "Database created successfully!"}), 200
        except Exception as e:
            return jsonify({"message": f"Error creating database: {e}"}), 400
    else:
        return jsonify({"message": "Invalid database name!"}), 400
    
@app.route('/init/delete-database', methods=['POST'])
def delete_db():
    db_name = request.json.get('name')
    if db_name and db_dir:
        try:
            delete_database(home_dir, db_dir, db_name,
                            dj.conn() if hasattr(dj.conn, 'connection') else None)
            return jsonify({"message": "Database deleted successfully!"}), 200
        except Exception as e:
            return jsonify({"message": f"Error deleting database: {e}"}), 400
    else:
        return jsonify({"message": "Invalid database name!"}), 400
    
@app.route('/init/start-database', methods=['POST'])
def start_db():
    db_name = request.json.get('name')
    if db_name and db_dir:
        try:
            start_database(home_dir, db_dir, db_name)
            return jsonify({"message": "Database started successfully!"}), 200
        except Exception as e:
            return jsonify({"message": f"Error starting database: {e}"}), 400
    else:
        return jsonify({"message": "Invalid database name!"}), 400

@app.route('/init/stop-database', methods=['POST'])
def stop_db():
    db_name = request.json.get('name')
    if db_name and db_dir:
        try:
            stop_database(home_dir, db_dir, db_name,
                          dj.conn() if hasattr(dj.conn, 'connection') else None)
            return jsonify({"message": "Database stopped successfully!"}), 200
        except Exception as e:
            return jsonify({"message": f"Error stopping database: {e}"}), 400
    else:
        return jsonify({"message": "Invalid database name!"}),

@app.route('/init/connect-database', methods=['POST'])
def connect_db():
    global db
    db_name = request.json.get('name')
    if db_name and db_dir:
        try:
            for attempt in range(4):
                try:
                    if not dj.conn().is_connected:
                        dj.conn().connect()
                except pymysql.OperationalError as e:
                    print(f"Attempt {attempt + 1} failed: {e}")
                    time.sleep(1)
            if not dj.conn().is_connected:
                dj.conn().connect()
            print('Connected' if dj.conn().is_connected else 'Failed to connect')
            if 'schema' not in dj.list_schemas():
                print('Initializing schema')
                exec(open(schema_path).read())
            db = dj.VirtualModule('schema.py', 'schema')
            return jsonify({"message": "Connected to database successfully!"}), 200
        except Exception as e:
            return jsonify({"message": f"Error connecting to database: {e}"}), 400
    else:
        return jsonify({"message": "Invalid database name!"}), 400
    
# 1.2: Setting user, should be a connection 'db' at this point. 

@app.route('/user/set-user', methods=['POST'])
def set_user():
    global username
    username = request.json.get('user')
    if username and '/' not in username and username != "user_not_set":
        return jsonify({"message": "User set successfully!"}), 200
    else:
        username = None
        return jsonify({"message": "Invalid user name!"}), 400

@app.route('/user/get-user', methods=['GET'])
def get_user():
    if username:
        return jsonify({"user": f"{username}"}), 200
    else:
        return jsonify({"user": "user_not_set"}), 200
    
# 1.3: once the user is set, we can start adding data.

@app.route('/pop/is-empty', methods=['GET'])
def is_empty():
    if db:
        num_experiments = len((db.Experiment & "id>=1").fetch())
        if num_experiments == 0:
            return jsonify({"empty": True, "num_experiments": num_experiments}), 200
        else:
            return jsonify({"empty": False, "num_experiments": num_experiments}), 200
    else:
        return jsonify({"message": "No database connection!"}), 400
    
@app.route('/pop/add-data', methods=['POST'])
def add_data():
    if db and username:
        records_added = append_data(request.json.get('data_dir'), request.json.get('meta_dir'),
                                    request.json.get('tags_dir'), username, db)
        return jsonify({"message": f"{records_added} records successfully added!"}), 200
    else:
        return jsonify({"message": "Connect and sign in first!"}), 400

@app.route('/pop/clear', methods=['POST'])
def clear():
    if db and username:
        try:
            dj.config["safemode"] = False
            db.Experiment.delete()
            db.Protocol.delete()
            db.Tags.delete()
            dj.config["safemode"] = True
            return jsonify({"message": f"Database successfully cleared!"}), 200
        except:
            return jsonify({"message": "Error while clearing."}), 400
    else:
        return jsonify({"message": "Connect and sign in first!"}), 400
    
