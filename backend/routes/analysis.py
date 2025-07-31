"""
Image and video analysis routes for IRIS Facial Analysis Backend.
"""

import logging
import cv2
import numpy as np
import base64
from datetime import datetime
from flask import Blueprint, request, jsonify
from io import BytesIO
from PIL import Image
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Create blueprint
analysis_bp = Blueprint('analysis', __name__, url_prefix='/api')

def validate_analysis_request(data: Dict[str, Any]) -> tuple[bool, Optional[str]]:
    """Validate analysis request data."""
    if not data:
        return False, "No data provided"
    
    if 'image' not in data:
        return False, "No image data provided"
    
    if not data['image']:
        return False, "Empty image data"
    
    return True, None

def process_image_data(image_data: str) -> Optional[np.ndarray]:
    """Process base64 image data and return numpy array."""
    try:
        # Remove data URL prefix if present
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        # Decode base64
        image_bytes = base64.b64decode(image_data)
        
        # Convert to PIL Image
        pil_image = Image.open(BytesIO(image_bytes))
        
        # Convert to numpy array
        image_array = np.array(pil_image)
        
        # Convert RGB to BGR for OpenCV
        if len(image_array.shape) == 3 and image_array.shape[2] == 3:
            image_array = cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)
        
        return image_array
        
    except Exception as e:
        logger.error(f"Error processing image data: {str(e)}")
        return None

@analysis_bp.route('/analyze', methods=['POST'])
def analyze_image():
    """
    Analyze a single uploaded image for faces, age, and emotions.
    
    Expects:
        - Form data with 'image' file, OR
        - JSON data with base64 encoded image
        
    Returns:
        JSON response with analysis results.
    """
    try:
        from app import video_processor, metrics
        
        if not video_processor:
            return jsonify({
                'error': 'Video processor not initialized',
                'timestamp': datetime.now().isoformat()
            }), 503
        
        start_time = datetime.now()
        image_array = None
        
        # Handle file upload
        if 'image' in request.files:
            file = request.files['image']
            if file.filename == '':
                return jsonify({
                    'error': 'No image selected',
                    'timestamp': datetime.now().isoformat()
                }), 400
            
            # Read and process image
            image_data = file.read()
            image = Image.open(BytesIO(image_data))
            image_array = np.array(image)
            
            # Convert RGB to BGR for OpenCV
            if len(image_array.shape) == 3:
                image_array = cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)
        
        # Handle JSON with base64 image
        elif request.is_json:
            data = request.get_json()
            is_valid, error_msg = validate_analysis_request(data)
            
            if not is_valid:
                return jsonify({
                    'error': error_msg,
                    'timestamp': datetime.now().isoformat()
                }), 400
            
            image_array = process_image_data(data['image'])
            if image_array is None:
                return jsonify({
                    'error': 'Failed to process image data',
                    'timestamp': datetime.now().isoformat()
                }), 400
        
        else:
            return jsonify({
                'error': 'No image provided. Use form data or JSON with base64 image.',
                'timestamp': datetime.now().isoformat()
            }), 400
        
        # Process image
        results = video_processor.process_frame(image_array)
        
        # Update metrics
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        metrics['total_requests'] += 1
        metrics['avg_processing_time'] = (
            metrics['avg_processing_time'] * 0.9 + processing_time * 0.1
        )
        metrics['last_update'] = datetime.now()
        
        return jsonify({
            'success': True,
            'results': results,
            'processing_time': processing_time,
            'timestamp': datetime.now().isoformat(),
            'image_info': {
                'width': image_array.shape[1],
                'height': image_array.shape[0],
                'channels': image_array.shape[2] if len(image_array.shape) > 2 else 1
            }
        })
        
    except Exception as e:
        logger.error(f"Error analyzing image: {str(e)}")
        return jsonify({
            'error': 'Analysis failed',
            'message': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@analysis_bp.route('/analyze/batch', methods=['POST'])
def analyze_batch():
    """
    Analyze multiple images in a batch.
    
    Expects:
        JSON data with array of base64 encoded images
        
    Returns:
        JSON response with batch analysis results.
    """
    try:
        from app import video_processor
        
        if not video_processor:
            return jsonify({
                'error': 'Video processor not initialized',
                'timestamp': datetime.now().isoformat()
            }), 503
        
        if not request.is_json:
            return jsonify({
                'error': 'JSON data required for batch analysis',
                'timestamp': datetime.now().isoformat()
            }), 400
        
        data = request.get_json()
        images = data.get('images', [])
        
        if not images:
            return jsonify({
                'error': 'No images provided',
                'timestamp': datetime.now().isoformat()
            }), 400
        
        if len(images) > 10:  # Limit batch size
            return jsonify({
                'error': 'Batch size too large (max 10 images)',
                'timestamp': datetime.now().isoformat()
            }), 400
        
        start_time = datetime.now()
        results = []
        
        for i, image_data in enumerate(images):
            try:
                image_array = process_image_data(image_data)
                if image_array is not None:
                    result = video_processor.process_frame(image_array)
                    results.append({
                        'index': i,
                        'success': True,
                        'result': result
                    })
                else:
                    results.append({
                        'index': i,
                        'success': False,
                        'error': 'Failed to process image'
                    })
            except Exception as e:
                results.append({
                    'index': i,
                    'success': False,
                    'error': str(e)
                })
        
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        return jsonify({
            'success': True,
            'results': results,
            'total_images': len(images),
            'successful_analyses': sum(1 for r in results if r['success']),
            'processing_time': processing_time,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in batch analysis: {str(e)}")
        return jsonify({
            'error': 'Batch analysis failed',
            'message': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@analysis_bp.errorhandler(413)
def analysis_payload_too_large(error):
    """Handle payload too large errors."""
    return jsonify({
        'error': 'Image file too large',
        'max_size': '16MB',
        'timestamp': datetime.now().isoformat()
    }), 413

@analysis_bp.errorhandler(415)
def analysis_unsupported_media_type(error):
    """Handle unsupported media type errors."""
    return jsonify({
        'error': 'Unsupported media type',
        'supported_types': ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'],
        'timestamp': datetime.now().isoformat()
    }), 415

@analysis_bp.errorhandler(500)
def analysis_internal_error(error):
    """Handle 500 errors for analysis routes."""
    logger.error(f"Internal error in analysis route: {str(error)}")
    return jsonify({
        'error': 'Internal server error in analysis endpoint',
        'timestamp': datetime.now().isoformat()
    }), 500
