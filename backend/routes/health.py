"""
Health check and system status routes for IRIS Facial Analysis Backend.
"""

import logging
from datetime import datetime
from flask import Blueprint, jsonify, current_app, g
from typing import Dict, Any

logger = logging.getLogger(__name__)

# Create blueprint
health_bp = Blueprint('health', __name__, url_prefix='/api')

def get_service_status() -> Dict[str, bool]:
    """Get the status of all AI services."""
    try:
        # Access services from Flask app context
        services = getattr(current_app, '_services', {})
        return {
            'face_detector': services.get('face_detector') is not None,
            'age_estimator': services.get('age_estimator') is not None,
            'emotion_detector': services.get('emotion_detector') is not None,
            'video_processor': services.get('video_processor') is not None
        }
    except Exception:
        return {
            'face_detector': False,
            'age_estimator': False,
            'emotion_detector': False,
            'video_processor': False
        }

def get_system_metrics() -> Dict[str, Any]:
    """Get current system performance metrics."""
    try:
        # Access metrics from Flask app context
        metrics = getattr(current_app, '_metrics', {})

        # Convert datetime to ISO string for JSON serialization
        metrics_copy = metrics.copy()
        if 'last_update' in metrics_copy and isinstance(metrics_copy['last_update'], datetime):
            metrics_copy['last_update'] = metrics_copy['last_update'].isoformat()

        return metrics_copy
    except Exception:
        return {
            'total_requests': 0,
            'active_connections': 0,
            'avg_processing_time': 0,
            'fps': 0,
            'last_update': datetime.now().isoformat()
        }

@health_bp.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint.
    
    Returns:
        JSON response with system health status, service availability, and metrics.
    """
    try:
        health_status = {
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'services': get_service_status(),
            'metrics': get_system_metrics()
        }
        
        # Check if all critical services are running
        services = health_status['services']
        all_services_healthy = all([
            services.get('face_detector', False),
            services.get('video_processor', False)
        ])
        
        if not all_services_healthy:
            health_status['status'] = 'degraded'
            logger.warning("Some critical services are not available")
        
        status_code = 200 if all_services_healthy else 503
        return jsonify(health_status), status_code
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({
            'status': 'unhealthy',
            'timestamp': datetime.now().isoformat(),
            'error': str(e)
        }), 500

@health_bp.route('/status', methods=['GET'])
def system_status():
    """
    Detailed system status endpoint.
    
    Returns:
        JSON response with detailed system information.
    """
    try:
        import psutil
        import platform
        
        status = {
            'timestamp': datetime.now().isoformat(),
            'system': {
                'platform': platform.system(),
                'platform_version': platform.version(),
                'architecture': platform.machine(),
                'python_version': platform.python_version()
            },
            'resources': {
                'cpu_percent': psutil.cpu_percent(interval=1),
                'memory_percent': psutil.virtual_memory().percent,
                'disk_percent': psutil.disk_usage('/').percent
            },
            'services': get_service_status(),
            'metrics': get_system_metrics()
        }
        
        return jsonify(status)
        
    except Exception as e:
        logger.error(f"System status check failed: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve system status',
            'timestamp': datetime.now().isoformat(),
            'message': str(e)
        }), 500

@health_bp.route('/ping', methods=['GET'])
def ping():
    """
    Simple ping endpoint for basic connectivity testing.
    
    Returns:
        JSON response with pong message and timestamp.
    """
    return jsonify({
        'message': 'pong',
        'timestamp': datetime.now().isoformat()
    })

@health_bp.errorhandler(404)
def health_not_found(error):
    """Handle 404 errors for health routes."""
    return jsonify({
        'error': 'Health endpoint not found',
        'timestamp': datetime.now().isoformat()
    }), 404

@health_bp.errorhandler(500)
def health_internal_error(error):
    """Handle 500 errors for health routes."""
    logger.error(f"Internal error in health route: {str(error)}")
    return jsonify({
        'error': 'Internal server error in health check',
        'timestamp': datetime.now().isoformat()
    }), 500
