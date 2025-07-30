"""
Image processing utilities for the IRIS Facial Analysis Backend.
"""

import cv2
import numpy as np
import base64
from io import BytesIO
from PIL import Image
import logging

logger = logging.getLogger(__name__)

def decode_base64_image(base64_string):
    """
    Decode a base64 encoded image string to OpenCV format.
    
    Args:
        base64_string (str): Base64 encoded image data
        
    Returns:
        np.ndarray: OpenCV image array (BGR format) or None if failed
    """
    try:
        # Remove data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decode base64
        image_data = base64.b64decode(base64_string)
        
        # Convert to PIL Image
        pil_image = Image.open(BytesIO(image_data))
        
        # Convert to numpy array
        image_array = np.array(pil_image)
        
        # Convert RGB to BGR for OpenCV
        if len(image_array.shape) == 3 and image_array.shape[2] == 3:
            image_array = cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)
        elif len(image_array.shape) == 3 and image_array.shape[2] == 4:
            # Handle RGBA images
            image_array = cv2.cvtColor(image_array, cv2.COLOR_RGBA2BGR)
        
        return image_array
        
    except Exception as e:
        logger.error(f"Failed to decode base64 image: {str(e)}")
        return None

def encode_image_to_base64(image, format='JPEG', quality=85):
    """
    Encode an OpenCV image to base64 string.
    
    Args:
        image (np.ndarray): OpenCV image array (BGR format)
        format (str): Image format ('JPEG', 'PNG', etc.)
        quality (int): JPEG quality (1-100)
        
    Returns:
        str: Base64 encoded image string or None if failed
    """
    try:
        # Convert BGR to RGB for PIL
        if len(image.shape) == 3:
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        else:
            image_rgb = image
        
        # Convert to PIL Image
        pil_image = Image.fromarray(image_rgb)
        
        # Save to bytes buffer
        buffer = BytesIO()
        if format.upper() == 'JPEG':
            pil_image.save(buffer, format=format, quality=quality, optimize=True)
        else:
            pil_image.save(buffer, format=format)
        
        # Encode to base64
        image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        return f"data:image/{format.lower()};base64,{image_base64}"
        
    except Exception as e:
        logger.error(f"Failed to encode image to base64: {str(e)}")
        return None

def resize_image(image, max_size=640, maintain_aspect=True):
    """
    Resize an image while maintaining aspect ratio.
    
    Args:
        image (np.ndarray): Input image
        max_size (int): Maximum width or height
        maintain_aspect (bool): Whether to maintain aspect ratio
        
    Returns:
        np.ndarray: Resized image
    """
    try:
        height, width = image.shape[:2]
        
        if maintain_aspect:
            # Calculate scaling factor
            scale = min(max_size / width, max_size / height)
            
            if scale < 1.0:
                new_width = int(width * scale)
                new_height = int(height * scale)
                
                # Resize image
                resized = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)
                return resized
            else:
                return image
        else:
            # Resize to exact dimensions
            return cv2.resize(image, (max_size, max_size), interpolation=cv2.INTER_AREA)
            
    except Exception as e:
        logger.error(f"Failed to resize image: {str(e)}")
        return image

def preprocess_image(image, target_size=None, normalize=True):
    """
    Preprocess an image for AI model input.
    
    Args:
        image (np.ndarray): Input image
        target_size (tuple): Target size (width, height) or None
        normalize (bool): Whether to normalize pixel values to [0, 1]
        
    Returns:
        np.ndarray: Preprocessed image
    """
    try:
        processed = image.copy()
        
        # Resize if target size specified
        if target_size:
            processed = cv2.resize(processed, target_size, interpolation=cv2.INTER_AREA)
        
        # Normalize pixel values
        if normalize:
            processed = processed.astype(np.float32) / 255.0
        
        return processed
        
    except Exception as e:
        logger.error(f"Failed to preprocess image: {str(e)}")
        return image

def extract_face_region(image, bbox, padding=0.2):
    """
    Extract a face region from an image with optional padding.
    
    Args:
        image (np.ndarray): Input image
        bbox (tuple): Bounding box (x, y, width, height)
        padding (float): Padding factor (0.2 = 20% padding)
        
    Returns:
        np.ndarray: Extracted face region
    """
    try:
        x, y, w, h = bbox
        height, width = image.shape[:2]
        
        # Calculate padding
        pad_w = int(w * padding)
        pad_h = int(h * padding)
        
        # Calculate padded coordinates
        x1 = max(0, x - pad_w)
        y1 = max(0, y - pad_h)
        x2 = min(width, x + w + pad_w)
        y2 = min(height, y + h + pad_h)
        
        # Extract face region
        face_region = image[y1:y2, x1:x2]
        
        return face_region
        
    except Exception as e:
        logger.error(f"Failed to extract face region: {str(e)}")
        return image

def draw_face_box(image, bbox, label=None, confidence=None, color=(0, 255, 255)):
    """
    Draw a bounding box around a detected face.
    
    Args:
        image (np.ndarray): Input image
        bbox (tuple): Bounding box (x, y, width, height)
        label (str): Optional label text
        confidence (float): Optional confidence score
        color (tuple): Box color in BGR format
        
    Returns:
        np.ndarray: Image with drawn bounding box
    """
    try:
        result = image.copy()
        x, y, w, h = bbox
        
        # Draw bounding box
        cv2.rectangle(result, (x, y), (x + w, y + h), color, 2)
        
        # Draw label if provided
        if label or confidence:
            text_parts = []
            if label:
                text_parts.append(label)
            if confidence:
                text_parts.append(f"{confidence:.2f}")
            
            text = " - ".join(text_parts)
            
            # Calculate text size
            font = cv2.FONT_HERSHEY_SIMPLEX
            font_scale = 0.6
            thickness = 2
            (text_width, text_height), _ = cv2.getTextSize(text, font, font_scale, thickness)
            
            # Draw text background
            cv2.rectangle(result, (x, y - text_height - 10), (x + text_width, y), color, -1)
            
            # Draw text
            cv2.putText(result, text, (x, y - 5), font, font_scale, (0, 0, 0), thickness)
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to draw face box: {str(e)}")
        return image

def create_thumbnail(image, size=(150, 150)):
    """
    Create a thumbnail of an image.
    
    Args:
        image (np.ndarray): Input image
        size (tuple): Thumbnail size (width, height)
        
    Returns:
        np.ndarray: Thumbnail image
    """
    try:
        return cv2.resize(image, size, interpolation=cv2.INTER_AREA)
    except Exception as e:
        logger.error(f"Failed to create thumbnail: {str(e)}")
        return image
