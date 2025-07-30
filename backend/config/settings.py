"""
Configuration settings for the IRIS Facial Analysis Backend.
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Base configuration class."""
    
    # Flask Configuration
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'iris-robotics-club-secret-key-2024'
    DEBUG = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    
    # CORS Configuration
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(',')
    
    # File Upload Configuration
    MAX_CONTENT_LENGTH = int(os.environ.get('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))  # 16MB
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', './uploads')
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}
    
    # Model Configuration
    MODEL_PATH = os.environ.get('MODEL_PATH', './models')
    
    # Face Detection Settings
    FACE_DETECTION_CONFIDENCE = float(os.environ.get('FACE_DETECTION_CONFIDENCE', 0.7))
    MAX_FACES = int(os.environ.get('MAX_FACES', 5))
    
    # Video Processing Settings
    FRAME_SKIP = int(os.environ.get('FRAME_SKIP', 2))  # Process every Nth frame
    MAX_FRAME_SIZE = int(os.environ.get('MAX_FRAME_SIZE', 640))  # Max width/height
    
    # Performance Settings
    ENABLE_GPU = os.environ.get('ENABLE_GPU', 'False').lower() == 'true'
    CACHE_SIZE = int(os.environ.get('CACHE_SIZE', 100))  # Number of cached results
    
    # WebSocket Configuration
    WEBSOCKET_ASYNC_MODE = os.environ.get('WEBSOCKET_ASYNC_MODE', 'threading')
    WEBSOCKET_PING_TIMEOUT = int(os.environ.get('WEBSOCKET_PING_TIMEOUT', 60))
    WEBSOCKET_PING_INTERVAL = int(os.environ.get('WEBSOCKET_PING_INTERVAL', 25))
    
    # Privacy Settings
    ENABLE_GENDER_DETECTION = os.environ.get('ENABLE_GENDER_DETECTION', 'True').lower() == 'true'
    ENABLE_AGE_ESTIMATION = os.environ.get('ENABLE_AGE_ESTIMATION', 'True').lower() == 'true'
    ENABLE_EMOTION_DETECTION = os.environ.get('ENABLE_EMOTION_DETECTION', 'True').lower() == 'true'
    
    # Logging Configuration
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_FILE = os.environ.get('LOG_FILE', None)
    
    # Redis Configuration (for production scaling)
    REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    
    # Monitoring Configuration
    ENABLE_METRICS = os.environ.get('ENABLE_METRICS', 'True').lower() == 'true'
    METRICS_PORT = int(os.environ.get('METRICS_PORT', 8000))

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    CORS_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000']

class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    # Override with production values
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '').split(',')
    
class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    DEBUG = True
    CORS_ORIGINS = ['http://localhost:3000']

# Configuration mapping
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
