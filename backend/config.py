import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Application configuration class"""
    
    # MongoDB Configuration
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/notehub')
    
    # Firebase Configuration
    FIREBASE_CREDENTIALS_PATH = os.getenv('FIREBASE_CREDENTIALS_PATH', './firebase-admin-credentials.json')
    
    # Flask Configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    PORT = int(os.getenv('PORT', 5000))
    
    # CORS Configuration
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3001')
    
    # Profile Picture Configuration
    MAX_PROFILE_PICTURE_SIZE = 5 * 1024 * 1024  # 5MB in bytes (base64 encoded)
    ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    
    # Resource File Upload Configuration
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB in bytes
    ALLOWED_FILE_TYPES = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'text/plain'
    ]
    ALLOWED_FILE_EXTENSIONS = [
        '.pdf', '.doc', '.docx', '.ppt', '.pptx',
        '.jpg', '.jpeg', '.png', '.gif', '.webp', '.txt'
    ]
    
    # GridFS Configuration
    GRIDFS_COLLECTION = 'fs'  # Default GridFS collection prefix
