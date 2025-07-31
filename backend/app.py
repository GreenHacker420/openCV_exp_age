#!/usr/bin/env python3
"""
IRIS Robotics Club - Facial Analysis Backend
Main Flask application with WebSocket support for real-time facial analysis.
"""

import os
import logging
from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from datetime import datetime
import cv2
import numpy as np
import base64
from io import BytesIO
from PIL import Image

# Import our services
from services.face_detector import FaceDetector
from services.age_estimator import AgeEstimator
from services.emotion_detector import EmotionDetector
from services.video_processor import VideoProcessor
from utils.image_utils import decode_base64_image, encode_image_to_base64
from config.settings import Config

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)

# Initialize extensions
cors = CORS(app, origins=app.config['CORS_ORIGINS'])
socketio = SocketIO(
    app, 
    cors_allowed_origins=app.config['CORS_ORIGINS'],
    async_mode='threading',
    logger=True,
    engineio_logger=True
)

# Global services (initialized on startup)
face_detector = None
age_estimator = None
emotion_detector = None
video_processor = None

# Performance metrics
metrics = {
    'total_requests': 0,
    'active_connections': 0,
    'avg_processing_time': 0,
    'fps': 0,
    'last_update': datetime.now()
}

def initialize_services():
    """Initialize all AI services and models."""
    global face_detector, age_estimator, emotion_detector, video_processor
    
    try:
        logger.info("Initializing AI services...")
        
        # Initialize face detection
        face_detector = FaceDetector()
        logger.info("Face detector initialized")
        
        # Initialize age estimation
        age_estimator = AgeEstimator()
        logger.info("Age estimator initialized")
        
        # Initialize emotion detection
        emotion_detector = EmotionDetector()
        logger.info("Emotion detector initialized")
        
        # Initialize video processor
        video_processor = VideoProcessor(
            face_detector=face_detector,
            age_estimator=age_estimator,
            emotion_detector=emotion_detector
        )
        logger.info("Video processor initialized")
        
        logger.info("All AI services initialized successfully")
        return True
        
    except Exception as e:
        logger.error(f"Failed to initialize services: {str(e)}")
        return False

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    global metrics
    
    health_status = {
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'services': {
            'face_detector': face_detector is not None,
            'age_estimator': age_estimator is not None,
            'emotion_detector': emotion_detector is not None,
            'video_processor': video_processor is not None
        },
        'metrics': metrics
    }
    
    return jsonify(health_status)

@app.route('/api/models', methods=['GET'])
def get_models_info():
    """Get information about loaded AI models."""
    models_info = {
        'face_detection': {
            'name': 'MediaPipe Face Detection',
            'version': '0.10.9',
            'loaded': face_detector is not None
        },
        'age_estimation': {
            'name': 'InsightFace ArcFace',
            'version': '0.7.3',
            'loaded': age_estimator is not None
        },
        'emotion_recognition': {
            'name': 'Vision Transformer FER2013+',
            'version': '2.15.0',
            'loaded': emotion_detector is not None
        }
    }
    
    return jsonify(models_info)

@app.route('/api/analyze', methods=['POST'])
def analyze_image():
    """Analyze a single uploaded image."""
    global metrics
    start_time = datetime.now()
    
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No image selected'}), 400
        
        # Read and process image
        image_data = file.read()
        image = Image.open(BytesIO(image_data))
        image_array = np.array(image)
        
        # Convert RGB to BGR for OpenCV
        if len(image_array.shape) == 3:
            image_array = cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)
        
        # Process image
        results = video_processor.process_frame(image_array)
        
        # Update metrics
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        metrics['total_requests'] += 1
        metrics['avg_processing_time'] = (
            metrics['avg_processing_time'] * 0.9 + processing_time * 0.1
        )
        
        return jsonify({
            'success': True,
            'results': results,
            'processing_time': processing_time,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error analyzing image: {str(e)}")
        return jsonify({'error': str(e)}), 500

# WebSocket event handlers
@socketio.on('connect')
def handle_connect():
    """Handle client connection."""
    global metrics
    metrics['active_connections'] += 1
    logger.info(f"Client connected. Active connections: {metrics['active_connections']}")
    
    emit('connected', {
        'status': 'connected',
        'server_time': datetime.now().isoformat(),
        'services_ready': all([
            face_detector is not None,
            age_estimator is not None,
            emotion_detector is not None
        ])
    })

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection."""
    global metrics
    metrics['active_connections'] = max(0, metrics['active_connections'] - 1)
    logger.info(f"Client disconnected. Active connections: {metrics['active_connections']}")

@socketio.on('video_frame')
def handle_video_frame(data):
    """Handle incoming video frame for real-time analysis."""
    try:
        start_time = datetime.now()
        
        # Decode base64 image
        image_data = data.get('data', '')
        timestamp = data.get('timestamp', datetime.now().timestamp())
        
        if not image_data:
            emit('error', {'message': 'No image data provided'})
            return
        
        # Decode image
        image = decode_base64_image(image_data)
        if image is None:
            emit('error', {'message': 'Failed to decode image'})
            return
        
        # Process frame
        results = video_processor.process_frame(image)

        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds() * 1000

        # Update FPS metric
        current_fps = 1000 / max(processing_time, 1)
        metrics['fps'] = metrics['fps'] * 0.9 + current_fps * 0.1

        # Debug: Log the results structure
        logger.info(f"Processing results: {type(results)}, keys: {results.keys() if isinstance(results, dict) else 'Not a dict'}")

        # Emit results
        if results and 'faces' in results and results['faces']:
            emit('face_detected', {
                'faces': results['faces'],
                'timestamp': timestamp,
                'processing_time': processing_time
            })
            
            if results['analysis']:
                emit('analysis_complete', {
                    'results': results['analysis'],
                    'timestamp': timestamp,
                    'processing_time': processing_time
                })
        elif results and 'faces' in results:
            emit('no_faces_detected', {
                'timestamp': timestamp,
                'processing_time': processing_time
            })
        else:
            # Handle case where results is malformed
            emit('error', {'message': f'Invalid processing results: {results}'})
            
    except Exception as e:
        logger.error(f"Error processing video frame: {str(e)}")
        emit('error', {'message': f'Processing error: {str(e)}'})

@socketio.on('get_metrics')
def handle_get_metrics():
    """Send current performance metrics to client."""
    emit('metrics_update', metrics)

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Initialize services
    if not initialize_services():
        logger.error("Failed to initialize services. Exiting.")
        exit(1)
    
    # Start the application
    logger.info("Starting IRIS Facial Analysis Backend...")
    logger.info(f"Debug mode: {app.config['DEBUG']}")
    logger.info(f"CORS origins: {app.config['CORS_ORIGINS']}")
    
    socketio.run(
        app,
        host='0.0.0.0',
        port=5001,
        debug=app.config['DEBUG'],
        use_reloader=False  # Disable reloader to prevent double initialization
    )
