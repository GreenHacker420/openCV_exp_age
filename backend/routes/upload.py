"""
File upload and management routes for IRIS Facial Analysis Backend.
"""

import os
import uuid
import logging
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from werkzeug.utils import secure_filename
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)

# Create blueprint
upload_bp = Blueprint('upload', __name__, url_prefix='/api')

def allowed_file(filename: str) -> bool:
    """Check if the uploaded file has an allowed extension."""
    if not filename:
        return False
    
    allowed_extensions = current_app.config.get('ALLOWED_EXTENSIONS', {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'})
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

def get_file_info(filepath: str) -> Dict[str, Any]:
    """Get information about an uploaded file."""
    try:
        stat = os.stat(filepath)
        return {
            'size': stat.st_size,
            'created': datetime.fromtimestamp(stat.st_ctime).isoformat(),
            'modified': datetime.fromtimestamp(stat.st_mtime).isoformat(),
            'exists': True
        }
    except OSError:
        return {'exists': False}

def ensure_upload_directory() -> str:
    """Ensure upload directory exists and return path."""
    upload_folder = current_app.config.get('UPLOAD_FOLDER', './uploads')
    
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder, exist_ok=True)
        logger.info(f"Created upload directory: {upload_folder}")
    
    return upload_folder

@upload_bp.route('/upload', methods=['POST'])
def upload_file():
    """
    Upload a file for analysis.
    
    Expects:
        Form data with 'image' file
        
    Returns:
        JSON response with upload information and file ID.
    """
    try:
        # Check if file is present
        if 'image' not in request.files:
            return jsonify({
                'error': 'No file provided',
                'timestamp': datetime.now().isoformat()
            }), 400
        
        file = request.files['image']
        
        if file.filename == '':
            return jsonify({
                'error': 'No file selected',
                'timestamp': datetime.now().isoformat()
            }), 400
        
        # Validate file type
        if not allowed_file(file.filename):
            return jsonify({
                'error': 'File type not allowed',
                'allowed_types': list(current_app.config.get('ALLOWED_EXTENSIONS', [])),
                'timestamp': datetime.now().isoformat()
            }), 400
        
        # Generate unique filename
        file_id = str(uuid.uuid4())
        original_filename = secure_filename(file.filename)
        file_extension = original_filename.rsplit('.', 1)[1].lower()
        filename = f"{file_id}.{file_extension}"
        
        # Ensure upload directory exists
        upload_folder = ensure_upload_directory()
        filepath = os.path.join(upload_folder, filename)
        
        # Save file
        file.save(filepath)
        
        # Get file information
        file_info = get_file_info(filepath)
        
        logger.info(f"File uploaded successfully: {filename} ({file_info['size']} bytes)")
        
        return jsonify({
            'success': True,
            'file_id': file_id,
            'filename': filename,
            'original_filename': original_filename,
            'url': f"/api/files/{file_id}",
            'file_info': file_info,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        return jsonify({
            'error': 'Upload failed',
            'message': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@upload_bp.route('/files/<file_id>', methods=['GET'])
def get_file(file_id: str):
    """
    Retrieve an uploaded file by ID.
    
    Args:
        file_id: Unique identifier for the file
        
    Returns:
        File content or JSON error response.
    """
    try:
        upload_folder = current_app.config.get('UPLOAD_FOLDER', './uploads')
        
        # Find file with matching ID (any extension)
        files = [f for f in os.listdir(upload_folder) if f.startswith(file_id + '.')]
        
        if not files:
            return jsonify({
                'error': 'File not found',
                'file_id': file_id,
                'timestamp': datetime.now().isoformat()
            }), 404
        
        filename = files[0]  # Take the first match
        
        return send_from_directory(upload_folder, filename)
        
    except Exception as e:
        logger.error(f"Error retrieving file {file_id}: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve file',
            'file_id': file_id,
            'message': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@upload_bp.route('/files/<file_id>/info', methods=['GET'])
def get_file_info_endpoint(file_id: str):
    """
    Get information about an uploaded file.
    
    Args:
        file_id: Unique identifier for the file
        
    Returns:
        JSON response with file information.
    """
    try:
        upload_folder = current_app.config.get('UPLOAD_FOLDER', './uploads')
        
        # Find file with matching ID
        files = [f for f in os.listdir(upload_folder) if f.startswith(file_id + '.')]
        
        if not files:
            return jsonify({
                'error': 'File not found',
                'file_id': file_id,
                'timestamp': datetime.now().isoformat()
            }), 404
        
        filename = files[0]
        filepath = os.path.join(upload_folder, filename)
        file_info = get_file_info(filepath)
        
        return jsonify({
            'file_id': file_id,
            'filename': filename,
            'url': f"/api/files/{file_id}",
            'file_info': file_info,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting file info for {file_id}: {str(e)}")
        return jsonify({
            'error': 'Failed to get file information',
            'file_id': file_id,
            'message': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@upload_bp.route('/files', methods=['GET'])
def list_files():
    """
    List all uploaded files.
    
    Returns:
        JSON response with list of uploaded files.
    """
    try:
        upload_folder = current_app.config.get('UPLOAD_FOLDER', './uploads')
        
        if not os.path.exists(upload_folder):
            return jsonify({
                'files': [],
                'total_files': 0,
                'timestamp': datetime.now().isoformat()
            })
        
        files = []
        for filename in os.listdir(upload_folder):
            if '.' in filename:
                file_id = filename.rsplit('.', 1)[0]
                filepath = os.path.join(upload_folder, filename)
                file_info = get_file_info(filepath)
                
                files.append({
                    'file_id': file_id,
                    'filename': filename,
                    'url': f"/api/files/{file_id}",
                    'file_info': file_info
                })
        
        return jsonify({
            'files': files,
            'total_files': len(files),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error listing files: {str(e)}")
        return jsonify({
            'error': 'Failed to list files',
            'message': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@upload_bp.route('/files/<file_id>', methods=['DELETE'])
def delete_file(file_id: str):
    """
    Delete an uploaded file.
    
    Args:
        file_id: Unique identifier for the file
        
    Returns:
        JSON response confirming deletion.
    """
    try:
        upload_folder = current_app.config.get('UPLOAD_FOLDER', './uploads')
        
        # Find file with matching ID
        files = [f for f in os.listdir(upload_folder) if f.startswith(file_id + '.')]
        
        if not files:
            return jsonify({
                'error': 'File not found',
                'file_id': file_id,
                'timestamp': datetime.now().isoformat()
            }), 404
        
        filename = files[0]
        filepath = os.path.join(upload_folder, filename)
        
        os.remove(filepath)
        logger.info(f"File deleted: {filename}")
        
        return jsonify({
            'success': True,
            'message': 'File deleted successfully',
            'file_id': file_id,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error deleting file {file_id}: {str(e)}")
        return jsonify({
            'error': 'Failed to delete file',
            'file_id': file_id,
            'message': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@upload_bp.errorhandler(413)
def upload_payload_too_large(error):
    """Handle payload too large errors."""
    return jsonify({
        'error': 'File too large',
        'max_size': '16MB',
        'timestamp': datetime.now().isoformat()
    }), 413

@upload_bp.errorhandler(500)
def upload_internal_error(error):
    """Handle 500 errors for upload routes."""
    logger.error(f"Internal error in upload route: {str(error)}")
    return jsonify({
        'error': 'Internal server error in upload endpoint',
        'timestamp': datetime.now().isoformat()
    }), 500
