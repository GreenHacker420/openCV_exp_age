"""
AI Models information and management routes for IRIS Facial Analysis Backend.
"""

import logging
from datetime import datetime
from flask import Blueprint, jsonify, request, current_app
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Create blueprint
models_bp = Blueprint('models', __name__, url_prefix='/api')

def get_model_info(model_name: str, service_instance: Any) -> Dict[str, Any]:
    """Get information about a specific model."""
    if service_instance is None:
        return {
            'name': model_name,
            'loaded': False,
            'error': 'Service not initialized'
        }
    
    # Try to get model information from the service
    try:
        if hasattr(service_instance, 'get_model_info'):
            return service_instance.get_model_info()
        else:
            return {
                'name': model_name,
                'loaded': True,
                'version': 'unknown'
            }
    except Exception as e:
        logger.error(f"Error getting model info for {model_name}: {str(e)}")
        return {
            'name': model_name,
            'loaded': False,
            'error': str(e)
        }

@models_bp.route('/models', methods=['GET'])
def get_models_info():
    """
    Get information about all loaded AI models.
    
    Returns:
        JSON response with model information including names, versions, and load status.
    """
    try:
        # Access services from Flask app context
        services = getattr(current_app, '_services', {})
        face_detector = services.get('face_detector')
        age_estimator = services.get('age_estimator')
        emotion_detector = services.get('emotion_detector')

        models_info = {
            'face_detection': {
                'name': 'MediaPipe Face Detection',
                'version': '0.10.9',
                'loaded': face_detector is not None,
                'description': 'Real-time face detection using MediaPipe',
                'capabilities': ['face_detection', 'face_landmarks']
            },
            'age_estimation': {
                'name': 'InsightFace ArcFace',
                'version': '0.7.3',
                'loaded': age_estimator is not None,
                'description': 'Age estimation using deep learning models',
                'capabilities': ['age_estimation']
            },
            'emotion_recognition': {
                'name': 'Vision Transformer FER2013+',
                'version': '2.15.0',
                'loaded': emotion_detector is not None,
                'description': 'Emotion recognition using computer vision',
                'capabilities': ['emotion_detection']
            }
        }
        
        # Add runtime information
        for model_key, model_info in models_info.items():
            if model_info['loaded']:
                model_info['status'] = 'ready'
                model_info['last_updated'] = datetime.now().isoformat()
            else:
                model_info['status'] = 'not_loaded'
                model_info['last_updated'] = None
        
        return jsonify({
            'models': models_info,
            'total_models': len(models_info),
            'loaded_models': sum(1 for m in models_info.values() if m['loaded']),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error retrieving models info: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve models information',
            'timestamp': datetime.now().isoformat(),
            'message': str(e)
        }), 500

@models_bp.route('/models/<model_name>', methods=['GET'])
def get_model_details(model_name: str):
    """
    Get detailed information about a specific model.
    
    Args:
        model_name: Name of the model to get details for
        
    Returns:
        JSON response with detailed model information.
    """
    try:
        # Access services from Flask app context
        services = getattr(current_app, '_services', {})
        face_detector = services.get('face_detector')
        age_estimator = services.get('age_estimator')
        emotion_detector = services.get('emotion_detector')

        model_map = {
            'face_detection': face_detector,
            'age_estimation': age_estimator,
            'emotion_recognition': emotion_detector
        }
        
        if model_name not in model_map:
            return jsonify({
                'error': f'Model "{model_name}" not found',
                'available_models': list(model_map.keys()),
                'timestamp': datetime.now().isoformat()
            }), 404
        
        service = model_map[model_name]
        model_info = get_model_info(model_name, service)
        
        # Add additional details
        model_info.update({
            'timestamp': datetime.now().isoformat(),
            'endpoint': f'/api/models/{model_name}'
        })
        
        return jsonify(model_info)
        
    except Exception as e:
        logger.error(f"Error retrieving model details for {model_name}: {str(e)}")
        return jsonify({
            'error': f'Failed to retrieve details for model "{model_name}"',
            'timestamp': datetime.now().isoformat(),
            'message': str(e)
        }), 500

@models_bp.route('/models/capabilities', methods=['GET'])
def get_model_capabilities():
    """
    Get information about all available model capabilities.
    
    Returns:
        JSON response with capability information.
    """
    try:
        capabilities = {
            'face_detection': {
                'description': 'Detect faces in images and video streams',
                'input_formats': ['image/jpeg', 'image/png', 'video/mp4'],
                'output_format': 'bounding_boxes_with_confidence',
                'real_time': True
            },
            'age_estimation': {
                'description': 'Estimate age from detected faces',
                'input_formats': ['face_region'],
                'output_format': 'age_value_with_confidence',
                'real_time': True
            },
            'emotion_detection': {
                'description': 'Detect emotions from facial expressions',
                'input_formats': ['face_region'],
                'output_format': 'emotion_probabilities',
                'real_time': True,
                'emotions': ['happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted', 'neutral']
            }
        }
        
        return jsonify({
            'capabilities': capabilities,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error retrieving model capabilities: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve model capabilities',
            'timestamp': datetime.now().isoformat(),
            'message': str(e)
        }), 500

@models_bp.errorhandler(404)
def models_not_found(error):
    """Handle 404 errors for models routes."""
    return jsonify({
        'error': 'Models endpoint not found',
        'timestamp': datetime.now().isoformat()
    }), 404

@models_bp.errorhandler(500)
def models_internal_error(error):
    """Handle 500 errors for models routes."""
    logger.error(f"Internal error in models route: {str(error)}")
    return jsonify({
        'error': 'Internal server error in models endpoint',
        'timestamp': datetime.now().isoformat()
    }), 500
