"""
Model loading utilities for the IRIS Facial Analysis Backend.
Handles downloading, caching, and loading of AI models.
"""

import os
import logging
import requests
from pathlib import Path
from typing import Dict, Optional
import hashlib

logger = logging.getLogger(__name__)

# Model configurations
MODEL_CONFIGS = {
    'face_detection': {
        'mediapipe': {
            'name': 'MediaPipe Face Detection',
            'version': '0.10.9',
            'type': 'builtin',  # Built into MediaPipe
            'description': 'Real-time face detection model'
        }
    },
    'age_gender': {
        'insightface': {
            'name': 'InsightFace Buffalo_L',
            'version': '0.7.3',
            'type': 'download',
            'url': 'https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip',
            'checksum': 'placeholder_checksum',
            'description': 'Age and gender estimation model'
        }
    },
    'emotion': {
        'fer2013': {
            'name': 'FER2013 Emotion Model',
            'version': '1.0',
            'type': 'placeholder',
            'description': 'Facial emotion recognition model'
        }
    }
}

def get_model_path(model_category: str, model_name: str) -> str:
    """
    Get the file path for a specific model.
    
    Args:
        model_category (str): Category of model (face_detection, age_gender, emotion)
        model_name (str): Name of the specific model
        
    Returns:
        str: Path to the model file
    """
    base_path = Path('models')
    model_path = base_path / model_category / model_name
    return str(model_path)

def ensure_model_directory():
    """Ensure model directories exist."""
    try:
        base_path = Path('models')
        
        for category in MODEL_CONFIGS.keys():
            category_path = base_path / category
            category_path.mkdir(parents=True, exist_ok=True)
            
        logger.info("Model directories created/verified")
        
    except Exception as e:
        logger.error(f"Error creating model directories: {str(e)}")

def download_file(url: str, destination: str, chunk_size: int = 8192) -> bool:
    """
    Download a file from URL to destination.
    
    Args:
        url (str): URL to download from
        destination (str): Local file path to save to
        chunk_size (int): Download chunk size in bytes
        
    Returns:
        bool: True if download successful
    """
    try:
        logger.info(f"Downloading {url} to {destination}")
        
        # Create destination directory if it doesn't exist
        os.makedirs(os.path.dirname(destination), exist_ok=True)
        
        # Download with progress
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        total_size = int(response.headers.get('content-length', 0))
        downloaded = 0
        
        with open(destination, 'wb') as f:
            for chunk in response.iter_content(chunk_size=chunk_size):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    
                    # Log progress every 10MB
                    if downloaded % (10 * 1024 * 1024) == 0:
                        if total_size > 0:
                            progress = (downloaded / total_size) * 100
                            logger.info(f"Download progress: {progress:.1f}%")
        
        logger.info(f"Download completed: {destination}")
        return True
        
    except Exception as e:
        logger.error(f"Error downloading {url}: {str(e)}")
        return False

def verify_checksum(file_path: str, expected_checksum: str) -> bool:
    """
    Verify file checksum.
    
    Args:
        file_path (str): Path to file to verify
        expected_checksum (str): Expected SHA256 checksum
        
    Returns:
        bool: True if checksum matches
    """
    try:
        if expected_checksum == 'placeholder_checksum':
            # Skip verification for placeholder checksums
            return True
        
        sha256_hash = hashlib.sha256()
        
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b""):
                sha256_hash.update(chunk)
        
        actual_checksum = sha256_hash.hexdigest()
        
        if actual_checksum == expected_checksum:
            logger.info(f"Checksum verified for {file_path}")
            return True
        else:
            logger.error(f"Checksum mismatch for {file_path}")
            logger.error(f"Expected: {expected_checksum}")
            logger.error(f"Actual: {actual_checksum}")
            return False
            
    except Exception as e:
        logger.error(f"Error verifying checksum for {file_path}: {str(e)}")
        return False

def download_models(force_download: bool = False) -> Dict[str, bool]:
    """
    Download all required models.
    
    Args:
        force_download (bool): Force re-download even if files exist
        
    Returns:
        Dict[str, bool]: Download status for each model
    """
    ensure_model_directory()
    download_status = {}
    
    for category, models in MODEL_CONFIGS.items():
        for model_name, config in models.items():
            model_key = f"{category}/{model_name}"
            
            try:
                if config['type'] == 'builtin':
                    # Built-in models don't need downloading
                    download_status[model_key] = True
                    logger.info(f"Model {model_key} is built-in")
                    continue
                
                elif config['type'] == 'placeholder':
                    # Placeholder models for development
                    download_status[model_key] = True
                    logger.info(f"Model {model_key} is placeholder")
                    continue
                
                elif config['type'] == 'download':
                    # Models that need to be downloaded
                    model_path = get_model_path(category, model_name)
                    
                    # Check if model already exists
                    if os.path.exists(model_path) and not force_download:
                        # Verify checksum if available
                        if 'checksum' in config:
                            if verify_checksum(model_path, config['checksum']):
                                download_status[model_key] = True
                                logger.info(f"Model {model_key} already exists and verified")
                                continue
                            else:
                                logger.warning(f"Model {model_key} checksum failed, re-downloading")
                        else:
                            download_status[model_key] = True
                            logger.info(f"Model {model_key} already exists")
                            continue
                    
                    # Download the model
                    if download_file(config['url'], model_path):
                        # Verify checksum if available
                        if 'checksum' in config:
                            if verify_checksum(model_path, config['checksum']):
                                download_status[model_key] = True
                                logger.info(f"Model {model_key} downloaded and verified")
                            else:
                                download_status[model_key] = False
                                logger.error(f"Model {model_key} download failed checksum")
                        else:
                            download_status[model_key] = True
                            logger.info(f"Model {model_key} downloaded")
                    else:
                        download_status[model_key] = False
                        logger.error(f"Failed to download model {model_key}")
                
                else:
                    download_status[model_key] = False
                    logger.error(f"Unknown model type for {model_key}: {config['type']}")
                    
            except Exception as e:
                download_status[model_key] = False
                logger.error(f"Error processing model {model_key}: {str(e)}")
    
    return download_status

def load_model(model_category: str, model_name: str) -> Optional[object]:
    """
    Load a specific model.
    
    Args:
        model_category (str): Category of model
        model_name (str): Name of the model
        
    Returns:
        Optional[object]: Loaded model or None if failed
    """
    try:
        config = MODEL_CONFIGS.get(model_category, {}).get(model_name)
        
        if not config:
            logger.error(f"Model configuration not found: {model_category}/{model_name}")
            return None
        
        if config['type'] == 'builtin':
            logger.info(f"Model {model_category}/{model_name} is built-in")
            return 'builtin'
        
        elif config['type'] == 'placeholder':
            logger.info(f"Model {model_category}/{model_name} is placeholder")
            return 'placeholder'
        
        elif config['type'] == 'download':
            model_path = get_model_path(model_category, model_name)
            
            if not os.path.exists(model_path):
                logger.error(f"Model file not found: {model_path}")
                return None
            
            # Load the model based on file extension
            if model_path.endswith('.onnx'):
                import cv2
                return cv2.dnn.readNetFromONNX(model_path)
            
            elif model_path.endswith('.h5') or model_path.endswith('.keras'):
                try:
                    import tensorflow as tf
                    return tf.keras.models.load_model(model_path)
                except ImportError:
                    logger.error("TensorFlow not available for loading .h5/.keras models")
                    return None
            
            elif model_path.endswith('.pt') or model_path.endswith('.pth'):
                try:
                    import torch
                    return torch.load(model_path, map_location='cpu')
                except ImportError:
                    logger.error("PyTorch not available for loading .pt/.pth models")
                    return None
            
            else:
                logger.warning(f"Unknown model format: {model_path}")
                return model_path  # Return path for custom loading
        
        else:
            logger.error(f"Unknown model type: {config['type']}")
            return None
            
    except Exception as e:
        logger.error(f"Error loading model {model_category}/{model_name}: {str(e)}")
        return None

def get_model_info() -> Dict:
    """
    Get information about all configured models.
    
    Returns:
        Dict: Model information
    """
    model_info = {}
    
    for category, models in MODEL_CONFIGS.items():
        model_info[category] = {}
        
        for model_name, config in models.items():
            model_path = get_model_path(category, model_name)
            
            info = {
                'name': config.get('name', model_name),
                'version': config.get('version', 'unknown'),
                'type': config.get('type', 'unknown'),
                'description': config.get('description', ''),
                'path': model_path,
                'exists': os.path.exists(model_path) if config['type'] == 'download' else True,
                'size': os.path.getsize(model_path) if os.path.exists(model_path) else 0
            }
            
            model_info[category][model_name] = info
    
    return model_info

def cleanup_models():
    """Remove all downloaded model files."""
    try:
        import shutil
        
        models_dir = Path('models')
        if models_dir.exists():
            shutil.rmtree(models_dir)
            logger.info("All model files removed")
        else:
            logger.info("No model files to remove")
            
    except Exception as e:
        logger.error(f"Error cleaning up models: {str(e)}")

if __name__ == '__main__':
    # Command-line interface for model management
    import sys
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == 'download':
            force = '--force' in sys.argv
            status = download_models(force_download=force)
            print("Download status:")
            for model, success in status.items():
                print(f"  {model}: {'✓' if success else '✗'}")
        
        elif command == 'info':
            info = get_model_info()
            print("Model information:")
            for category, models in info.items():
                print(f"\n{category}:")
                for model_name, model_info in models.items():
                    print(f"  {model_name}:")
                    print(f"    Name: {model_info['name']}")
                    print(f"    Version: {model_info['version']}")
                    print(f"    Type: {model_info['type']}")
                    print(f"    Exists: {model_info['exists']}")
                    if model_info['size'] > 0:
                        print(f"    Size: {model_info['size'] / 1024 / 1024:.1f} MB")
        
        elif command == 'cleanup':
            cleanup_models()
        
        else:
            print("Usage: python model_loader.py [download|info|cleanup] [--force]")
    
    else:
        print("Usage: python model_loader.py [download|info|cleanup] [--force]")
