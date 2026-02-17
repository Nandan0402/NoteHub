from flask import Flask, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials
from pymongo import MongoClient
import os
from config import Config
from routes.profile import profile_bp, init_profile_routes
from routes.resources import resources_bp, init_resources_routes

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)

# Set maximum file upload size (50MB)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024

# Configure CORS - Allow all origins in development
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://localhost:3001", Config.FRONTEND_URL],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "Accept"],
        "expose_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True,
        "max_age": 3600
    }
})

# Initialize Firebase Admin SDK
try:
    if os.path.exists(Config.FIREBASE_CREDENTIALS_PATH):
        cred = credentials.Certificate(Config.FIREBASE_CREDENTIALS_PATH)
        firebase_admin.initialize_app(cred)
        print("✅ Firebase Admin SDK initialized successfully")
    else:
        print("⚠️  Warning: Firebase credentials file not found. Authentication will not work.")
        print(f"   Expected path: {Config.FIREBASE_CREDENTIALS_PATH}")
except Exception as e:
    print(f"❌ Error initializing Firebase: {e}")

# Initialize MongoDB
try:
    mongo_client = MongoClient(Config.MONGODB_URI, serverSelectionTimeoutMS=5000)
    db = mongo_client.notehub
    
    # Test connection
    mongo_client.admin.command('ping')
    print("✅ MongoDB connected successfully")
    
    # Create indexes
    db.profiles.create_index('uid', unique=True)
    db.profiles.create_index('email')
    
    # Create indexes for resources collection
    db.resources.create_index('uid')
    db.resources.create_index('tags')
    db.resources.create_index('resource_type')
    db.resources.create_index('created_at')
    
    print("✅ Database indexes created")
    
    # Initialize routes with database
    init_profile_routes(db)
    init_resources_routes(db)
    
    # Register blueprints
    app.register_blueprint(profile_bp)
    app.register_blueprint(resources_bp)
    print("✅ Database routes initialized")
    
except Exception as e:
    print(f"⚠️  Warning: MongoDB not connected - {e}")
    print("   Profile and resources features will not be available")
    print("   Firebase Authentication will still work")
    db = None

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'NoteHub API',
        'database': 'connected' if db else 'disconnected',
        'firebase': 'initialized' if firebase_admin._apps else 'not initialized'
    }), 200

# Root endpoint
@app.route('/', methods=['GET'])
def root():
    """Root endpoint"""
    return jsonify({
        'message': 'Welcome to NoteHub API',
        'version': '1.0.0',
        'endpoints': {
            'health': '/api/health',
            'profile': {
                'get': 'GET /api/profile',
                'create': 'POST /api/profile',
                'update': 'PUT /api/profile',
                'delete': 'DELETE /api/profile'
            },
            'resources': {
                'upload': 'POST /api/resources/upload',
                'my-resources': 'GET /api/resources/my-resources',
                'get': 'GET /api/resources/:id',
                'download': 'GET /api/resources/download/:id',
                'update': 'PUT /api/resources/:id',
                'delete': 'DELETE /api/resources/:id'
            }
        }
    }), 200

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print(f"\n🚀 Starting NoteHub Backend Server...")
    print(f"📍 Port: {Config.PORT}")
    print(f"🌍 Environment: {Config.FLASK_ENV}")
    print(f"🔗 CORS allowed origin: {Config.FRONTEND_URL}\n")
    
    app.run(
        host='0.0.0.0',
        port=Config.PORT,
        debug=Config.FLASK_ENV == 'development'
    )
